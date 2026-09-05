<script>
  import { currentRoute, isWorkspaceRoute } from '../router.js';
  import { permissionStore, uiStore, workspaceCategoriesStore, workspacesStore } from '../stores';
  import { brandingStore } from '../stores/branding.svelte.js';
  import { t } from '../stores/i18n.svelte.js';
  import { aiStore } from '../stores/aiStore.svelte.js';
  import { getShortcutDisplay } from '../utils/keyboardShortcuts.js';
  import { workspaceIconMap } from '../utils/icons.js';
  import { isTauri as getIsTauri } from '../utils/isTauri.js';
  import DropdownMenu from './DropdownMenu.svelte';
  import Tooltip from '../components/Tooltip.svelte';
  import NavLink from './NavLink.svelte';
  import UserAvatar from '../components/UserAvatar.svelte';
  import NotificationTray from '../features/notifications/NotificationTray.svelte';
  import {
    IconSearch, IconSettings, IconPlus, IconGridDots, IconUserScan,
    IconFolders, IconLayoutSidebarLeftExpand, IconLayoutSidebarLeftCollapse,
    IconMessage, IconTerminal2,
  } from '@tabler/icons-svelte-runes';
  import { mainNavItems, bottomNavItems } from '../navigation/mainNavigation.js';

  let {
    onShowCommandPalette = () => {},
    onShowCreateModal = () => {},
    onShowChatPanel = () => {},
    onToggleTerminal = () => {}
  } = $props();

  const isTauri = getIsTauri();

  let workspaceSearchQuery = $state('');

  // Derived workspace dropdown items that automatically updates when store or search changes
  const workspacesDropdownItems = $derived.by(() => {
    const items = [];

    // Add search input at the top
    items.push({
      type: 'search',
      id: 'search',
      testid: 'workspaces-search',
      placeholder: t('nav.searchWorkspaces'),
      value: workspaceSearchQuery,
      onInput: (value) => {
        workspaceSearchQuery = value;
      }
    });

    // Inactive workspaces are hidden here even for admins — Manage
    // Workspaces is the only surface that shows them.
    const activeRegularWorkspaces = $workspacesStore.regularWorkspaces.filter(ws => ws.active);

    // The one canonical "about/overview" workspace of this group (if any)
    // is pinned as its own block right under the search input — not a
    // select item, not subject to search filtering, never grouped under a
    // category label.
    const overviewWorkspace = activeRegularWorkspaces.find(ws => ws.is_overview);
    if (overviewWorkspace) {
      const hasAvatar = overviewWorkspace.avatar_url;
      items.push({
        type: 'pinned-workspace',
        id: `overview-${overviewWorkspace.id}`,
        testid: 'workspace-dropdown-overview',
        icon: hasAvatar ? null : (workspaceIconMap[overviewWorkspace.icon] || workspaceIconMap.Package),
        iconColor: hasAvatar ? null : overviewWorkspace.color,
        avatarUrl: hasAvatar ? overviewWorkspace.avatar_url : null,
        title: overviewWorkspace.name,
        subtitle: overviewWorkspace.description,
        href: `/workspaces/${overviewWorkspace.id}`
      });
    }

    // Filter the rest by search query.
    const search = workspaceSearchQuery?.trim().toLowerCase();
    const groupableWorkspaces = activeRegularWorkspaces.filter(ws => ws !== overviewWorkspace);
    const filteredWorkspaces = !search
      ? groupableWorkspaces
      : groupableWorkspaces.filter(workspace => {
          const nameMatch = workspace.name?.toLowerCase().includes(search);
          const keyMatch = workspace.key?.toLowerCase().includes(search);
          const descriptionMatch = workspace.description?.toLowerCase().includes(search);
          return nameMatch || keyMatch || descriptionMatch;
        });

    // Add workspace items, grouped by sidebar category (apps/packages/features/…)
    // with a colored separator label per group. No cap — categories keep a
    // long list organized instead of silently hiding workspaces past a fixed
    // count.
    if (filteredWorkspaces.length > 0) {
      const visibleWorkspaces = filteredWorkspaces;

      const toItem = (workspace) => {
        const hasAvatar = workspace.avatar_url;
        const workspaceIcon = workspaceIconMap[workspace.icon] || workspaceIconMap.Package;

        return {
          id: workspace.id,
          type: 'regular',
          testid: 'workspace-dropdown-item',
          icon: hasAvatar ? null : workspaceIcon,
          iconColor: hasAvatar ? null : workspace.color,
          avatarUrl: hasAvatar ? workspace.avatar_url : null,
          title: workspace.name,
          subtitle: workspace.description,
          href: `/workspaces/${workspace.id}`
        };
      };

      const categories = $workspaceCategoriesStore.categories;
      const byCategoryId = new Map();
      const uncategorized = [];
      for (const workspace of visibleWorkspaces) {
        if (workspace.category_id == null) {
          uncategorized.push(workspace);
          continue;
        }
        const bucket = byCategoryId.get(workspace.category_id) || [];
        bucket.push(workspace);
        byCategoryId.set(workspace.category_id, bucket);
      }

      let groupsRendered = 0;
      for (const category of categories) {
        const bucket = byCategoryId.get(category.id);
        if (!bucket || bucket.length === 0) continue;
        if (groupsRendered > 0) items.push({ type: 'divider' });
        items.push({ type: 'category-label', text: category.name, color: category.color });
        items.push({ type: 'group', items: bucket.map(toItem) });
        groupsRendered += 1;
      }
      if (uncategorized.length > 0) {
        if (groupsRendered > 0) items.push({ type: 'divider' });
        items.push({ type: 'group', items: uncategorized.map(toItem) });
      }

      items.push({ type: 'divider' });
    } else if (groupableWorkspaces.length > 0 && workspaceSearchQuery) {
      // Show "no results" only if there are workspaces but search didn't match
      items.push(
        { type: 'text', text: t('nav.noWorkspacesMatch') },
        { type: 'divider' }
      );
    } else if (activeRegularWorkspaces.length === 0) {
      items.push(
        { type: 'text', text: t('nav.noWorkspacesFound') },
        { type: 'divider' }
      );
    }

    // Add combined manage workspaces action
    items.push({
      id: 'manage',
      type: 'regular',
      icon: IconSettings,
      title: t('nav.manageWorkspaces'),
      subtitle: t('nav.manageWorkspacesSubtitle'),
      color: 'var(--ds-text-link)',
      class: 'font-medium',
      href: '/workspaces'
    });

    return items;
  });

  // Filter nav items based on permissions (registry: navigation/mainNavigation.js)
  const filteredMainNav = $derived(
    mainNavItems.filter(item => !item.permission || $permissionStore[item.permission])
  );

  const filteredBottomNav = $derived(
    bottomNavItems.filter(item => !item.permission || $permissionStore[item.permission])
  );

  function showCreateDropdown() {
    onShowCreateModal();
  }
