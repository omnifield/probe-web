import { GanttChart } from '@lucide/svelte';
import {
  IconAdjustments as Adjustments,
  IconUserStar as AgentIcon,
  IconChartBar as BarChart3,
  IconBook as Book,
  IconCalendar as Calendar,
  IconFileCheck as FileCheck,
  IconFileStack as FileStack,
  IconGitBranch as GitBranch,
  IconList as List,
  IconListTree as ListTree,
  IconMapPin as MapPin,
  IconFlag as Milestone,
  IconPackage as Package,
  IconPlayerPlay as Play,
  IconRefresh as Refresh,
  IconRepeat as Repeat,
  IconLayoutRows as Rows_3,
  IconSettings as SettingsCog,
  IconLayoutKanban as SquareKanban,
  IconTags as Tags,
  IconTrash as Trash,
  IconTrendingUp as TrendingUp,
  IconUsers as Users,
  IconBolt as Zap,
} from '@tabler/icons-svelte-runes';

/**
 * @typedef {Object} WorkspaceView
 * @property {string} id
 * @property {string} label
 * @property {any}    icon
 * @property {string} [tooltip]
 * @property {string} [testId]
 * @property {string[]} [activeViews]  Route view names that highlight this item.
 */

/**
 * Collection-scoped workspace views (visible inside collections too).
 * @type {WorkspaceView[]}
 */
export const workspaceViewItems = [
  {
    id: 'backlog',
    label: 'Backlog',
    labelKey: 'workspaceSettings.views.backlog',
    icon: Rows_3,
    tooltip: 'Backlog view for unfinished items',
    tooltipKey: 'workspaceNav.tooltips.backlog',
  },
  {
    id: 'board',
    label: 'Board',
    labelKey: 'workspaceSettings.views.board',
    icon: SquareKanban,
    tooltip: 'Kanban board view with columns',
    tooltipKey: 'workspaceNav.tooltips.board',
    testId: 'workspace-nav-board',
  },
  {
    id: 'list',
    label: 'List',
    labelKey: 'workspaceSettings.views.list',
    icon: List,
    tooltip: 'Detailed list view with all fields',
    tooltipKey: 'workspaceNav.tooltips.list',
  },
  {
    id: 'tree',
    label: 'Tree',
    labelKey: 'workspaceSettings.views.tree',
    icon: ListTree,
    tooltip: 'Hierarchical tree view for nested items',
    tooltipKey: 'workspaceNav.tooltips.tree',
  },
  {
    id: 'map',
    label: 'Map',
    labelKey: 'workspaceSettings.views.map',
    icon: MapPin,
    tooltip: 'Visual map view for spatial organization',
    tooltipKey: 'workspaceNav.tooltips.map',
  },
  {
    id: 'roadmap',
    label: 'Roadmap',
    labelKey: 'workspaceSettings.views.roadmap',
    icon: GanttChart,
    tooltip: 'Timeline view with date ranges and dependencies',
    tooltipKey: 'workspaceNav.tooltips.roadmap',
  },
];

/**
 * Workspace tools which are not scoped to a collection.
 * @type {WorkspaceView[]}
 */
export const workspaceOnlyViews = [
  {
    id: 'agents',
    label: 'Agents',
    labelKey: 'workspaceNav.tools.agents',
    icon: AgentIcon,
    tooltip: 'Meet and work with workspace agents',
    tooltipKey: 'workspaceNav.toolTooltips.agents',
    testId: 'workspace-nav-agents',
    activeViews: ['workspace-agents', 'workspace-agent-profile', 'workspace-agent-create'],
  },
  {
    id: 'iterations',
    label: 'Iterations',
    labelKey: 'workspaceNav.tools.iterations',
    icon: Calendar,
    tooltip: 'Manage sprints, PIs, and other iteration cycles',
    tooltipKey: 'workspaceNav.toolTooltips.iterations',
  },
  {
    id: 'milestones',
    label: 'Milestones',
    labelKey: 'workspaceNav.tools.milestones',
    icon: Milestone,
    tooltip: 'Manage workspace milestones and releases',
    tooltipKey: 'workspaceNav.toolTooltips.milestones',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    labelKey: 'workspaceNav.tools.analytics',
    icon: TrendingUp,
    tooltip: 'Velocity, cycle time, and forecasting',
    tooltipKey: 'workspaceNav.toolTooltips.analytics',
  },
  {
    id: 'actions',
    label: 'Actions',
    labelKey: 'workspaceNav.tools.actions',
    icon: Zap,
    tooltip: 'Automate workflows and triggers',
    tooltipKey: 'workspaceNav.toolTooltips.actions',
  },
  {
    id: 'pages',
    label: 'Pages',
    labelKey: 'workspaceNav.tools.pages',
    icon: Book,
    tooltip: 'Workspace knowledge pages (wiki)',
    tooltipKey: 'workspaceNav.toolTooltips.pages',
    activeViews: ['workspace-pages'],
  },
];

