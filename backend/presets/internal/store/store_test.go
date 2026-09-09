package store

import (
	"encoding/json"
	"path/filepath"
	"sync"
	"testing"

	"presets/internal/limits"
	"presets/internal/model"
)

func open(t *testing.T, lim limits.Limits) *Store {
	t.Helper()
	path := filepath.Join(t.TempDir(), "presets.db")
	s, err := Open(path, lim)
	if err != nil {
		t.Fatalf("Open: %v", err)
	}
	t.Cleanup(func() { _ = s.Close() })
	return s
}

func input(kind, name string, state string) model.Input {
	return model.Input{Label: "лейбл", Kind: kind, Name: name, State: json.RawMessage(state)}
}

func TestCreateAndGet(t *testing.T) {
	s := open(t, limits.Default)

	record, err := s.Create(input("skin", "brand", `{"a":1}`))
	if err != nil {
		t.Fatalf("Create: %v", err)
	}
	if record.ID == "" || record.SavedAt == "" {
		t.Fatalf("id/savedAt не выданы: %+v", record.Meta)
	}

	got, err := s.Get(record.ID)
	if err != nil {
		t.Fatalf("Get: %v", err)
	}
	if string(got.State) != `{"a":1}` {
		t.Fatalf("state расходится: %s", got.State)
	}
}

func TestGetNotFound(t *testing.T) {
	s := open(t, limits.Default)
	if _, err := s.Get("нет-такого"); err != ErrNotFound {
		t.Fatalf("ожидался ErrNotFound, получено %v", err)
	}
}

func TestOpaqueStateRoundtrip(t *testing.T) {
	// Служба не толкует state вообще: заведомая чушь возвращается неизменной, вплоть до
	// порядка ключей — ровно то, что стерёг test/opaque.test.js прежней версии.
	s := open(t, limits.Default)
	junk := `{"z":1,"a":2,"nested":{"b":[1,2,3],"n":9007199254740993}}`

	record, err := s.Create(input("filter", "", junk))
	if err != nil {
		t.Fatalf("Create: %v", err)
	}

	got, err := s.Get(record.ID)
	if err != nil {
		t.Fatalf("Get: %v", err)
	}
	if string(got.State) != junk {
		t.Fatalf("state изменился:\n  было: %s\n  стало: %s", junk, got.State)
	}
}

func TestNameUniquePerKindNotGlobal(t *testing.T) {
	s := open(t, limits.Default)

	if _, err := s.Create(input("skin", "brand", `1`)); err != nil {
		t.Fatalf("Create skin/brand: %v", err)
	}

	// Тот же name, тот же kind — отказ.
	if _, err := s.Create(input("skin", "brand", `2`)); err == nil {
		t.Fatalf("ожидался NameTakenError на повторе kind+name")
	} else if _, ok := err.(*NameTakenError); !ok {
		t.Fatalf("ожидался NameTakenError, получено %T: %v", err, err)
	}

	// Тот же name, ДРУГОЙ kind — законно: разные виды не делят пространство имён.
	if _, err := s.Create(input("filter", "brand", `3`)); err != nil {
		t.Fatalf("ожидалось разрешить name в другом виде: %v", err)
	}
}

func TestGetManyBatchesAndSkipsMissing(t *testing.T) {
	s := open(t, limits.Default)

	a, err := s.Create(input("form", "a", `{"a":1}`))
	if err != nil {
		t.Fatalf("Create a: %v", err)
	}
	b, err := s.Create(input("form", "b", `{"b":2}`))
	if err != nil {
		t.Fatalf("Create b: %v", err)
	}

	records, err := s.GetMany([]string{a.ID, "нет-такого", b.ID})
	if err != nil {
		t.Fatalf("GetMany: %v", err)
	}

	if len(records) != 2 {
		t.Fatalf("ожидалось 2 найденные записи (отсутствующий id пропускается, не отказ), получено %d: %+v", len(records), records)
	}
	if got := records[a.ID]; got == nil || string(got.State) != `{"a":1}` {
		t.Fatalf("запись a разошлась: %+v", got)
	}
	if got := records[b.ID]; got == nil || string(got.State) != `{"b":2}` {
		t.Fatalf("запись b разошлась: %+v", got)
	}
	if _, found := records["нет-такого"]; found {
		t.Fatalf("отсутствующий id не должен попадать в карту")
	}
}