</script>

<nav class="main-sidebar {$uiStore.navExpanded ? 'w-[200px]' : 'w-16'} shadow-lg border-r flex flex-col py-4 fixed h-full z-40 themed-nav transition-all duration-200 overflow-x-hidden" style="border-color: var(--ds-border);" aria-label="Main navigation">
  <!-- Brand block: instance name + flanking emoji, configurable per instance
       (Admin Settings → Branding) instead of a fixed logo image. -->
  <Tooltip content={brandingStore.instanceName} placement="right" disabled={$uiStore.navExpanded}>
    <a
      href="/"
      class="flex items-center {$uiStore.navExpanded ? 'px-4' : 'justify-center'} w-full h-10 mb-2 hover:opacity-80 transition-opacity cursor-pointer"
    >
      {#if $uiStore.navExpanded}
        {#if brandingStore.iconBefore}
          <span class="text-xl leading-none flex-shrink-0" aria-hidden="true">{brandingStore.iconBefore}</span>
        {/if}
        <span class="mx-2 font-semibold text-sm whitespace-nowrap">{brandingStore.instanceName}</span>
        {#if brandingStore.iconAfter}
          <span class="text-xl leading-none flex-shrink-0" aria-hidden="true">{brandingStore.iconAfter}</span>
        {/if}
      {:else}
        <span class="text-2xl leading-none flex-shrink-0" aria-hidden="true">{brandingStore.iconBefore || brandingStore.iconAfter || '🧭'}</span>
      {/if}
    </a>
  </Tooltip>

  <!-- Main Navigation -->
  <div class="flex mt-6 flex-col {$uiStore.navExpanded ? 'items-stretch px-2.5' : 'items-center'} space-y-1 flex-1">

    <!-- Workspaces -->
    <Tooltip content={t('nav.workspaces')} placement="right" disabled={$uiStore.navExpanded}>
      <div class="{$uiStore.navExpanded ? 'w-full' : ''}">
        <DropdownMenu
          triggerIcon={IconGridDots}
          triggerIconClass="w-5 h-5"
          triggerGap="gap-3"
          triggerText={$uiStore.navExpanded ? t('nav.workspaces') : ''}
          triggerLabel={t('nav.workspaces')}
          triggerClass="{$uiStore.navExpanded ? 'w-full px-3' : 'w-10'} h-10 rounded flex items-center {$uiStore.navExpanded ? '' : 'justify-center'} cursor-pointer nav-button nav-button-emphasized {isWorkspaceRoute($currentRoute.view) ? 'nav-button-selected' : ''} {!$workspacesStore.loaded ? 'opacity-50 cursor-wait' : ''}"
          triggerTestid="workspaces-dropdown-trigger"
          items={workspacesDropdownItems}
          maxWidth="max-w-xs"
          showChevron={false}
          placement="right-start"
          iconOnly={!$uiStore.navExpanded}
          triggerAlignment={$uiStore.navExpanded ? 'start' : 'center'}
        />
      </div>
    </Tooltip>

    <!-- Main Nav Links -->
    {#each filteredMainNav as item (item.id)}
      <NavLink
        id="nav-{item.id}"
        icon={item.icon}
        label={t(item.labelKey)}
        href={item.href}
        isActive={item.activeViews.includes($currentRoute.view)}
        expanded={$uiStore.navExpanded}
      />
    {/each}

    <!-- Top Actions Section - "Notch" style centered positioning -->
    <div class="flex flex-col items-stretch space-y-2 my-6 py-4">
      <NavLink
        id="global-create-button"
        icon={IconPlus}
        label={t('nav.create')}
        onclick={showCreateDropdown}
        expanded={$uiStore.navExpanded}
        variant="primary"
        tooltipSuffix=" (C)"
      />
      <NavLink
        icon={IconSearch}
        label={t('nav.search')}
        onclick={onShowCommandPalette}
        expanded={$uiStore.navExpanded}
        tooltipSuffix=" ({getShortcutDisplay('global', 'commandPalette')} or Space Space)"
      />
      {#if aiStore.chatAvailable}
        <NavLink
          id="chat-toggle-button"
          icon={IconMessage}
          label="AI Chat"
          onclick={onShowChatPanel}
          expanded={$uiStore.navExpanded}
          tooltipSuffix=" ({getShortcutDisplay('global', 'aiChat')})"
        />
      {/if}
      {#if isTauri}
      <NavLink
        icon={IconTerminal2}
        label="Terminal"
        onclick={onToggleTerminal}
        expanded={$uiStore.navExpanded}
        tooltipSuffix=" (Cmd+`)"
      />
      {/if}
    </div>
  </div>

  <!-- Bottom Section -->
  <div class="flex flex-col {$uiStore.navExpanded ? 'items-stretch px-3' : 'items-center'} space-y-1 mt-auto">
    <!-- Nav Toggle Button -->
    <button
      onclick={() => uiStore.toggleNavExpanded()}
      class="flex items-center {$uiStore.navExpanded ? 'w-full px-3' : 'w-10 justify-center'} h-10 mb-2 rounded cursor-pointer nav-button"
      aria-label={$uiStore.navExpanded ? t('nav.collapse') : t('nav.expand')}
    >
      {#if $uiStore.navExpanded}
        <IconLayoutSidebarLeftCollapse class="w-5 h-5 flex-shrink-0" />
        <span class="ml-3 text-sm whitespace-nowrap">{t('nav.collapse')}</span>
      {:else}
        <IconLayoutSidebarLeftExpand class="w-5 h-5" />
      {/if}
    </button>
    <!-- Bottom Nav Links -->
    {#each filteredBottomNav as item (item.id)}
      <NavLink
        id="nav-{item.id}"
        icon={item.icon}
        label={t(item.labelKey)}
        href={item.href}
        isActive={item.activeViews.includes($currentRoute.view)}
        expanded={$uiStore.navExpanded}
      />
    {/each}

    <!-- Notification Tray -->
    <Tooltip content={t('nav.notifications')} placement="right" disabled={$uiStore.navExpanded}>
      <NotificationTray expanded={$uiStore.navExpanded} label={t('nav.notifications')} />
    </Tooltip>

    <!-- User Profile Avatar -->
    <Tooltip content={t('nav.profile')} placement="right" disabled={$uiStore.navExpanded}>
      <UserAvatar expanded={$uiStore.navExpanded} label={t('nav.profile')} />
    </Tooltip>
  </div>
</nav>

<style>
  @media (max-width: 767px) {
    .main-sidebar {
      width: 4rem;
    }
  }
</style>