/**
 * Test management navigation items, visible only when the test-management
 * module is enabled AND the user has view permission.
 * @type {WorkspaceView[]}
 */
export const testNavigationItems = [
  {
    id: 'test-cases',
    label: 'Test Cases',
    labelKey: 'workspaceNav.tests.testCases',
    icon: FileCheck,
    tooltip: 'Manage test cases and steps',
    tooltipKey: 'workspaceNav.testTooltips.testCases',
    activeViews: ['test-cases', 'test-case-detail', 'test-steps'],
  },
  {
    id: 'test-sets',
    label: 'Test Plans',
    labelKey: 'workspaceNav.tests.testPlans',
    icon: Package,
    tooltip: 'Organize plans and suites',
    tooltipKey: 'workspaceNav.testTooltips.testPlans',
    activeViews: ['test-sets', 'test-set-detail'],
  },
  {
    id: 'test-templates',
    label: 'Templates',
    labelKey: 'workspaceNav.tests.templates',
    icon: FileStack,
    tooltip: 'Template runs and shared steps',
    tooltipKey: 'workspaceNav.testTooltips.templates',
    activeViews: ['test-templates', 'test-template-detail'],
  },
  {
    id: 'test-runs',
    label: 'Test Runs',
    labelKey: 'workspaceNav.tests.testRuns',
    icon: Play,
    tooltip: 'Schedule and execute runs',
    tooltipKey: 'workspaceNav.testTooltips.testRuns',
    activeViews: ['test-runs', 'test-run-detail', 'test-execution'],
  },
  {
    id: 'test-reports',
    label: 'Reports',
    labelKey: 'workspaceNav.tests.reports',
    icon: BarChart3,
    tooltip: 'Review execution results',
    tooltipKey: 'workspaceNav.testTooltips.reports',
    activeViews: ['test-reports'],
  },
];

/**
 * @typedef {Object} WorkspaceSettingsItem
 * @property {string}  id        Module id (matches the `/settings/<id>` route segment).
 * @property {string}  labelKey  i18n key for the module label (resolve with `t()`).
 * @property {any}     icon      Icon component.
 * @property {string}  view      Route view name that highlights this item.
 * @property {boolean} [danger]  Styled as a destructive action when true.
 */

/**
 * Workspace admin (Settings) modules, in display order. Drives the folded
 * admin sidebar (`WorkspaceAdminNav`) and its collapsed icon rail. Routes are
 * `/workspaces/:id/settings/<id>` — use `workspaceSettingsRoute(workspaceId, id)`.
 * @type {WorkspaceSettingsItem[]}
 */
export const workspaceSettingsItems = [
  {
    id: 'general',
    labelKey: 'workspaceSettings.tabs.general',
    icon: SettingsCog,
    view: 'workspace-settings-general',
  },
  {
    id: 'categories',
    labelKey: 'workspaceSettings.tabs.categories',
    icon: Tags,
    view: 'workspace-settings-categories',
  },
  {
    id: 'members',
    labelKey: 'workspaceSettings.tabs.members',
    icon: Users,
    view: 'workspace-settings-members',
  },
  {
    id: 'configuration',
    labelKey: 'workspaceSettings.tabs.configurationSets',
    icon: Adjustments,
    view: 'workspace-settings-configuration',
  },
  {
    id: 'source-control',
    labelKey: 'workspaceSettings.tabs.sourceControl',
    icon: GitBranch,
    view: 'workspace-settings-source-control',
  },
  {
    id: 'issue-sync',
    labelKey: 'workspaceSettings.tabs.issueSync',
    icon: Refresh,
    view: 'workspace-settings-issue-sync',
  },
  {
    id: 'recurrence',
    labelKey: 'workspaceSettings.tabs.recurrence',
    icon: Repeat,
    view: 'workspace-settings-recurrence',
  },
  {
    id: 'templates',
    labelKey: 'workspaceSettings.tabs.templates',
    icon: FileStack,
    view: 'workspace-settings-templates',
  },
  {
    id: 'danger',
    labelKey: 'workspaceSettings.tabs.removeWorkspace',
    icon: Trash,
    view: 'workspace-settings-danger',
    danger: true,
  },
];

/** All route view names that belong to the workspace admin area. */
export const workspaceSettingsViews = [
  'workspace-settings',
  ...workspaceSettingsItems.map((item) => item.view),
];

/** Build the route for a settings module. */
export function workspaceSettingsRoute(workspaceId, id) {
  return `/workspaces/${workspaceId}/settings/${id}`;
}
