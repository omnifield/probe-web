// Package loaders — дата-лоадеры для GraphQL-резолверов: собирают конкурентные запросы одного
// GraphQL-запроса в батч, вместо запроса на каждую связь (no-server-side-n-plus-one, ROADMAP.yaml).
// Живут РОВНО один HTTP-запрос — заводятся заново в Middleware/Attach, кэш не должен пережить
// запрос (иначе один клиент рискует увидеть закэшированное чужим запросом).
package loaders

import (
	"context"
	"net/http"

	"github.com/vikstrous/dataloadgen"

	"presets/internal/model"
)

type ctxKey struct{}

// Store — узкий контракт, который реально нужен лоадерам от хранилища (не весь *store.Store).
// Интерфейс, а не конкретный тип, — граница, через которую тест подставляет считающую обёртку и
// измеряет батчинг, а не верит чтению кода на слово (см. TestBatchingCollapsesToConstantCalls,
// resolver_test.go).
type Store interface {
	List(kind *string) ([]model.Meta, error)
	GetMany(ids []string) (map[string]*model.Record, error)
}

// Loaders — держатель обоих лоадеров запроса.
type Loaders struct {
	// KindIndex — по ярлыку вида отдаёт карту "имя записи → id". Backed by store.List (уже
	// дешёвый вызов без state) — лоадер здесь в первую очередь ради КЭША: без него одна и та же
	// сотня outfit-резолверов вида "palette" передёргивала бы List("palette") сто раз за запрос.
	KindIndex *dataloadgen.Loader[string, map[string]string]
	// Record — по id отдаёт запись целиком. Backed by store.GetMany — конкурентные Load() из
	// разных полевых резолверов одного тика схлопываются в ОДНУ транзакцию хранилища.
	Record *dataloadgen.Loader[string, *model.Record]
}

// New заводит свежую пару лоадеров поверх открытого хранилища.
func New(s Store) *Loaders {
	return &Loaders{
		KindIndex: dataloadgen.NewMappedLoader(func(_ context.Context, labels []string) (map[string]map[string]string, error) {
			result := make(map[string]map[string]string, len(labels))
			for _, label := range labels {
				metas, err := s.List(&label)
				if err != nil {
					return nil, err
				}
				byName := make(map[string]string, len(metas))
				for _, meta := range metas {
					if meta.Name != "" {
						byName[meta.Name] = meta.ID
					}
				}
				result[label] = byName
			}
			return result, nil
		}),
		Record: dataloadgen.NewMappedLoader(func(_ context.Context, ids []string) (map[string]*model.Record, error) {
			return s.GetMany(ids)
		}),
	}
}

// Attach кладёт свежие лоадеры в контекст — используется и Middleware, и тестами, которые зовут
// резолверы напрямую, без HTTP.
func Attach(ctx context.Context, s Store) context.Context {
	return context.WithValue(ctx, ctxKey{}, New(s))
}

// Middleware заводит лоадеры на каждый входящий запрос.
func Middleware(s Store) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			next.ServeHTTP(w, r.WithContext(Attach(r.Context(), s)))
		})
	}
}

// For достаёт лоадеры текущего запроса. nil, если Attach/Middleware не были вызваны — вызывающий
// код (резолверы) решает, что с этим делать; молчаливого дефолта нет нарочно.
func For(ctx context.Context) *Loaders {
	ls, _ := ctx.Value(ctxKey{}).(*Loaders)
	return ls
}
