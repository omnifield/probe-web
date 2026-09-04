package aitools

import (
	"context"
	"database/sql"
	"errors"
	"log/slog"
	"strings"

	"windshift/internal/auth"
	"windshift/internal/authz"
	"windshift/internal/logger"
	"windshift/internal/models"
	"windshift/internal/repository"
	"windshift/internal/sanitize"
	"windshift/internal/services"
)

type workspaceDTO struct {
	ID            int    `json:"id"`
	Name          string `json:"name"`
	Key           string `json:"key"`
	Description   string `json:"description,omitempty"`
	Icon          string `json:"icon,omitempty"`
	Color         string `json:"color,omitempty"`
	Active        bool   `json:"active"`
	IsPersonal    bool   `json:"is_personal"`
	OwnerID       *int   `json:"owner_id,omitempty"`
	TimeProjectID *int   `json:"time_project_id,omitempty"`
}

type listWorkspacesArgs struct{}

type listWorkspacesOut struct {
	Workspaces []workspaceDTO `json:"workspaces"`
}

type getWorkspaceArgs struct {
	WorkspaceID int `json:"workspace_id" jsonschema:"Workspace ID to retrieve"`
}

type createWorkspaceArgs struct {
	Name                string `json:"name" jsonschema:"Workspace name"`
	Key                 string `json:"key" jsonschema:"Short unique workspace key, used as the item key prefix (e.g. PROJ)"`
	Description         string `json:"description,omitempty" jsonschema:"Workspace description"`
	Icon                string `json:"icon,omitempty" jsonschema:"Lucide icon name shown on the workspace's card/sidebar (e.g. Database, GitBranch, Palette)"`
	Color               string `json:"color,omitempty" jsonschema:"Hex color for the workspace's icon/accent (e.g. #3b82f6)"`
	TemplateWorkspaceID *int   `json:"template_workspace_id,omitempty" jsonschema:"Source workspace ID to clone from. Must be an active, non-personal workspace marked as a template. Copies its configuration set, item templates, seed items, knowledge pages, milestones, and iterations."`
}

type createWorkspaceOut struct {
	Workspace        workspaceDTO `json:"workspace"`
	ClonedFromID     int          `json:"cloned_from_id,omitempty"`
	ItemsCopied      int          `json:"items_copied,omitempty"`
	PagesCopied      int          `json:"pages_copied,omitempty"`
	MilestonesCopied int          `json:"milestones_copied,omitempty"`
	IterationsCopied int          `json:"iterations_copied,omitempty"`
	TemplatesCopied  int          `json:"templates_copied,omitempty"`
}

