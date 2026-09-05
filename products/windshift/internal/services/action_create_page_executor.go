package services

import (
	"encoding/json"
	"fmt"

	"windshift/internal/models"
)

// CreatePageNodeExecutor implements the create_page node type: creates a
// wiki page through the same PageApplicationService pipeline used by
// interactive/API creation, so permission checks and audit rows match. No
// prior art exists for this node (logbook/asset engines only create
// items/assets), so it's designed fresh, following CreateItemNodeExecutor's
// shape.
type CreatePageNodeExecutor struct {
	pages *PageApplicationService
	api   NodeAPI
}

// NewCreatePageNodeExecutor constructs a create_page executor.
func NewCreatePageNodeExecutor(pages *PageApplicationService, api NodeAPI) *CreatePageNodeExecutor {
	return &CreatePageNodeExecutor{pages: pages, api: api}
}

// NodeType pins the node-type dispatch key.
func (e *CreatePageNodeExecutor) NodeType() models.ActionNodeType {
	return models.ActionNodeCreatePage
}

// Execute renders the templated title/content and creates the page.
// PageApplicationService.Create handles its own sanitization and permission
// checks (page.create on the workspace, page.edit on ParentPageID when set).
func (e *CreatePageNodeExecutor) Execute(node *models.ActionNode, ctx *models.ExecutionContext, stepResult *models.StepResult) error {
	if e.pages == nil {
		return fmt.Errorf("create_page executor missing PageApplicationService dep")
	}
	if e.api == nil {
		return fmt.Errorf("create_page executor missing NodeAPI dep")
	}
	if ctx == nil {
		return fmt.Errorf("create_page: execution context is required")
	}
	if ctx.EffectiveActorID <= 0 {
		return fmt.Errorf("create_page requires an identified actor")
	}

	var config models.CreatePageNodeConfig
	if err := json.Unmarshal([]byte(node.NodeConfig), &config); err != nil {
		return fmt.Errorf("invalid create_page config: %w", err)
	}
	if config.WorkspaceID <= 0 {
		return fmt.Errorf("create_page: workspace_id is required")
	}

	title := e.api.SubstituteVariables(config.Title, ctx)
	content := e.api.SubstituteVariables(config.Content, ctx)

	page, err := e.pages.Create(AuditActor{UserID: ctx.EffectiveActorID, Source: "action"}, CreatePageInput{
		WorkspaceID: config.WorkspaceID,
		ParentID:    config.ParentPageID,
		Title:       title,
		Content:     content,
	})
	if err != nil {
		return fmt.Errorf("failed to create page: %w", err)
	}

	stepResult.Output = map[string]any{
		"page_id":      page.ID,
		"title":        page.Title,
		"workspace_id": config.WorkspaceID,
	}
	if config.OutputField != "" {
		if ctx.Variables == nil {
			ctx.Variables = map[string]any{}
		}
		ctx.Variables[config.OutputField] = page.ID
	}
	return nil
}
