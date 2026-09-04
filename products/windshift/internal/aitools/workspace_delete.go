package aitools

import (
	"context"

	"windshift/internal/auth"
	"windshift/internal/repository"
)

type deleteWorkspaceArgs struct {
	WorkspaceID int `json:"workspace_id" jsonschema:"Workspace to permanently delete"`
}

// delete_workspace mirrors the cookie-session admin UI's DELETE /workspaces/{id}
// (see internal/handlers/workspaces_handler.go WorkspaceHandler.Delete): a real,
// irreversible row delete — the DB cascade cleans up everything scoped to the
// workspace (items, pages, roles, ...). That endpoint is cookie-session only,
// not reachable over a bearer token, so agents need this MCP-native path
// instead — same gap class already closed for channels/request-types.
func init() {
	Register(Default, Tool[deleteWorkspaceArgs]{
		Name:        "delete_workspace",
		Group:       CapabilityIssueManagement,
		Access:      AccessAdmin,
		Risk:        RiskHigh,
		Description: "Permanently delete a workspace and everything scoped to it (items, pages, roles). Cannot be undone. Requires system admin role and the admin:workspaces:delete scope.",
		Scopes:      []string{auth.ScopeAdminWorkspacesDelete},
		Run: func(_ context.Context, env *Env, args deleteWorkspaceArgs) (any, error) {
			repo := repository.NewWorkspaceRepository(env.DB)
			exists, err := repo.Exists(args.WorkspaceID)
			if err != nil {
				return nil, err
			}
			if !exists {
				return map[string]string{"error": "workspace not found"}, nil
			}
			if err := repo.DropItemSequence(int64(args.WorkspaceID)); err != nil {
				return nil, err
			}
			if err := repo.Delete(args.WorkspaceID); err != nil {
				return nil, err
			}
			if env.PermService != nil {
				env.PermService.InvalidateActiveWorkspaceCache()
			}
			return map[string]any{"deleted": true, "workspace_id": args.WorkspaceID}, nil
		},
	})
}
