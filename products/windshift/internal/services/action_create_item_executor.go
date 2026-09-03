package services

import (
	"encoding/json"
	"fmt"
	"strings"

	"windshift/internal/models"
	"windshift/internal/sanitize"
)

// CreateItemNodeExecutor implements the create_item node type for the main
// workspace actions engine: creates a new work item through the same
// ItemCreationService pipeline as interactive/API creation, so hierarchy
// rules, validation, and item_created event emission all apply identically.
// Mirrors AssetActionService.executeCreateItem, but for the workspace
// engine's richer ExecutionContext (current item, iterator support).
type CreateItemNodeExecutor struct {
	itemCreation *ItemCreationService
	permissions  *PermissionService
	api          NodeAPI
}

// NewCreateItemNodeExecutor constructs a create_item executor. All three
// deps are required; Execute returns a configuration error rather than
// panicking when one is missing, so a partial DI wiring is debuggable.
func NewCreateItemNodeExecutor(itemCreation *ItemCreationService, permissions *PermissionService, api NodeAPI) *CreateItemNodeExecutor {
	return &CreateItemNodeExecutor{itemCreation: itemCreation, permissions: permissions, api: api}
}

// NodeType pins the node-type dispatch key.
func (e *CreateItemNodeExecutor) NodeType() models.ActionNodeType {
	return models.ActionNodeCreateItem
}

// Execute renders the templated title/description, resolves the parent
// (fixed ID or "whatever item is currently in execution context"), and
// creates the item. stepResult.Output carries the new item_id so downstream
// nodes' {{step.N.item_id}} references (and the run-history UI) can use it.
func (e *CreateItemNodeExecutor) Execute(node *models.ActionNode, ctx *models.ExecutionContext, stepResult *models.StepResult) error {
	if e.itemCreation == nil {
		return fmt.Errorf("create_item executor missing ItemCreationService dep")
	}
	if e.permissions == nil {
		return fmt.Errorf("create_item executor missing PermissionService dep")
	}
	if e.api == nil {
		return fmt.Errorf("create_item executor missing NodeAPI dep")
	}
	if ctx == nil {
		return fmt.Errorf("create_item: execution context is required")
	}

	var config models.CreateItemNodeConfig
	if err := json.Unmarshal([]byte(node.NodeConfig), &config); err != nil {
		return fmt.Errorf("invalid create_item config: %w", err)
	}
	if config.WorkspaceID <= 0 {
		return fmt.Errorf("create_item: workspace_id is required")
	}
	if config.ItemTypeID <= 0 {
		return fmt.Errorf("create_item: item_type_id is required")
	}

	if ctx.EffectiveActorID <= 0 {
		return fmt.Errorf("create_item requires an identified actor")
	}
	// Mirrors the create_item MCP/REST tool's own check (item.edit, not the
	// otherwise-unused item.create key) so the same operation is gated
	// identically regardless of which surface triggers it.
	ok, err := e.permissions.HasWorkspacePermission(ctx.EffectiveActorID, config.WorkspaceID, models.PermissionItemEdit)
	if err != nil {
		return fmt.Errorf("failed to check workspace %d permission: %w", config.WorkspaceID, err)
	}
	if !ok {
		return fmt.Errorf("user %d not authorized (%s) on workspace %d", ctx.EffectiveActorID, models.PermissionItemEdit, config.WorkspaceID)
	}

	title := strings.TrimSpace(e.api.SubstituteVariables(config.Title, ctx))
	description := e.api.SubstituteVariables(config.Description, ctx)
	sanitize.ApplyAll(
		sanitize.Pair{Target: &title, Policy: sanitize.PlainTextField},
		sanitize.Pair{Target: &description, Policy: sanitize.RichText},
	)
	if title == "" {
		return fmt.Errorf("create_item: title is empty after rendering/sanitization")
	}

	itemTypeID := config.ItemTypeID
	input := ItemCreateInput{
		WorkspaceID: config.WorkspaceID,
		Title:       title,
		Description: description,
		ItemTypeID:  &itemTypeID,
		StatusID:    config.StatusID,
		PriorityID:  config.PriorityID,
	}
	switch {
	case config.ParentID != nil:
		input.ParentID = config.ParentID
	case config.ParentFromCurrentItem:
		parentID := currentActionItemID(ctx)
		if parentID <= 0 {
			return fmt.Errorf("create_item: parent_from_current_item set but no current item in execution context")
		}
		input.ParentID = &parentID
	}

	depth := 1
	if ctx.Event != nil {
		depth = ctx.Event.CascadeDepth + 1
	}
	result, err := e.itemCreation.CreateWithContext(ctx.EffectiveActorID, "", input, ActionContext{
		TriggeredByAction: true,
		ExecutionChainID:  ctx.ChainID,
		CascadeDepth:      depth,
		SourceApplication: "workspace",
	})
	if err != nil {
		return fmt.Errorf("failed to create item: %w", err)
	}

	stepResult.Output = map[string]any{
		"item_id":      result.Item.ID,
		"title":        result.Item.Title,
		"workspace_id": config.WorkspaceID,
	}
	if input.ParentID != nil {
		stepResult.Output["parent_id"] = *input.ParentID
	}
	if config.OutputField != "" {
		if ctx.Variables == nil {
			ctx.Variables = map[string]any{}
		}
		ctx.Variables[config.OutputField] = result.Item.ID
	}
	return nil
}
