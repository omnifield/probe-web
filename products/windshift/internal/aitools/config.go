package aitools

import (
	"context"
	"strings"
	"time"

	"windshift/internal/auth"
	"windshift/internal/models"
	"windshift/internal/repository"
	"windshift/internal/services"
)

// --- arg types ---

type createItemTypeArgs struct {
	Name           string `json:"name" jsonschema:"Item type name"`
	Description    string `json:"description,omitempty" jsonschema:"Optional description"`
	Icon           string `json:"icon,omitempty" jsonschema:"Lucide icon name (default: Circle)"`
	Color          string `json:"color,omitempty" jsonschema:"Hex color, e.g. #3B82F6"`
	HierarchyLevel int    `json:"hierarchy_level,omitempty" jsonschema:"0 = top level, 1 = one level down, etc."`
	SortOrder      int    `json:"sort_order,omitempty" jsonschema:"Display order among sibling item types"`
}

type createCustomFieldArgs struct {
	Name         string `json:"name" jsonschema:"Custom field name"`
	FieldType    string `json:"field_type" jsonschema:"One of: text, textarea, number, date, select, multiselect, boolean"`
	Description  string `json:"description,omitempty" jsonschema:"Optional description"`
	Required     bool   `json:"required,omitempty" jsonschema:"Whether the field must be filled in"`
	Options      string `json:"options,omitempty" jsonschema:"JSON options; select/multiselect only, e.g. {\"items\":[{\"id\":1,\"label\":\"A\"}],\"nextId\":2}"`
	DisplayOrder int    `json:"display_order,omitempty" jsonschema:"Display order among fields"`
}

// --- registration ---

// These two tools deliberately require an elevated, non-agent-default scope
// (auth.ScopeAdminItemTypesWrite / ScopeAdminCustomFieldsWrite) and the
// system admin role, mirroring the cookie-session admin UI's
// /admin/item-types and /admin/custom-fields — item types and custom fields
// are a global catalog shared by every workspace, not a per-workspace
// concern. See internal/restapi/v1/handlers/config.go for the HTTP twin.
func init() {
	Register(Default, Tool[createItemTypeArgs]{
		Name:        "create_item_type",
		Group:       CapabilityIssueManagement,
		Access:      AccessAdmin,
		Risk:        RiskHigh,
		Description: "Create a new item type (work item classification). Global catalog entry shared by every workspace. Requires system admin role and the admin:item-types:write scope.",
		Scopes:      []string{auth.ScopeAdminItemTypesWrite},
		Run: func(_ context.Context, env *Env, args createItemTypeArgs) (any, error) {
			name := strings.TrimSpace(args.Name)
			if name == "" {
				return map[string]string{"error": "name is required"}, nil
			}

			svc := services.NewEnumService(env.DB, services.NewItemTypeConfig())
			created, err := svc.Create(&models.ItemType{
				Name:           name,
				Description:    args.Description,
				Icon:           args.Icon,
				Color:          args.Color,
				HierarchyLevel: args.HierarchyLevel,
				SortOrder:      args.SortOrder,
			}, nil)
			if err != nil {
				if se, ok := err.(*services.ServiceError); ok {
					return map[string]string{"error": se.Message}, nil
				}
				return nil, err
			}

			it, ok := created.(*models.ItemType)
			if !ok {
				return nil, services.NewServiceError(500, "unexpected entity type from EnumService")
			}
			return map[string]any{"item_type": it}, nil
		},
	})

	Register(Default, Tool[createCustomFieldArgs]{
		Name:   "create_custom_field",
		Group:  CapabilityIssueManagement,
		Access: AccessAdmin,
		Risk:   RiskHigh,
		Description: "Create a new custom field definition. Global catalog entry attachable to any item type. Accepts simple field types only " +
			"(text, textarea, number, date, select, multiselect, boolean) — relationship-shaped types (linking, asset, user, milestone, " +
			"iteration, portal customer/organisation) require Windshift's admin settings UI. Requires system admin role and the " +
			"admin:custom-fields:write scope.",
		Scopes: []string{auth.ScopeAdminCustomFieldsWrite},
		Run: func(_ context.Context, env *Env, args createCustomFieldArgs) (any, error) {
			name := strings.TrimSpace(args.Name)
			if name == "" {
				return map[string]string{"error": "name is required"}, nil
			}

			fieldType := models.CanonicalCustomFieldType(args.FieldType)
			if !models.IsSimpleCustomFieldType(fieldType) {
				return map[string]string{"error": "unsupported field_type — use text, textarea, number, date, select, multiselect, or boolean"}, nil
			}

			options := args.Options
			switch {
			case models.IsBooleanCustomFieldType(fieldType):
				options = ""
			case fieldType == "select" || fieldType == "multiselect":
				opts, err := models.ParseSelectOptions(options)
				if err != nil {
					return map[string]string{"error": "invalid options format"}, nil
				}
				if len(opts.Items) == 0 {
					return map[string]string{"error": "select fields must have at least one option"}, nil
				}
				seen := make(map[string]bool, len(opts.Items))
				for _, item := range opts.Items {
					if seen[item.Label] {
						return map[string]string{"error": "duplicate option label: " + item.Label}, nil
					}
					seen[item.Label] = true
				}
				normalized, err := models.SerializeSelectOptions(opts)
				if err != nil {
					return nil, err
				}
				options = normalized
			}

			repo := repository.NewCustomFieldRepository(env.DB)
			id, err := repo.Create(&models.CustomFieldDefinition{
				Name:         name,
				FieldType:    fieldType,
				Description:  args.Description,
				Required:     args.Required,
				Options:      options,
				DisplayOrder: args.DisplayOrder,
			}, time.Now())
			if err != nil {
				return nil, err
			}

			created, err := repo.FindByID(int(id))
			if err != nil {
				return nil, err
			}
			return map[string]any{"custom_field": created}, nil
		},
	})
}
