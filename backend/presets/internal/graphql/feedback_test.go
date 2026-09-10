package graphql

import (
	"testing"

	"presets/internal/graphql/model"
	"presets/internal/limits"
)

func TestReportFeedbackDefaultsSignAndStatus(t *testing.T) {
	s := openTestStore(t)
	resolver := New(s, limits.Default)
	ctx := ctxWithLoaders(s)

	entry, err := resolver.Mutation().ReportFeedback(ctx, model.FeedbackInput{
		Tool:   "save_preset",
		Action: "позвал",
		Actual: "упало",
		// Sign не задан — должен стать "issue" по умолчанию, как у report_feedback в apps/skin/.mcp.
	})
	if err != nil {
		t.Fatalf("ReportFeedback: %v", err)
	}
	if entry.Sign != "issue" {
		t.Fatalf("ожидался sign по умолчанию \"issue\", получено %q", entry.Sign)
	}
	if entry.Status != "open" {
		t.Fatalf("ожидался status \"open\" на создании, получено %q", entry.Status)
	}
	if entry.ID == "" || entry.SavedAt == "" || entry.At == "" {
		t.Fatalf("id/savedAt/at не выданы: %+v", entry)
	}
}

func TestFeedbackListFiltersByStatusAndSign(t *testing.T) {
	s := openTestStore(t)
	resolver := New(s, limits.Default)
	ctx := ctxWithLoaders(s)

	if _, err := resolver.Mutation().ReportFeedback(ctx, model.FeedbackInput{
		Tool: "a", Action: "x", Actual: "y", Sign: ptrString("issue"),
	}); err != nil {
		t.Fatalf("ReportFeedback issue: %v", err)
	}
	praise, err := resolver.Mutation().ReportFeedback(ctx, model.FeedbackInput{
		Tool: "b", Action: "x", Actual: "сработало", Sign: ptrString("praise"),
	})
	if err != nil {
		t.Fatalf("ReportFeedback praise: %v", err)
	}
	if _, err := resolver.Mutation().ResolveFeedback(ctx, praise.ID, nil); err != nil {
		t.Fatalf("ResolveFeedback: %v", err)
	}

	all, err := resolver.Query().Feedback(ctx, nil, nil)
	if err != nil {
		t.Fatalf("Feedback(all): %v", err)
	}
	if len(all) != 2 {
		t.Fatalf("ожидалось 2 заявки без фильтра, получено %d", len(all))
	}

	open := "open"
	onlyOpen, err := resolver.Query().Feedback(ctx, &open, nil)
	if err != nil {
		t.Fatalf("Feedback(status:open): %v", err)
	}
	if len(onlyOpen) != 1 || onlyOpen[0].Sign != "issue" {
		t.Fatalf("ожидалась одна открытая (issue) заявка, получено: %+v", onlyOpen)
	}

	praiseSign := "praise"
	onlyPraise, err := resolver.Query().Feedback(ctx, nil, &praiseSign)
	if err != nil {
		t.Fatalf("Feedback(sign:praise): %v", err)
	}
	if len(onlyPraise) != 1 || onlyPraise[0].Status != "resolved" {
		t.Fatalf("ожидалась одна praise-заявка, уже resolved, получено: %+v", onlyPraise)
	}
}

func TestResolveFeedbackTwiceFails(t *testing.T) {
	s := openTestStore(t)
	resolver := New(s, limits.Default)
	ctx := ctxWithLoaders(s)

	entry, err := resolver.Mutation().ReportFeedback(ctx, model.FeedbackInput{
		Tool: "x", Action: "y", Actual: "z",
	})
	if err != nil {
		t.Fatalf("ReportFeedback: %v", err)
	}

	note := "починили"
	resolved, err := resolver.Mutation().ResolveFeedback(ctx, entry.ID, &note)
	if err != nil {
		t.Fatalf("ResolveFeedback: %v", err)
	}
	if resolved.Status != "resolved" || resolved.ResolvedAt == nil || resolved.Note == nil || *resolved.Note != note {
		t.Fatalf("резолв не применился как ожидалось: %+v", resolved)
	}
	// id/tool/action/actual/sign/at должны пережить резолв неизменными — resolveFeedback
	// подмешивает status/resolvedAt/note, не переписывает остальное.
	if resolved.ID != entry.ID || resolved.Tool != entry.Tool || resolved.At != entry.At {
		t.Fatalf("резолв затронул поля, которые не должен был: было %+v, стало %+v", entry, resolved)
	}

	if _, err := resolver.Mutation().ResolveFeedback(ctx, entry.ID, nil); err == nil {
		t.Fatal("повторный ResolveFeedback должен отказать")
	}
}

func TestResolveFeedbackNotFound(t *testing.T) {
	s := openTestStore(t)
	resolver := New(s, limits.Default)
	ctx := ctxWithLoaders(s)

	if _, err := resolver.Mutation().ResolveFeedback(ctx, "нет-такой", nil); err == nil {
		t.Fatal("ожидался отказ на несуществующую заявку")
	}
}

// TestFeedbackDoesNotAppearAmongPresets — фидбэк мимо Preset/kinds-registry (feedback-bucket-
// and-type, ROADMAP.yaml): свой бакет, Query.presets его вообще не видит.
func TestFeedbackDoesNotAppearAmongPresets(t *testing.T) {
	s := openTestStore(t)
	resolver := New(s, limits.Default)
	ctx := ctxWithLoaders(s)

	if _, err := resolver.Mutation().ReportFeedback(ctx, model.FeedbackInput{
		Tool: "x", Action: "y", Actual: "z",
	}); err != nil {
		t.Fatalf("ReportFeedback: %v", err)
	}
	create(t, s, "palette", "brand", `{"name":"brand"}`)

	presets, err := resolver.Query().Presets(ctx, nil)
	if err != nil {
		t.Fatalf("Presets: %v", err)
	}
	if len(presets) != 1 {
		t.Fatalf("ожидалась ровно одна запись (palette) среди Preset, фидбэк не должен туда попасть: %+v", presets)
	}
}
