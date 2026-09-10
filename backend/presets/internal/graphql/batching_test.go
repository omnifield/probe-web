package graphql

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"sync"
	"testing"

	gqlhandler "github.com/99designs/gqlgen/graphql/handler"

	"presets/internal/graphql/generated"
	"presets/internal/graphql/loaders"
	"presets/internal/limits"
	presetsmodel "presets/internal/model"
	"presets/internal/store"
)

// countingStore — оборачивает реальный *store.Store и считает вызовы List/GetMany. Единственная
// цель — измерить, а не прочитать по коду: утверждение "N+1 не переехал на сервер" до этого теста
// стояло на чтении dataloadgen (code-read), а не на счётчике поверх реального запроса (measured) —
// ровно тот разрыв, из-за которого весь этот разговор начался в корневом ROADMAP.yaml.
type countingStore struct {
	*store.Store
	mu           sync.Mutex
	listCalls    int
	getManyCalls int
}

func (c *countingStore) List(kind *string) ([]presetsmodel.Meta, error) {
	c.mu.Lock()
	c.listCalls++
	c.mu.Unlock()
	return c.Store.List(kind)
}

func (c *countingStore) GetMany(ids []string) (map[string]*presetsmodel.Record, error) {
	c.mu.Lock()
	c.getManyCalls++
	c.mu.Unlock()
	return c.Store.GetMany(ids)
}

// runBatchedOutfitsQuery заводит n нарядов (общая палитра, у каждого своя форма), гоняет РЕАЛЬНЫЙ
// GraphQL-запрос (тот же generated.NewExecutableSchema + handler.NewDefaultServer, что в
// cmd/presets, не резолверы напрямую) через httptest-сервер и возвращает, сколько раз запрос
// дошёл до store.List/GetMany — а заодно проверяет, что связи резолвились ПРАВИЛЬНО, не только
// быстро.
func runBatchedOutfitsQuery(t *testing.T, n int) (listCalls, getManyCalls int) {
	t.Helper()

	s := openTestStore(t)
	create(t, s, "palette", "brand", `{"name":"brand"}`)
	for i := 0; i < n; i++ {
		name := fmt.Sprintf("form-%d", i)
		create(t, s, "form", name, fmt.Sprintf(`{"name":%q,"component":"button","recipe":{}}`, name))
	}
	for i := 0; i < n; i++ {
		outfitName := fmt.Sprintf("outfit-%d", i)
		formName := fmt.Sprintf("form-%d", i)
		create(t, s, "outfit", outfitName, fmt.Sprintf(
			`{"name":%q,"palette":"brand","forms":[%q]}`, outfitName, formName,
		))
	}

	counting := &countingStore{Store: s}
	resolver := New(counting, limits.Default)
	gqlServer := gqlhandler.NewDefaultServer(generated.NewExecutableSchema(generated.Config{Resolvers: resolver}))

	mux := http.NewServeMux()
	mux.Handle("/graphql", gqlServer)
	server := httptest.NewServer(loaders.Middleware(counting)(mux))
	defer server.Close()

	query := `{ presets(kind: "outfit") { name ... on Outfit { palette { name } forms { name component } } } }`
	reqBody, err := json.Marshal(map[string]string{"query": query})
	if err != nil {
		t.Fatalf("marshal query: %v", err)
	}

	resp, err := http.Post(server.URL+"/graphql", "application/json", bytes.NewReader(reqBody))
	if err != nil {
		t.Fatalf("POST /graphql: %v", err)
	}
	defer resp.Body.Close()

	var parsed struct {
		Errors []struct {
			Message string `json:"message"`
		} `json:"errors"`
		Data struct {
			Presets []struct {
				Name    string `json:"name"`
				Palette struct {
					Name string `json:"name"`
				} `json:"palette"`
				Forms []struct {
					Name      string `json:"name"`
					Component string `json:"component"`
				} `json:"forms"`
			} `json:"presets"`
		} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&parsed); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if len(parsed.Errors) > 0 {
		t.Fatalf("GraphQL-запрос вернул ошибки: %+v", parsed.Errors)
	}

	// Корректность данных — не только счётчик: если бы батчинг что-то перепутал (не тот id той
	// формы), это тоже был бы провал, а не только рост числа вызовов.
	if len(parsed.Data.Presets) != n {
		t.Fatalf("ожидалось %d нарядов, получено %d", n, len(parsed.Data.Presets))
	}
	for _, outfit := range parsed.Data.Presets {
		if outfit.Palette.Name != "brand" {
			t.Errorf("%s: palette-связь разошлась: %+v", outfit.Name, outfit.Palette)
		}
		if len(outfit.Forms) != 1 || outfit.Forms[0].Component != "button" {
			t.Errorf("%s: forms-связь разошлась: %+v", outfit.Name, outfit.Forms)
		}
	}

	t.Logf("N=%d: List() вызван %d раз, GetMany() вызван %d раз", n, counting.listCalls, counting.getManyCalls)
	return counting.listCalls, counting.getManyCalls
}

// TestBatchingCollapsesToConstantCalls — доказывает O(1), а не просто "мало при одном N": гоняет
// запрос при ДВУХ разных N и требует РАВНОГО числа вызовов store. Число вызовов, растущее вместе
// с N (даже медленно), провалило бы это сравнение — в отличие от проверки "меньше потолка при
// одном N", которая могла бы случайно пройти и при скрытом линейном росте с маленьким углом.
func TestBatchingCollapsesToConstantCalls(t *testing.T) {
	smallList, smallGetMany := runBatchedOutfitsQuery(t, 5)
	largeList, largeGetMany := runBatchedOutfitsQuery(t, 50)

	if smallList != largeList {
		t.Errorf("List() вызван %d раз при N=5 и %d раз при N=50 — растёт с N, не батчится", smallList, largeList)
	}
	if smallGetMany != largeGetMany {
		t.Errorf("GetMany() вызван %d раз при N=5 и %d раз при N=50 — растёт с N, не батчится", smallGetMany, largeGetMany)
	}

	// Отдельно — что число вызовов маленькое, а не просто одинаковое (одинаково большое тоже
	// прошло бы сравнение выше, но было бы такой же бедой).
	const maxCalls = 6
	if smallList > maxCalls || smallGetMany > maxCalls {
		t.Errorf("список/связи вида N=5 стоили %d List + %d GetMany — слишком много для батчинга (граница %d)", smallList, smallGetMany, maxCalls)
	}
}
