/**
 * Sidebar brand block: instance name + a colorful emoji flanking it on each
 * side. Loaded from /branding-settings once and cached — one instance per
 * repo sets its own name/icons via the admin settings UI, not a fork.
 */

import { api } from '../api.js';
import { isExpectedBackgroundSyncError } from '../utils/backgroundSync.js';

class BrandingStore {
  instanceName = $state('Windshift');
  iconBefore = $state('');
  iconAfter = $state('');
  loaded = $state(false);
  #loadPromise = null;

  load({ force = false } = {}) {
    if (!force && this.loaded) return Promise.resolve();
    if (!force && this.#loadPromise) return this.#loadPromise;

    const request = api.brandingSettings
      .get()
      .then((settings) => {
        this.instanceName = settings?.instance_name || 'Windshift';
        this.iconBefore = settings?.icon_before || '';
        this.iconAfter = settings?.icon_after || '';
        this.loaded = true;
      })
      .catch((error) => {
        if (isExpectedBackgroundSyncError(error)) return;
        console.error('Failed to load branding settings:', error);
        this.loaded = true;
      })
      .finally(() => {
        if (this.#loadPromise === request) this.#loadPromise = null;
      });

    this.#loadPromise = request;
    return request;
  }

  /** Optimistic local update after a successful admin save — no reload. */
  patch({ instanceName, iconBefore, iconAfter }) {
    if (instanceName !== undefined) this.instanceName = instanceName || 'Windshift';
    if (iconBefore !== undefined) this.iconBefore = iconBefore || '';
    if (iconAfter !== undefined) this.iconAfter = iconAfter || '';
  }
}

export const brandingStore = new BrandingStore();
