// Package api — HTTP-поверхность службы. Поверхность узкая и лаконичная: пять действий и
// проверка живости, ни одного больше.
//
//	GET    /api/presets           → { items: [...] }             — без содержимого
//	GET    /api/presets?kind=X    → то же, только записи вида X
//	GET    /api/presets/{id}      → запись целиком, с state
//	POST   /api/presets           → 201, meta без state, Location
//	PUT    /api/presets/{id}      → 200, meta без state — атомарная замена ОДНИМ вызовом
//	DELETE /api/presets/{id}      → 204
//
// Здесь проверяется ТОЛЬКО конверт: label/name/description/kind/размер. `state` не разбирается —
// уходит в хранилище тем же куском, каким пришёл (PROBEWEB-8). Отказ по существу состояния —
// работа читателя (владельца вида), не службы.
package api

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"regexp"
	"strings"

	"presets/internal/limits"
	"presets/internal/model"
	"presets/internal/store"
)

// root — единственный путь коллекции; запись адресуется им же с добавленным `/{id}`.
const root = "/api/presets"

// label — тот же строгий покрой у ярлыка вида (kind) и машинного имени (name): обе строки едут
// в местах, где вольный текст не живёт (адрес запроса, атрибут на корне страницы, имя файла).
// Проверяется ФОРМА, а не смысл — служба не держит перечня допустимых значений.
var label = regexp.MustCompile(`^[a-z0-9][a-z0-9-]{0,31}$`)

// badKindMessage — текст отказа на кривой ярлык вида, один и на запись, и на отбор.
const badKindMessage = "Вид пресета — короткая метка из строчных латинских букв, цифр и дефисов (до 32 символов), например skin."

// badNameMessage — текст отказа на кривое машинное имя.
const badNameMessage = "Имя — короткая метка из строчных латинских букв, цифр и дефисов (до 32 символов), например twitter-dark."

// Handler держит открытое хранилище и пределы. Реализует http.Handler напрямую — без внешнего
// роутера: пять маршрутов и общий CORS/JSON-конверт на всех, разветвлённый if читается не хуже
// таблицы и не тянет зависимость ради шести строк диспетчеризации.
type Handler struct {
	store  *store.Store
	limits limits.Limits
}

// New заводит обработчик поверх уже открытого хранилища и заданных пределов.
func New(s *store.Store, lim limits.Limits) *Handler {
	return &Handler{store: s, limits: lim}
}

// ServeHTTP реализует http.Handler: CORS на каждый ответ (включая отказы), дальше разбор по
// пути и методу — вручную, без внешнего роутера.
func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "content-type")
	w.Header().Set("Access-Control-Max-Age", "86400")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	path := strings.TrimRight(r.URL.Path, "/")

	if path == "/healthz" {
		h.healthz(w, r)
		return
	}

	if path == root {
		switch r.Method {
		case http.MethodGet:
			h.list(w, r)
		case http.MethodPost:
			h.create(w, r)
		default:
			methodNotAllowed(w, "GET, POST")
		}
		return
	}

	if strings.HasPrefix(path, root+"/") {
		id, err := url.PathUnescape(path[len(root)+1:])
		if err != nil || id == "" || strings.Contains(id, "/") {
			notFound(w)
			return
		}
		switch r.Method {
		case http.MethodGet:
			h.get(w, id)
		case http.MethodPut:
			h.replace(w, r, id)
		case http.MethodDelete:
			h.remove(w, id)
		default:
			methodNotAllowed(w, "GET, PUT, DELETE")
		}
		return
	}

	notFound(w)
}

// healthz отвечает докеру и тому, кто разворачивает: жива ли служба и сколько уже занято.
func (h *Handler) healthz(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		methodNotAllowed(w, "GET")
		return
	}
	records, bytesUsed, err := h.store.Stats()
	if err != nil {
		internal(w, err)
		return
	}
	send(w, http.StatusOK, map[string]any{
		"ok":      true,
		"presets": records,
		"bytes":   bytesUsed,
		"limits":  h.limits,
	})
}

// list отдаёт перечень без содержимого; параметр `kind` отбирает по ярлыку, а не толкует его.
func (h *Handler) list(w http.ResponseWriter, r *http.Request) {
	var kind *string
	if asked := r.URL.Query().Get("kind"); r.URL.Query().Has("kind") {
		if !label.MatchString(asked) {
			fail(w, http.StatusBadRequest, "bad_kind", badKindMessage)
			return
		}
		kind = &asked
	}

	items, err := h.store.List(kind)
	if err != nil {
		internal(w, err)
		return
	}
	if items == nil {
		items = []model.Meta{}
	}
	send(w, http.StatusOK, map[string]any{"items": items})
}

// get отдаёт запись целиком, вместе с state; нет такой — notFound, а не поломка.
func (h *Handler) get(w http.ResponseWriter, id string) {
	record, err := h.store.Get(id)
	if errors.Is(err, store.ErrNotFound) {
		notFound(w)
		return
	}
	if err != nil {
		internal(w, err)
		return
	}
	send(w, http.StatusOK, record)
}