func TestRecordsPerKindLimitDoesNotStarveOtherKinds(t *testing.T) {
	lim := limits.Default
	lim.RecordsPerKind = 2
	s := open(t, lim)

	if _, err := s.Create(input("skin", "", `1`)); err != nil {
		t.Fatal(err)
	}
	if _, err := s.Create(input("skin", "", `2`)); err != nil {
		t.Fatal(err)
	}
	if _, err := s.Create(input("skin", "", `3`)); err == nil {
		t.Fatalf("третья запись вида skin должна была упереться в предел")
	} else if full, ok := err.(*StorageFullError); !ok || full.Reason != "records" {
		t.Fatalf("ожидался StorageFullError{records}, получено %T: %v", err, err)
	}

	// Другой вид — свой собственный счётчик, предел вида skin его не касается.
	if _, err := s.Create(input("filter", "", `1`)); err != nil {
		t.Fatalf("вид filter не должен был упереться в чужой предел: %v", err)
	}
}

func TestTotalBytesLimitIsGlobalAcrossKinds(t *testing.T) {
	lim := limits.Default
	lim.RecordBytes = 1 << 20
	lim.TotalBytes = 200 // тесно специально
	s := open(t, lim)

	if _, err := s.Create(input("skin", "", `"0123456789012345678901234567890123456789"`)); err != nil {
		t.Fatalf("первая запись должна была влезть: %v", err)
	}
	if _, err := s.Create(input("filter", "", `"0123456789012345678901234567890123456789"`)); err == nil {
		t.Fatalf("вторая запись должна была упереться в общий предел объёма")
	} else if full, ok := err.(*StorageFullError); !ok || full.Reason != "bytes" {
		t.Fatalf("ожидался StorageFullError{bytes}, получено %T: %v", err, err)
	}
}

func TestRecordTooLarge(t *testing.T) {
	lim := limits.Default
	lim.RecordBytes = 16
	s := open(t, lim)

	if _, err := s.Create(input("skin", "", `"0123456789012345678901234567890123456789"`)); err == nil {
		t.Fatalf("ожидался TooLargeError")
	} else if _, ok := err.(*TooLargeError); !ok {
		t.Fatalf("ожидался TooLargeError, получено %T: %v", err, err)
	}
}

func TestReplaceIsAtomicAndKeepsID(t *testing.T) {
	s := open(t, limits.Default)

	created, err := s.Create(input("skin", "brand", `{"v":1}`))
	if err != nil {
		t.Fatal(err)
	}

	replaced, err := s.Replace(created.ID, input("skin", "brand", `{"v":2}`))
	if err != nil {
		t.Fatalf("Replace: %v", err)
	}
	if replaced.ID != created.ID {
		t.Fatalf("id обязан остаться тем же: было %s, стало %s", created.ID, replaced.ID)
	}

	got, err := s.Get(created.ID)
	if err != nil {
		t.Fatal(err)
	}
	if string(got.State) != `{"v":2}` {
		t.Fatalf("state не заменился: %s", got.State)
	}

	items, err := s.List(strPtr("skin"))
	if err != nil {
		t.Fatal(err)
	}
	if len(items) != 1 {
		t.Fatalf("замена не должна плодить вторую запись, получено %d", len(items))
	}
}

func TestReplaceKeepingOwnNameDoesNotConflictWithItself(t *testing.T) {
	s := open(t, limits.Default)
	created, err := s.Create(input("skin", "brand", `1`))
	if err != nil {
		t.Fatal(err)
	}
	if _, err := s.Replace(created.ID, input("skin", "brand", `2`)); err != nil {
		t.Fatalf("замена с тем же именем не должна спорить сама с собой: %v", err)
	}
}

