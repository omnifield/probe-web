import { get } from 'svelte/store';
import { workspacesStore } from '../stores/workspaces.svelte.js';

/**
 * Resolve a route's raw workspace URL segment (numeric id or workspace key,
 * e.g. "3" or "assembly") to the canonical numeric workspace id used
 * throughout app state and API comparisons. Falls back to the raw value if
 * it looks like a key but isn't found yet (workspace list not loaded).
 */
export function resolveWorkspaceIdParam(raw) {
  if (raw == null) return raw;
  if (/^\d+$/.test(String(raw))) return Number(raw);
  const { allWorkspaces } = get(workspacesStore);
  const match = allWorkspaces?.find(
    (w) => w.key && w.key.toLowerCase() === String(raw).toLowerCase()
  );
  return match ? match.id : raw;
}

/**
 * The inverse: given a numeric workspace id and the loaded workspace list,
 * return its key for building a human-readable URL. Falls back to the
 * numeric id when the workspace isn't found (list not loaded yet).
 */
export function workspaceUrlSegment(workspaceId, allWorkspaces) {
  return allWorkspaces?.find((w) => w.id === workspaceId)?.key || workspaceId;
}
