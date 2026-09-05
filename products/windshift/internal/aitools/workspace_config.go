package aitools

import (
	"context"

	"windshift/internal/auth"
	"windshift/internal/models"
	"windshift/internal/services"
)

// list_item_types / list_priorities / list_statuses expose the same
// per-workspace catalog data as GET /workspaces/{id}/item-types|priorities|statuses
// (see internal/restapi/v1/handlers/workspaces.go) — needed to resolve the
// numeric IDs create_item/update_item/transition_item require (item_type_id,
// priority_id, status_id) without round-tripping through the REST API.

type listWorkspaceCatalogArgs struct {
	WorkspaceID int `json:"workspace_id" jsonschema:"Workspace ID to list the catalog for"`
}

type itemTypeDTO struct {
	ID             int    `json:"id"`
	Name           string `json:"name"`
	Description    string `json:"description,omitempty"`
	Icon           string `json:"icon,omitempty"`
	Color          string `json:"color,omitempty"`
	HierarchyLevel int    `json:"hierarchy_level"`
	SortOrder      int    `json:"sort_order"`
	IsDefault      bool   `json:"is_default"`
}

type priorityDTO struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description,omitempty"`
	Icon        string `json:"icon,omitempty"`
	Color       string `json:"color,omitempty"`
	SortOrder   int    `json:"sort_order"`
	IsDefault   bool   `json:"is_default"`
}

type listWorkspaceCategoriesArgs struct{}

type workspaceCategoryDTO struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	Color       string `json:"color"`
	Description string `json:"description,omitempty"`
	SortOrder   int    `json:"sort_order"`
}

type statusDTO struct {
	ID            int    `json:"id"`
	Name          string `json:"name"`
	CategoryID    int    `json:"category_id"`
	CategoryName  string `json:"category_name,omitempty"`
	CategoryColor string `json:"category_color,omitempty"`
	IsCompleted   bool   `json:"is_completed,omitempty"`
}

func init() {
	Register(Default, Tool[listWorkspaceCatalogArgs]{
		Name:        "list_item_types",
		Group:       CapabilityPlanningActivity,
		Access:      AccessRead,
		Risk:        RiskLow,
		Description: "List item types configured for a workspace (id, hierarchy level) — resolve item_type_id for create_item without guessing.",
		Scopes:      []string{auth.ScopeWorkspacesRead},
		Run: func(_ context.Context, env *Env, args listWorkspaceCatalogArgs) (any, error) {
			if !env.HasWorkspaceAccess(args.WorkspaceID) {
				return map[string]string{"error": "workspace not found"}, nil
			}
			types, err := services.NewWorkspaceService(env.DB).GetItemTypes(args.WorkspaceID)
			if err != nil {
				return nil, err
			}
			out := make([]itemTypeDTO, 0, len(types))
			for _, t := range types {
				out = append(out, itemTypeDTO{
					ID: t.ID, Name: t.Name, Description: t.Description, Icon: t.Icon,
					Color: t.Color, HierarchyLevel: t.HierarchyLevel, SortOrder: t.SortOrder, IsDefault: t.IsDefault,
				})
			}
			return map[string]any{"item_types": out}, nil
		},
	})

	Register(Default, Tool[listWorkspaceCatalogArgs]{
		Name:        "list_priorities",
		Group:       CapabilityPlanningActivity,
		Access:      AccessRead,
		Risk:        RiskLow,
		Description: "List priorities configured for a workspace — resolve priority_id for create_item/update_item without guessing.",
		Scopes:      []string{auth.ScopeWorkspacesRead},
		Run: func(_ context.Context, env *Env, args listWorkspaceCatalogArgs) (any, error) {
			if !env.HasWorkspaceAccess(args.WorkspaceID) {
				return map[string]string{"error": "workspace not found"}, nil
			}
			priorities, err := services.NewWorkspaceService(env.DB).GetPriorities(args.WorkspaceID)
			if err != nil {
				return nil, err
			}
			out := make([]priorityDTO, 0, len(priorities))
			for _, p := range priorities {
				out = append(out, priorityDTO{
					ID: p.ID, Name: p.Name, Description: p.Description, Icon: p.Icon,
					Color: p.Color, SortOrder: p.SortOrder, IsDefault: p.IsDefault,
				})
			}
			return map[string]any{"priorities": out}, nil
		},
	})

	Register(Default, Tool[listWorkspaceCategoriesArgs]{
		Name:        "list_workspace_categories",
		Group:       CapabilityPlanningActivity,
		Access:      AccessRead,
		Risk:        RiskLow,
		Description: "List sidebar categories that group workspaces (e.g. apps/packages/features), each with its own color — resolve category_id for update_workspace.",
		Scopes:      []string{auth.ScopeWorkspacesRead},
		Run: func(_ context.Context, env *Env, _ listWorkspaceCategoriesArgs) (any, error) {
			entities, err := services.NewEnumService(env.DB, services.NewWorkspaceCategoryConfig()).GetAll()
			if err != nil {
				return nil, err
			}
			out := make([]workspaceCategoryDTO, 0, len(entities))
			for _, e := range entities {
				c, ok := e.(*models.WorkspaceCategory)
				if !ok {
					continue
				}
				out = append(out, workspaceCategoryDTO{
					ID: c.ID, Name: c.Name, Color: c.Color, Description: c.Description, SortOrder: c.SortOrder,
				})
			}
			return map[string]any{"categories": out}, nil
		},
	})

	Register(Default, Tool[listWorkspaceCatalogArgs]{
		Name:        "list_statuses",
		Group:       CapabilityPlanningActivity,
		Access:      AccessRead,
		Risk:        RiskLow,
		Description: "List workflow statuses configured for a workspace — resolve status_id for create_item/transition_item without guessing.",
		Scopes:      []string{auth.ScopeWorkspacesRead},
		Run: func(_ context.Context, env *Env, args listWorkspaceCatalogArgs) (any, error) {
			if !env.HasWorkspaceAccess(args.WorkspaceID) {
				return map[string]string{"error": "workspace not found"}, nil
			}
			statuses, err := services.NewWorkspaceService(env.DB).GetStatuses(args.WorkspaceID)
			if err != nil {
				return nil, err
			}
			out := make([]statusDTO, 0, len(statuses))
			for _, s := range statuses {
				out = append(out, statusDTO{
					ID: s.ID, Name: s.Name, CategoryID: s.CategoryID,
					CategoryName: s.CategoryName, CategoryColor: s.CategoryColor, IsCompleted: s.IsCompleted,
				})
			}
			return map[string]any{"statuses": out}, nil
		},
	})
}