// create кладёт новую запись: разбирает конверт, отдаёт 201 с Location и meta без state.
func (h *Handler) create(w http.ResponseWriter, r *http.Request) {
	body, tooLarge, err := readBody(r, h.limits.RecordBytes)
	if tooLarge {
		w.Header().Set("Connection", "close")
		fail(w, http.StatusRequestEntityTooLarge, "too_large", fmt.Sprintf("Пресет больше %s и не сохранён.", humanSize(h.limits.RecordBytes)))
		return
	}
	if err != nil {
		internal(w, err)
		return
	}

	input, code, message := parseEnvelope(body, h.limits)
	if code != "" {
		fail(w, http.StatusBadRequest, code, message)
		return
	}

	record, err := h.store.Create(*input)
	if writeStoreError(w, err) {
		return
	}

	w.Header().Set("Location", root+"/"+record.ID)
	send(w, http.StatusCreated, record.Meta)
}

// replace кладёт запись ВМЕСТО прежней с тем же id — одним атомарным вызовом хранилища.
func (h *Handler) replace(w http.ResponseWriter, r *http.Request, id string) {
	body, tooLarge, err := readBody(r, h.limits.RecordBytes)
	if tooLarge {
		w.Header().Set("Connection", "close")
		fail(w, http.StatusRequestEntityTooLarge, "too_large", fmt.Sprintf("Пресет больше %s и не сохранён.", humanSize(h.limits.RecordBytes)))
		return
	}
	if err != nil {
		internal(w, err)
		return
	}

	input, code, message := parseEnvelope(body, h.limits)
	if code != "" {
		fail(w, http.StatusBadRequest, code, message)
		return
	}

	record, err := h.store.Replace(id, *input)
	if errors.Is(err, store.ErrNotFound) {
		notFound(w)
		return
	}
	if writeStoreError(w, err) {
		return
	}

	send(w, http.StatusOK, record.Meta)
}

// remove убирает запись; нет такой — notFound.
func (h *Handler) remove(w http.ResponseWriter, id string) {
	removed, err := h.store.Remove(id)
	if err != nil {
		internal(w, err)
		return
	}
	if !removed {
		notFound(w)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// writeStoreError переводит отказ хранилища в HTTP-отказ. Возвращает true, если уже ответил.
func writeStoreError(w http.ResponseWriter, err error) bool {
	if err == nil {
		return false
	}

	var nameTaken *store.NameTakenError
	if errors.As(err, &nameTaken) {
		fail(w, http.StatusConflict, "name_taken", fmt.Sprintf("Имя %q уже занято другим пресетом этого вида. Выберите другое.", nameTaken.Name))
		return true
	}

	var tooLarge *store.TooLargeError
	if errors.As(err, &tooLarge) {
		fail(w, http.StatusRequestEntityTooLarge, "too_large", fmt.Sprintf("Пресет больше %s и не сохранён.", humanSize(tooLarge.Limit)))
		return true
	}

	var full *store.StorageFullError
	if errors.As(err, &full) {
		// 409, а не 507: служба не сломалась, она отказывает по делу, и чинит это человек
		// удалением лишнего (RFC 9110 §15.5.10, решение зоны из README прежней версии).
		message := fmt.Sprintf("Хранилище вида заполнено — разрешено %d пресетов. Удалите ненужные.", full.Limit)
		if full.Reason == "bytes" {
			message = fmt.Sprintf("Хранилище занято целиком — предел %s. Удалите ненужные.", humanSize(full.Limit))
		}
		fail(w, http.StatusConflict, "storage_full", message)
		return true
	}

	internal(w, err)
	return true
}

// humanSize печатает предел байт человеку: КБ или МБ, не сырое число.
func humanSize(bytesValue int64) string {
	mb := float64(bytesValue) / 1024 / 1024
	if mb >= 1 {
		return fmt.Sprintf("%.1f МБ", mb)
	}
	return fmt.Sprintf("%d КБ", bytesValue/1024)
}

// readBody читает тело запроса, не давая ему вырасти сверх max; tooLarge — отдельным флагом,
// не ошибкой, потому что это не поломка чтения, а обычный отказ по пределу.
func readBody(r *http.Request, max int64) (data []byte, tooLarge bool, err error) {
	limited := io.LimitReader(r.Body, max+1)
	data, err = io.ReadAll(limited)
	if err != nil {
		return nil, false, err
	}
	if int64(len(data)) > max {
		return nil, true, nil
	}
	return data, false, nil
}

// send пишет JSON-ответ с заданным статусом.
func send(w http.ResponseWriter, status int, payload any) {
	body, err := json.Marshal(payload)
	if err != nil {
		internal(w, err)
		return
	}
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_, _ = w.Write(body)
}

// fail — send с конвертом отказа {error, message}: код для читателя-программы, текст для человека.
func fail(w http.ResponseWriter, status int, code, message string) {
	send(w, status, map[string]string{"error": code, "message": message})
}

// notFound — стандартный 404: такого пресета нет.
func notFound(w http.ResponseWriter) {
	fail(w, http.StatusNotFound, "not_found", "Такого пресета нет.")
}

// methodNotAllowed — 405 с заголовком Allow, перечисляющим действительно годные методы пути.
func methodNotAllowed(w http.ResponseWriter, allow string) {
	w.Header().Set("Allow", allow)
	fail(w, http.StatusMethodNotAllowed, "method_not_allowed", fmt.Sprintf("Здесь можно только: %s.", allow))
}

// internal — 500: причина уходит в лог целиком, наружу — только то, что говорит человеку.
func internal(w http.ResponseWriter, err error) {
	fmt.Println("[presets] сбой запроса:", err)
	fail(w, http.StatusInternalServerError, "internal", "Служба не смогла обработать запрос.")
}