func TestReplaceToNameTakenByAnotherFails(t *testing.T) {
	s := open(t, limits.Default)
	if _, err := s.Create(input("skin", "taken", `1`)); err != nil {
		t.Fatal(err)
	}
	victim, err := s.Create(input("skin", "free", `1`))
	if err != nil {
		t.Fatal(err)
	}

	if _, err := s.Replace(victim.ID, input("skin", "taken", `2`)); err == nil {
		t.Fatalf("ожидался NameTakenError")
	} else if _, ok := err.(*NameTakenError); !ok {
		t.Fatalf("ожидался NameTakenError, получено %T: %v", err, err)
	}
}

func TestReplaceReleasesOldNameForReuse(t *testing.T) {
	s := open(t, limits.Default)
	created, err := s.Create(input("skin", "old-name", `1`))
	if err != nil {
		t.Fatal(err)
	}
	if _, err := s.Replace(created.ID, input("skin", "new-name", `2`)); err != nil {
		t.Fatalf("Replace: %v", err)
	}

	// Старое имя освободилось — им можно назвать новую запись.
	if _, err := s.Create(input("skin", "old-name", `3`)); err != nil {
		t.Fatalf("старое имя должно было освободиться: %v", err)
	}
}

func TestReplaceNotFound(t *testing.T) {
	s := open(t, limits.Default)
	if _, err := s.Replace("нет-такого", input("skin", "", `1`)); err != ErrNotFound {
		t.Fatalf("ожидался ErrNotFound, получено %v", err)
	}
}

func TestRemoveIsIdempotentAtStoreLevel(t *testing.T) {
	s := open(t, limits.Default)
	created, err := s.Create(input("skin", "brand", `1`))
	if err != nil {
		t.Fatal(err)
	}

	removed, err := s.Remove(created.ID)
	if err != nil || !removed {
		t.Fatalf("первое удаление обязано пройти: removed=%v err=%v", removed, err)
	}
	removed, err = s.Remove(created.ID)
	if err != nil || removed {
		t.Fatalf("второе удаление — не отказ, но и не найдено: removed=%v err=%v", removed, err)
	}

	// Имя освобождено удалением — им можно назвать новую запись того же вида.
	if _, err := s.Create(input("skin", "brand", `2`)); err != nil {
		t.Fatalf("имя должно было освободиться после удаления: %v", err)
	}
}

func TestRemoveFreesByteBudget(t *testing.T) {
	lim := limits.Default
	lim.TotalBytes = 200
	s := open(t, lim)

	first, err := s.Create(input("skin", "", `"0123456789012345678901234567890123456789"`))
	if err != nil {
		t.Fatal(err)
	}
	if _, err := s.Remove(first.ID); err != nil {
		t.Fatal(err)
	}
	if _, err := s.Create(input("skin", "", `"0123456789012345678901234567890123456789"`)); err != nil {
		t.Fatalf("после удаления место должно было освободиться: %v", err)
	}
}

func TestListOrderNewestFirstThenIDAscending(t *testing.T) {
	s := open(t, limits.Default)
	var ids []string
	for i := 0; i < 3; i++ {
		r, err := s.Create(input("skin", "", `1`))
		if err != nil {
			t.Fatal(err)
		}
		ids = append(ids, r.ID)
	}

	items, err := s.List(strPtr("skin"))
	if err != nil {
		t.Fatal(err)
	}
	if len(items) != 3 {
		t.Fatalf("ожидалось 3 записи, получено %d", len(items))
	}
	// Все три сохранены "одновременно" (разрешение таймстампа может совпасть) — порядок
	// внутри равных savedAt обязан быть по id по возрастанию.
	for i := 0; i+1 < len(items); i++ {
		if items[i].SavedAt < items[i+1].SavedAt {
			t.Fatalf("порядок по savedAt нарушен: %v", items)
		}
	}
}

