-- Groups workspaces in the sidebar (apps/packages/features/…). Its own
-- color drives the group separator/label — independent of each
-- workspace's own icon color (workspaces.color, below).
CREATE TABLE IF NOT EXISTS workspace_categories (
	id SERIAL PRIMARY KEY,
	name TEXT UNIQUE NOT NULL,
	color TEXT NOT NULL,
	description TEXT,
	sort_order INTEGER NOT NULL DEFAULT 0,
	created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO workspace_categories (name, color, sort_order) VALUES
('apps', '#7c3aed', 1),
('packages', '#3b82f6', 2),
('features', '#059669', 3)
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS workspaces (
	id SERIAL PRIMARY KEY,
	name TEXT NOT NULL,
	key TEXT UNIQUE NOT NULL, -- Workspace key for issue prefixes (e.g., TEST, PROJ)
	description TEXT,
	time_project_id INTEGER REFERENCES time_projects(id) ON DELETE SET NULL,
	category_id INTEGER REFERENCES workspace_categories(id) ON DELETE SET NULL,
	active BOOLEAN DEFAULT true,
	is_personal BOOLEAN DEFAULT false, -- Flag for personal workspaces
	owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Owner for personal workspaces
	icon TEXT,
	color TEXT,
	avatar_url TEXT,
	homepage_layout TEXT, -- JSON array of gadget configurations
	default_view TEXT DEFAULT 'board', -- Default view when entering workspace (board, backlog, list, tree, map)
	display_mode TEXT DEFAULT 'default', -- Display mode for workspace layout (default, board)
	internal_comments_enabled BOOLEAN DEFAULT false, -- Allow internal comments on all items (not just portal requests)
	is_template BOOLEAN DEFAULT false, -- Workspace can be used as a creation template
	is_overview BOOLEAN DEFAULT false, -- The one canonical root/about workspace of a group, pinned first in the sidebar
	created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_workspaces_is_personal ON workspaces(is_personal);
CREATE INDEX IF NOT EXISTS idx_workspaces_owner_id ON workspaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_template_active ON workspaces(is_template, active) WHERE is_template = true;
CREATE INDEX IF NOT EXISTS idx_workspaces_category_id ON workspaces(category_id);

-- migration: 20260815_workspaces_is_template
-- migration: 20260905_workspace_categories
-- migration: 20260905_workspaces_is_overview

-- Junction table for workspace and time project categories relationship
CREATE TABLE IF NOT EXISTS workspace_time_project_categories (
	id SERIAL PRIMARY KEY,
	workspace_id INTEGER NOT NULL,
	time_project_category_id INTEGER NOT NULL,
	created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
	FOREIGN KEY (time_project_category_id) REFERENCES time_project_categories(id) ON DELETE CASCADE,
	UNIQUE(workspace_id, time_project_category_id)
);

CREATE INDEX IF NOT EXISTS idx_workspace_time_project_categories_workspace_id ON workspace_time_project_categories(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_time_project_categories_category_id ON workspace_time_project_categories(time_project_category_id);