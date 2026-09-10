// Package store — хранилище пресетов поверх bbolt. Кладёт JSON и отдаёт обратно; ЧТО именно
// лежит внутри состояния — не его дело (PROBEWEB-8): оно ни разу не заглядывает в состояние, не
// проверяет условия и не мигрирует версии. Понимание формата живёт у ВЛАДЕЛЬЦА ВИДА (kind).
//
// Один файл базы (bbolt: B+Tree, один mmap-файл, ACID-транзакции) вместо файла на запись.
// Транзакция bbolt сериализует все записи сама — отдельных счётчиков "занято, но ещё не
// записано" (как требовалось при файлах на диске, чтобы две гонящиеся записи не проехали предел
// одновременно) здесь не нужно: проверка предела и сама запись происходят в ОДНОЙ транзакции.
package store

import (
	"bytes"
	"crypto/rand"
	"encoding/binary"
	"encoding/json"
	"fmt"
	"sort"
	"time"

	"go.etcd.io/bbolt"

	"presets/internal/limits"
	"presets/internal/model"
)

var (
	bucketMeta     = []byte("meta")     // id -> Meta (JSON)
	bucketState    = []byte("state")    // id -> State (сырые байты, как приехали)
	bucketNames    = []byte("names")    // kind\x00name -> id
	bucketStats    = []byte("stats")    // служебные счётчики: totalBytes, size\x00{id}
	bucketFeedback = []byte("feedback") // id -> FeedbackEntry (JSON) — своя сущность, не Preset
)

// statsTotalBytesKey — ключ в bucketStats, под которым лежит текущий занятый объём.
var statsTotalBytesKey = []byte("totalBytes")

// Store — открытая база. bbolt держит эксклюзивный флок на файле: второй процесс на том же
// файле не поднимется вовсе, а не молча разойдётся с первым, как было бы у файлов на диске.
type Store struct {
	db     *bbolt.DB
	limits limits.Limits
}

