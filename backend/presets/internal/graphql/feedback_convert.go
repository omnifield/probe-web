package graphql

import (
	"encoding/json"
	"fmt"

	"presets/internal/graphql/model"
	presetsmodel "presets/internal/model"
)

// feedbackState — форма содержимого заявки: по живому коду потребителя
// (apps/skin/.mcp/src/tools/feedback.ts), канона в TS нет — тем же приёмом, что internal/kinds.Tag.
// Живёт в internal/graphql, не internal/kinds: фидбэк мимо kinds-registry (feedback-bucket-and-type,
// ROADMAP.yaml).
type feedbackState struct {
	Tool       string  `json:"tool"`
	Action     string  `json:"action"`
	Expected   *string `json:"expected,omitempty"`
	Actual     string  `json:"actual"`
	Sign       string  `json:"sign"`
	Status     string  `json:"status"`
	At         string  `json:"at"`
	ResolvedAt *string `json:"resolvedAt,omitempty"`
	Note       *string `json:"note,omitempty"`
}

// toFeedbackEntry разбирает store.FeedbackEntry.State по форме выше — та же роль, что toPreset
// играет для видов kinds-registry, только своим отдельным путём.
func toFeedbackEntry(entry *presetsmodel.FeedbackEntry) (*model.FeedbackEntry, error) {
	var state feedbackState
	if err := json.Unmarshal(entry.State, &state); err != nil {
		return nil, fmt.Errorf("presets: заявка %q не разобралась: %w", entry.ID, err)
	}
	return &model.FeedbackEntry{
		ID:         entry.ID,
		SavedAt:    entry.SavedAt,
		Tool:       state.Tool,
		Action:     state.Action,
		Expected:   state.Expected,
		Actual:     state.Actual,
		Sign:       state.Sign,
		Status:     state.Status,
		At:         state.At,
		ResolvedAt: state.ResolvedAt,
		Note:       state.Note,
	}, nil
}
