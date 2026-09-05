package services

import (
	"encoding/json"
	"errors"
	"fmt"

	"windshift/internal/models"
)

// AddLinkNodeExecutor implements the add_link node type: creates a link
// between two items through the same ItemLinkService pipeline as
// interactive/API linking, so validation, permission checks, and
// item_linked event emission all apply identically. Typically pairs with a
// preceding create_item node: that node's OutputField names a ctx.Variables
// entry this node reads as one endpoint.
type AddLinkNodeExecutor struct {
	links *ItemLinkService
	api   NodeAPI
}

// NewAddLinkNodeExecutor constructs an add_link executor.
func NewAddLinkNodeExecutor(links *ItemLinkService, api NodeAPI) *AddLinkNodeExecutor {
	return &AddLinkNodeExecutor{links: links, api: api}
}

// NodeType pins the node-type dispatch key.
func (e *AddLinkNodeExecutor) NodeType() models.ActionNodeType {
	return models.ActionNodeAddLink
}

// Execute resolves both endpoints and creates the link. An already-existing
// link (either direction) is treated as success-no-op, not an error — reruns
// of the same automation (e.g. a retried event) shouldn't fail on it.
func (e *AddLinkNodeExecutor) Execute(node *models.ActionNode, ctx *models.ExecutionContext, stepResult *models.StepResult) error {
	if e.links == nil {
		return fmt.Errorf("add_link executor missing ItemLinkService dep")
	}
	if ctx == nil {
		return fmt.Errorf("add_link: execution context is required")
	}
	if ctx.EffectiveActorID <= 0 {
		return fmt.Errorf("add_link requires an identified actor")
	}

	var config models.AddLinkNodeConfig
	if err := json.Unmarshal([]byte(node.NodeConfig), &config); err != nil {
		return fmt.Errorf("invalid add_link config: %w", err)
	}
	if config.LinkTypeID <= 0 {
		return fmt.Errorf("add_link: link_type_id is required")
	}

	sourceID, err := e.resolveItemID("source", config.SourceItemID, config.SourceItemField, ctx)
	if err != nil {
		return err
	}
	targetID, err := e.resolveItemID("target", config.TargetItemID, config.TargetItemField, ctx)
	if err != nil {
		return err
	}

	link, err := e.links.CreateLinkWithChecks(ctx.EffectiveActorID, CreateItemLinkParams{
		LinkTypeID: config.LinkTypeID,
		SourceType: "item",
		SourceID:   sourceID,
		TargetType: "item",
		TargetID:   targetID,
	})
	if err != nil {
		if errors.Is(err, ErrLinkExists) {
			stepResult.Output = map[string]any{"skipped": true, "reason": "link already exists", "source_id": sourceID, "target_id": targetID}
			return nil
		}
		return fmt.Errorf("failed to create link: %w", err)
	}

	stepResult.Output = map[string]any{
		"link_id":      link.ID,
		"link_type_id": config.LinkTypeID,
		"source_id":    sourceID,
		"target_id":    targetID,
	}
	return nil
}

func (e *AddLinkNodeExecutor) resolveItemID(side string, explicit *int, field string, ctx *models.ExecutionContext) (int, error) {
	if explicit != nil {
		return *explicit, nil
	}
	if field != "" {
		raw, ok := ctx.Variables[field]
		if !ok {
			return 0, fmt.Errorf("add_link: %s_item_field %q not set in execution variables", side, field)
		}
		id, ok := coerceInt(raw)
		if !ok {
			return 0, fmt.Errorf("add_link: %s_item_field %q is not a number", side, field)
		}
		return id, nil
	}
	id := currentActionItemID(ctx)
	if id <= 0 {
		return 0, fmt.Errorf("add_link: no %s item id resolved (no field configured and no current item in execution context)", side)
	}
	return id, nil
}