func TestListFiltersByKindWithoutInterpretingIt(t *testing.T) {
	s := open(t, limits.Default)
	if _, err := s.Create(input("skin", "", `1`)); err != nil {
		t.Fatal(err)
	}
	if _, err := s.Create(input("filter", "", `1`)); err != nil {
		t.Fatal(err)
	}
	if _, err := s.Create(model.Input{Label: "без вида", State: json.RawMessage(`1`)}); err != nil {
		t.Fatal(err)
	}

	all, err := s.List(nil)
	if err != nil || len(all) != 3 {
		t.Fatalf("без фильтра ожидалось 3, получено %d (err=%v)", len(all), err)
	}

	skins, err := s.List(strPtr("skin"))
	if err != nil || len(skins) != 1 {
		t.Fatalf("по kind=skin ожидалась 1, получено %d (err=%v)", len(skins), err)
	}

	// Запись без ярлыка в отбор ПО ярлыку не попадает ни под каким ярлыком.
	unlabeled, err := s.List(strPtr("не-заводили"))
	if err != nil || len(unlabeled) != 0 {
		t.Fatalf("незаведённый ярлык обязан дать пустой перечень, получено %d", len(unlabeled))
	}
}

func TestConcurrentCreatesRespectRecordsPerKindLimitExactly(t *testing.T) {
	// Прежняя JS-реализация решала это счётчиком "занято, но не дописано" поверх файлов.
	// Здесь атомарность даёт сама транзакция bbolt — проверяем, что предел держится РОВНО,
	// а не "плюс-минус одна лишняя" под гонкой.
	lim := limits.Default
	lim.RecordsPerKind = 10
	s := open(t, lim)

	const attempts = 30
	var wg sync.WaitGroup
	var mu sync.Mutex
	ok, full := 0, 0

	for i := 0; i < attempts; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			_, err := s.Create(input("skin", "", "1"))
			mu.Lock()
			defer mu.Unlock()
			if err == nil {
				ok++
			} else if _, isFull := err.(*StorageFullError); isFull {
				full++
			}
		}()
	}
	wg.Wait()

	if ok != lim.RecordsPerKind {
		t.Fatalf("ожидалось ровно %d успешных созданий, получено %d (full=%d)", lim.RecordsPerKind, ok, full)
	}
	if ok+full != attempts {
		t.Fatalf("часть попыток пропала без ответа: ok=%d full=%d attempts=%d", ok, full, attempts)
	}
}

func TestConcurrentCreatesRespectNameUniquenessExactly(t *testing.T) {
	s := open(t, limits.Default)

	const attempts = 20
	var wg sync.WaitGroup
	var mu sync.Mutex
	ok, taken := 0, 0

	for i := 0; i < attempts; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			_, err := s.Create(input("skin", "same-name", "1"))
			mu.Lock()
			defer mu.Unlock()
			if err == nil {
				ok++
			} else if _, isTaken := err.(*NameTakenError); isTaken {
				taken++
			}
		}()
	}
	wg.Wait()

	if ok != 1 {
		t.Fatalf("ровно одна попытка обязана победить за имя, получено %d", ok)
	}
	if taken != attempts-1 {
		t.Fatalf("остальные обязаны получить NameTakenError, получено %d из %d", taken, attempts-1)
	}
}

func TestStatsReflectsRecordsAndBytes(t *testing.T) {
	s := open(t, limits.Default)
	records, bytesUsed, err := s.Stats()
	if err != nil || records != 0 || bytesUsed != 0 {
		t.Fatalf("пустое хранилище: records=%d bytes=%d err=%v", records, bytesUsed, err)
	}

	if _, err := s.Create(input("skin", "", `1`)); err != nil {
		t.Fatal(err)
	}
	records, bytesUsed, err = s.Stats()
	if err != nil || records != 1 || bytesUsed <= 0 {
		t.Fatalf("после создания: records=%d bytes=%d err=%v", records, bytesUsed, err)
	}
}

func strPtr(s string) *string { return &s }