func init() {
	Register(Default, Tool[listWorkspacesArgs]{
		Name:        "list_workspaces",
		Group:       CapabilityReadComment,
		Access:      AccessRead,
		Risk:        RiskLow,
		Description: "List all workspaces the authenticated user has access to.",
		Scopes:      []string{auth.ScopeWorkspacesRead},
		Run: func(_ context.Context, env *Env, _ listWorkspacesArgs) (any, error) {
			out := listWorkspacesOut{Workspaces: []workspaceDTO{}}
			if len(env.AccessibleWorkspaceIDs) == 0 {
				return out, nil
			}
			repo := repository.NewWorkspaceRepository(env.DB)
			for _, id := range env.AccessibleWorkspaceIDs {
				ws, err := repo.FindByID(id)
				if err != nil {
					continue
				}
				out.Workspaces = append(out.Workspaces, mapWorkspaceDTO(ws.ID, ws.Name, ws.Key, ws.Description, ws.Icon, ws.Color, ws.Active, ws.IsPersonal, ws.OwnerID, ws.TimeProjectID))
			}
			return out, nil
		},
	})

	Register(Default, Tool[getWorkspaceArgs]{
		Name:        "get_workspace",
		Group:       CapabilityReadComment,
		Access:      AccessRead,
		Risk:        RiskLow,
		Description: "Get detailed information about a specific workspace.",
		Scopes:      []string{auth.ScopeWorkspacesRead},
		Run: func(_ context.Context, env *Env, args getWorkspaceArgs) (any, error) {
			if !env.HasWorkspaceAccess(args.WorkspaceID) {
				return map[string]string{"error": "workspace not found"}, nil
			}
			ws, err := repository.NewWorkspaceRepository(env.DB).FindByID(args.WorkspaceID)
			if err != nil {
				if errors.Is(err, sql.ErrNoRows) || errors.Is(err, repository.ErrNotFound) {
					return map[string]string{"error": "workspace not found"}, nil
				}
				return nil, err
			}
			return mapWorkspaceDTO(ws.ID, ws.Name, ws.Key, ws.Description, ws.Icon, ws.Color, ws.Active, ws.IsPersonal, ws.OwnerID, ws.TimeProjectID), nil
		},
	})

	Register(Default, Tool[createWorkspaceArgs]{
		Name:   "create_workspace",
		Group:  CapabilityPlanningActivity,
		Access: AccessWrite,
		Risk:   RiskMedium,
		Description: "Create a new workspace (project). Optionally clone it from a template workspace " +
			"(config set, item templates, seed items, knowledge pages, milestones, iterations) via " +
			"template_workspace_id. Requires the global workspace.create permission.",
		Scopes: []string{auth.ScopeWorkspacesWrite},
		Run: func(ctx context.Context, env *Env, args createWorkspaceArgs) (any, error) {
			if strings.TrimSpace(args.Name) == "" {
				return map[string]string{"error": "name is required"}, nil
			}
			if strings.TrimSpace(args.Key) == "" {
				return map[string]string{"error": "key is required"}, nil
			}
			canCreate, err := env.PermService.HasGlobalPermission(env.UserID, models.PermissionWorkspaceCreate)
			if err != nil {
				return nil, err
			}
			if !canCreate {
				return map[string]string{"error": "permission denied"}, nil
			}

			name := sanitize.ShortIdentifier.Sanitize(args.Name)
			key := sanitize.ShortIdentifier.Sanitize(args.Key)
			desc := sanitize.RichText.Sanitize(args.Description)
			icon := sanitize.ShortIdentifier.Sanitize(args.Icon)
			color := sanitize.ShortIdentifier.Sanitize(args.Color)
			if name == "" {
				return map[string]string{"error": "name is required"}, nil
			}
			if key == "" {
				return map[string]string{"error": "key is required"}, nil
			}

			access := authz.New(env.DB, env.PermService)
			wsSvc := services.NewWorkspaceServiceWithAccess(env.DB, access)
			result, err := wsSvc.Create(ctx, services.CreateWorkspaceParams{
				Name:                name,
				Key:                 key,
				Description:         desc,
				Icon:                icon,
				Color:               color,
				CreatorID:           env.UserID,
				DefaultView:         "board",
				TemplateWorkspaceID: args.TemplateWorkspaceID,
			})
			if err != nil {
				return workspaceCreateToolError(err), nil
			}

			// Mirrors the HTTP handler's post-create steps (workspaces_handler.go
			// Create): item key sequence for Postgres (no-op on SQLite), plus
			// permission-cache invalidation so the new workspace is immediately
			// visible to subsequent permission checks in this process.
			if seqErr := repository.NewWorkspaceRepository(env.DB).CreateItemSequence(int64(result.Workspace.ID)); seqErr != nil {
				slog.Warn("failed to create item sequence for workspace",
					slog.String("component", "aitools"),
					slog.Int("workspace_id", result.Workspace.ID),
					slog.Any("error", seqErr))
			}
			env.PermService.InvalidateActiveWorkspaceCache()
			env.PermService.OnEveryoneAccessChanged()

			env.AuditWrite(logger.ResourceWorkspace, result.Workspace.ID, "create_workspace", result.Workspace.Name)

			return createWorkspaceOut{
				Workspace: mapWorkspaceDTO(result.Workspace.ID, result.Workspace.Name, result.Workspace.Key,
					result.Workspace.Description, result.Workspace.Icon, result.Workspace.Color,
					result.Workspace.Active, result.Workspace.IsPersonal, result.Workspace.OwnerID, result.Workspace.TimeProjectID),
				ClonedFromID:     result.SourceWorkspaceID,
				ItemsCopied:      result.ItemsCopied,
				PagesCopied:      result.PagesCopied,
				MilestonesCopied: result.MilestonesCopied,
				IterationsCopied: result.IterationsCopied,
				TemplatesCopied:  result.TemplatesCopied,
			}, nil
		},
	})
}

func mapWorkspaceDTO(id int, name, key, desc, icon, color string, active, isPersonal bool, owner, timeProj *int) workspaceDTO {
	return workspaceDTO{
		ID: id, Name: name, Key: key, Description: desc, Icon: icon, Color: color,
		Active: active, IsPersonal: isPersonal, OwnerID: owner, TimeProjectID: timeProj,
	}
}

// workspaceCreateToolError maps WorkspaceService.Create's sentinel errors to
// tool-shaped JSON, mirroring pageMutationToolError's approach for pages.
func workspaceCreateToolError(err error) map[string]string {
	switch {
	case errors.Is(err, services.ErrTemplateWorkspaceNotFound):
		return map[string]string{"error": "template workspace not found"}
	case errors.Is(err, services.ErrInvalidWorkspaceTemplate):
		return map[string]string{"error": "source workspace cannot be used as a template"}
	case errors.Is(err, services.ErrWorkspaceTemplateTooLarge):
		return map[string]string{"error": "template workspace has too many seed items to clone"}
	case errors.Is(err, repository.ErrDuplicateEntry):
		return map[string]string{"error": "a workspace with this key already exists"}
	default:
		return map[string]string{"error": err.Error()}
	}
}
