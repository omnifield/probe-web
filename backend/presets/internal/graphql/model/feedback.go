package model

// FeedbackEntry — GraphQL-модель заявки. НЕ реализует Preset (нет такого метода нарочно) — своя
// сущность, не вид пресета (feedback-bucket-and-type, ROADMAP.yaml). Поля — по живой форме
// (apps/skin/.mcp/src/tools/feedback.ts), канона в TS нет, тем же приёмом, что раньше Tag.
type FeedbackEntry struct {
	ID         string
	SavedAt    string
	Tool       string
	Action     string
	Expected   *string
	Actual     string
	Sign       string
	Status     string
	At         string
	ResolvedAt *string
	Note       *string
}