// Open открывает (и создаёт при отсутствии) базу по пути. Каталог должен существовать.
func Open(path string, lim limits.Limits) (*Store, error) {
	db, err := bbolt.Open(path, 0o600, &bbolt.Options{Timeout: 2 * time.Second})
	if err != nil {
		return nil, fmt.Errorf("presets: не открыть базу %s: %w", path, err)
	}

	err = db.Update(func(tx *bbolt.Tx) error {
		for _, name := range [][]byte{bucketMeta, bucketState, bucketNames, bucketStats, bucketFeedback} {
			if _, err := tx.CreateBucketIfNotExists(name); err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		_ = db.Close()
		return nil, fmt.Errorf("presets: не завести бакеты: %w", err)
	}

	return &Store{db: db, limits: lim}, nil
}

// Close закрывает базу.
func (s *Store) Close() error { return s.db.Close() }

// List — перечень БЕЗ содержимого. kind == nil — без отбора, все записи; kind != nil — только
// записи этого ярлыка (сравнение строки, не толкование — PROBEWEB-8). Новые сверху: savedAt по
// убыванию, при равенстве — id по возрастанию (детерминированный порядок для проб).
func (s *Store) List(kind *string) ([]model.Meta, error) {
	var items []model.Meta

	err := s.db.View(func(tx *bbolt.Tx) error {
		b := tx.Bucket(bucketMeta)
		return b.ForEach(func(_, v []byte) error {
			var meta model.Meta
			if err := json.Unmarshal(v, &meta); err != nil {
				return nil // испорченная запись пропускается, а не роняет перечень
			}
			if kind != nil && meta.Kind != *kind {
				return nil
			}
			items = append(items, meta)
			return nil
		})
	})
	if err != nil {
		return nil, err
	}

	sort.Slice(items, func(i, j int) bool {
		if items[i].SavedAt != items[j].SavedAt {
			ti, _ := time.Parse(time.RFC3339Nano, items[i].SavedAt)
			tj, _ := time.Parse(time.RFC3339Nano, items[j].SavedAt)
			return ti.After(tj)
		}
		return items[i].ID < items[j].ID
	})

	return items, nil
}

// Get — запись целиком. Нет такой — ErrNotFound, а не поломка.
func (s *Store) Get(id string) (*model.Record, error) {
	var record model.Record

	err := s.db.View(func(tx *bbolt.Tx) error {
		metaBytes := tx.Bucket(bucketMeta).Get([]byte(id))
		if metaBytes == nil {
			return ErrNotFound
		}
		if err := json.Unmarshal(metaBytes, &record.Meta); err != nil {
			return ErrNotFound
		}
		state := tx.Bucket(bucketState).Get([]byte(id))
		record.State = append(json.RawMessage(nil), state...)
		return nil
	})
	if err != nil {
		return nil, err
	}
	return &record, nil
}

// GetMany — то же, что Get, но для нескольких id ОДНОЙ транзакцией: чтение, размеченное на
// батч (GraphQL-резолвер через dataloader — no-server-side-n-plus-one в ROADMAP.yaml), а не N
// отдельных вызовов Get, каждый со своей View-транзакцией. Отсутствующий id просто не попадает в
// карту — не ошибка, дозвон решает вызывающий (пробел могла оставить гонка с Remove).
func (s *Store) GetMany(ids []string) (map[string]*model.Record, error) {
	records := make(map[string]*model.Record, len(ids))

	err := s.db.View(func(tx *bbolt.Tx) error {
		metaBucket := tx.Bucket(bucketMeta)
		stateBucket := tx.Bucket(bucketState)

		for _, id := range ids {
			metaBytes := metaBucket.Get([]byte(id))
			if metaBytes == nil {
				continue
			}
			var record model.Record
			if err := json.Unmarshal(metaBytes, &record.Meta); err != nil {
				continue // испорченная запись пропускается, а не роняет весь батч
			}
			record.State = append(json.RawMessage(nil), stateBucket.Get([]byte(id))...)
			records[id] = &record
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return records, nil
}

// nameKey — ключ индекса имён: пара (kind, name), не одно только имя — уникальность держится
// В ПРЕДЕЛАХ вида.
func nameKey(kind, name string) []byte {
	return []byte(kind + "\x00" + name)
}

// Create кладёт новую запись. Идентификатор и время выдаёт хранилище — клиент их не присылает.
func (s *Store) Create(input model.Input) (*model.Record, error) {
	record := &model.Record{
		Meta: model.Meta{
			Label:       input.Label,
			Name:        input.Name,
			Description: input.Description,
			Kind:        input.Kind,
		},
		State: input.State,
	}

	err := s.db.Update(func(tx *bbolt.Tx) error {
		record.ID = newID()
		record.SavedAt = nowStamp()
		return s.put(tx, record, nil)
	})
	if err != nil {
		return nil, err
	}
	return record, nil
}

// Replace кладёт запись ВМЕСТО прежней с тем же id — атомарно, одной транзакцией, а не снятием
// и укладкой заново отдельными вызовами (так это раньше делал клиент поверх list+delete+create,
// с окном гонки между ними и потерей записи при сбое посередине).
func (s *Store) Replace(id string, input model.Input) (*model.Record, error) {
	record := &model.Record{
		Meta: model.Meta{
			ID:          id,
			Label:       input.Label,
			Name:        input.Name,
			Description: input.Description,
			Kind:        input.Kind,
		},
		State: input.State,
	}

	err := s.db.Update(func(tx *bbolt.Tx) error {
		metaBytes := tx.Bucket(bucketMeta).Get([]byte(id))
		if metaBytes == nil {
			return ErrNotFound
		}
		var previous model.Meta
		if err := json.Unmarshal(metaBytes, &previous); err != nil {
			return ErrNotFound
		}

		record.SavedAt = nowStamp()
		return s.put(tx, record, &previous)
	})
	if err != nil {
		return nil, err
	}
	return record, nil
}

// put — общее тело Create/Replace внутри уже открытой транзакции: проверить пределы, проверить
// уникальность имени, записать meta+state+индекс имени+счётчик объёма. previous — прежняя мета
// ЭТОЙ ЖЕ записи (nil у Create): нужна, чтобы замена не спорила сама с собой за своё же старое
// имя и не считала себя дважды в пределе вида.
func (s *Store) put(tx *bbolt.Tx, record *model.Record, previous *model.Meta) error {
	metaBucket := tx.Bucket(bucketMeta)
	stateBucket := tx.Bucket(bucketState)
	namesBucket := tx.Bucket(bucketNames)
	statsBucket := tx.Bucket(bucketStats)

	metaJSON, err := json.Marshal(record.Meta)
	if err != nil {
		return err
	}
	stateJSON := []byte(record.State)
	size := int64(len(metaJSON) + len(stateJSON))

	if size > s.limits.RecordBytes {
		return &TooLargeError{Limit: s.limits.RecordBytes}
	}

	// Предел числа записей — НА ВИД, а не на хранилище целиком: один прожорливый вид не должен
	// душить лимит остальным. Считаем обходом meta-бакета внутри той же транзакции — точная
	// консистентность важнее скорости счёта, а бакет с метаданными лёгкий (без содержимого).
	if record.Meta.Kind != "" {
		count := 0
		if err := metaBucket.ForEach(func(k, v []byte) error {
			if string(k) == record.ID {
				return nil // сама запись (случай Replace) не считается
			}
			var other model.Meta
			if json.Unmarshal(v, &other) == nil && other.Kind == record.Meta.Kind {
				count++
			}
			return nil
		}); err != nil {
			return err
		}
		if count >= s.limits.RecordsPerKind {
			return &StorageFullError{Reason: "records", Limit: int64(s.limits.RecordsPerKind)}
		}
	}

	// Уникальность имени — В ПРЕДЕЛАХ ВИДА: два разных вида законно делят одно и то же имя,
	// уникальность имеет смысл только там, где имя реально адресует что-то одно.
	var previousNameKey []byte
	if previous != nil && previous.Name != "" {
		previousNameKey = nameKey(previous.Kind, previous.Name)
	}
	if record.Meta.Name != "" {
		key := nameKey(record.Meta.Kind, record.Meta.Name)
		keepsOwnName := previousNameKey != nil && bytes.Equal(key, previousNameKey)
		if !keepsOwnName {
			if holder := namesBucket.Get(key); holder != nil {
				return &NameTakenError{Kind: record.Meta.Kind, Name: record.Meta.Name}
			}
		}
	}

	previousSize := int64(0)
	if raw := statsBucket.Get(recordSizeKey(record.ID)); raw != nil {
		previousSize = int64(binary.BigEndian.Uint64(raw))
	}

	total := readTotal(statsBucket)
	candidateTotal := total - previousSize + size
	if candidateTotal > s.limits.TotalBytes {
		return &StorageFullError{Reason: "bytes", Limit: s.limits.TotalBytes}
	}

	if err := metaBucket.Put([]byte(record.ID), metaJSON); err != nil {
		return err
	}
	if err := stateBucket.Put([]byte(record.ID), stateJSON); err != nil {
		return err
	}

	newNameKey := (*[]byte)(nil)
	if record.Meta.Name != "" {
		k := nameKey(record.Meta.Kind, record.Meta.Name)
		newNameKey = &k
	}
	if previousNameKey != nil && (newNameKey == nil || !bytes.Equal(*newNameKey, previousNameKey)) {
		_ = namesBucket.Delete(previousNameKey)
	}
	if newNameKey != nil {
		if err := namesBucket.Put(*newNameKey, []byte(record.ID)); err != nil {
			return err
		}
	}

	writeTotal(statsBucket, candidateTotal)
	writeRecordSize(statsBucket, record.ID, size)

	return nil
}

// Remove убирает запись. Возвращает, было ли что удалять — второй вызов с тем же id не отказ.
func (s *Store) Remove(id string) (bool, error) {
	found := false

	err := s.db.Update(func(tx *bbolt.Tx) error {
		metaBucket := tx.Bucket(bucketMeta)
		metaBytes := metaBucket.Get([]byte(id))
		if metaBytes == nil {
			return nil
		}
		found = true

		var meta model.Meta
		_ = json.Unmarshal(metaBytes, &meta)

		statsBucket := tx.Bucket(bucketStats)
		if raw := statsBucket.Get(recordSizeKey(id)); raw != nil {
			size := int64(binary.BigEndian.Uint64(raw))
			writeTotal(statsBucket, readTotal(statsBucket)-size)
			_ = statsBucket.Delete(recordSizeKey(id))
		}

		if meta.Name != "" {
			namesBucket := tx.Bucket(bucketNames)
			key := nameKey(meta.Kind, meta.Name)
			if got := namesBucket.Get(key); got != nil && string(got) == id {
				_ = namesBucket.Delete(key)
			}
		}

		_ = metaBucket.Delete([]byte(id))
		_ = tx.Bucket(bucketState).Delete([]byte(id))
		return nil
	})

	return found, err
}

// Stats — для /healthz: сколько записей и сколько байт занято сейчас.
func (s *Store) Stats() (records int, bytesUsed int64, err error) {
	err = s.db.View(func(tx *bbolt.Tx) error {
		records = tx.Bucket(bucketMeta).Stats().KeyN
		bytesUsed = readTotal(tx.Bucket(bucketStats))
		return nil
	})
	return
}

// readTotal читает текущий занятый объём всего хранилища.
func readTotal(statsBucket *bbolt.Bucket) int64 {
	raw := statsBucket.Get(statsTotalBytesKey)
	if raw == nil {
		return 0
	}
	return int64(binary.BigEndian.Uint64(raw))
}

// writeTotal перезаписывает занятый объём — счётчиком, а не пересчётом обходом на каждый запрос.
func writeTotal(statsBucket *bbolt.Bucket, total int64) {
	buf := make([]byte, 8)
	binary.BigEndian.PutUint64(buf, uint64(total))
	_ = statsBucket.Put(statsTotalBytesKey, buf)
}

// recordSizeKey — ключ учёта размера ОДНОЙ записи, чтобы Remove/Replace вычитали ровно своё.
func recordSizeKey(id string) []byte {
	return []byte("size\x00" + id)
}

// writeRecordSize запоминает размер записи для последующего вычитания при удалении или замене.
func writeRecordSize(statsBucket *bbolt.Bucket, id string, size int64) {
	buf := make([]byte, 8)
	binary.BigEndian.PutUint64(buf, uint64(size))
	_ = statsBucket.Put(recordSizeKey(id), buf)
}

// nowStamp — момент сохранения, RFC3339 с наносекундами: разрешения хватает, чтобы два
// сохранения подряд в пробе не совпали строкой и не разъехались с ожидаемым порядком списка.
func nowStamp() string {
	return time.Now().UTC().Format(time.RFC3339Nano)
}

// newID — UUID v4. Свой генератор на восемь строк вместо зависимости: формат ровно тот, что уже
// адресуют клиенты (`{id}` в пути), сторонний пакет здесь не приносит ничего, кроме версии в
// go.sum.
func newID() string {
	buf := make([]byte, 16)
	if _, err := rand.Read(buf); err != nil {
		panic(err) // crypto/rand не возвращает ошибку в здравом окружении
	}
	buf[6] = (buf[6] & 0x0f) | 0x40 // версия 4
	buf[8] = (buf[8] & 0x3f) | 0x80 // вариант RFC 4122

	var out bytes.Buffer
	fmt.Fprintf(&out, "%x-%x-%x-%x-%x", buf[0:4], buf[4:6], buf[6:8], buf[8:10], buf[10:16])
	return out.String()
}
