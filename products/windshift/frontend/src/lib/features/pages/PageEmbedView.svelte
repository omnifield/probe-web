<script>
  import { onMount } from 'svelte';
  import { api } from '../../api.js';
  import { navigate } from '../../router.js';
  import { t } from '../../stores/i18n.svelte.js';
  import LazyMilkdownEditor from '../../editors/LazyMilkdownEditor.svelte';
  import { workspacesStore } from '../../stores/workspaces.svelte.js';
  import { workspaceUrlSegment } from '../../utils/workspaceRouteParam.js';

  /** Standalone chrome-free view of a whole knowledge-base section — the
   * page tree AND the selected page's content, no workspace header, no
   * sidebar, no app nav. Meant to be loaded directly (e.g. inside another
   * product's <iframe>): the URL's pageId only picks what opens first,
   * browsing between sibling pages stays inside the embed. */
  let { workspaceId, pageId } = $props();

  let tree = $state([]);
  let treeLoading = $state(true);
  let treeError = $state('');

  let selectedId = $state(null);
  let page = $state(null);
  let pageLoading = $state(true);
  let pageError = $state('');

  let workspaceUrlKey = $derived(
    workspaceUrlSegment(workspaceId, $workspacesStore.allWorkspaces)
  );

  onMount(async () => {
    // Not routed through the normal app shell, so nothing else primes this.
    void workspacesStore.load();

    try {
      const resp = await api.pages.getTree(workspaceId);
      tree = resp.tree || [];
    } catch (err) {
      treeError = err?.message || t('pages.errorLoadTree');
    } finally {
      treeLoading = false;
    }

    if (pageId) {
      await loadPage(pageId);
    } else {
      pageLoading = false;
    }
  });

  async function loadPage(idOrSlug) {
    pageLoading = true;
    pageError = '';
    try {
      page = await api.pages.getPage(workspaceId, idOrSlug);
      selectedId = page.id;
      // Keep the iframe's own URL in sync (reload-safe), staying in embed
      // mode — replace, not push, so browsing doesn't pile up history.
      navigate(`/workspaces/${workspaceUrlKey}/pages/${page.slug || page.id}/embed`, {
        replace: true,
      });
    } catch (err) {
      pageError = err?.message || t('pages.errorLoadPage');
      page = null;
    } finally {
      pageLoading = false;
    }
  }

  function selectPage(node) {
    if (selectedId === node.id) return;
    loadPage(node.slug || node.id);
  }
</script>

{#snippet nodeList(nodes)}
  <ul>
    {#each nodes as node (node.id)}
      <li>
        <button
          type="button"
          class="embed-tree-item"
          class:active={selectedId === node.id}
          onclick={() => selectPage(node)}
        >
          {node.title}
        </button>
        {#if node.children?.length}
          {@render nodeList(node.children)}
        {/if}
      </li>
    {/each}
  </ul>
{/snippet}

<div class="embed-layout">
  <aside class="embed-tree">
    {#if treeLoading}
      <p class="embed-tree-status">{t('pages.treeLoading')}</p>
    {:else if treeError}
      <p class="embed-tree-status embed-error">{treeError}</p>
    {:else}
      <nav aria-label={t('pages.treeHeading')}>
        {@render nodeList(tree)}
      </nav>
    {/if}
  </aside>

  <main class="embed-content">
    {#if pageError}
      <p class="embed-error" role="alert">{pageError}</p>
    {:else if pageLoading}
      <p class="embed-loading">{t('pages.pageLoading')}</p>
    {:else if page}
      <h1 class="embed-title">{page.title}</h1>

      {#if (page.labels || []).length > 0}
        <div class="embed-labels">
          {#each page.labels as label (label.id)}
            <span
              class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs"
              style="background-color: {label.color || '#3B82F6'}1A; color: var(--ds-text); border: 1px solid {label.color || '#3B82F6'};"
            >
              <span
                class="inline-block w-2 h-2 rounded-full"
                style="background-color: {label.color || '#3B82F6'};"
                aria-hidden="true"
              ></span>
              {label.name}
            </span>
          {/each}
        </div>
      {/if}

      <div class="embed-body" data-testid="page-embed-body">
        <LazyMilkdownEditor
          content={page.content}
          readonly={true}
          showToolbar={false}
          entityType="page"
          entityId={page.id}
          enableDiagrams={true}
          {workspaceId}
        />
      </div>
    {:else}
      <p class="embed-loading">{t('pages.emptyPaneDescription')}</p>
    {/if}
  </main>
</div>

<style>
  .embed-layout {
    display: flex;
    min-height: 100vh;
    background: var(--ds-surface);
    color: var(--ds-text);
  }

  .embed-tree {
    width: fit-content;
    min-width: 180px;
    max-width: 320px;
    flex-shrink: 0;
    padding: 1rem 0.5rem;
    border-right: 1px solid var(--ds-border);
    overflow-y: auto;
  }

  .embed-tree-status {
    padding: 0 0.5rem;
    color: var(--ds-text-subtle);
  }

  .embed-tree ul {
    list-style: none;
    margin: 0;
    padding-left: 0.75rem;
  }

  .embed-tree > nav > ul {
    padding-left: 0;
  }

  .embed-tree-item {
    display: block;
    width: 100%;
    text-align: left;
    padding: 0.3rem 0.5rem;
    margin: 0.0625rem 0;
    border: none;
    border-radius: 0.25rem;
    background: transparent;
    color: var(--ds-text);
    font-size: 0.875rem;
    white-space: nowrap;
    cursor: pointer;
  }

  .embed-tree-item:hover {
    background: var(--ds-background-neutral-hovered);
  }

  .embed-tree-item.active {
    background: var(--ds-surface-selected);
  }

  .embed-content {
    flex: 1;
    min-width: 0;
    max-width: 60rem;
    padding: 1.5rem;
    overflow-y: auto;
  }

  .embed-title {
    font-size: 1.75rem;
    font-weight: 700;
    line-height: 1.2;
    margin: 0 0 0.5rem;
  }

  .embed-labels {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
    margin-bottom: 1rem;
  }

  .embed-error {
    color: var(--ds-text-danger);
  }

  .embed-loading {
    color: var(--ds-text-subtle);
  }

  /* Strip the embedded MilkdownEditor's card (border, tinted bg, min-height,
     radius) so the body reads as plain content, not a nested editor widget. */
  :global(.embed-body .milkdown-wrapper),
  :global(.embed-body .milkdown-editor),
  :global(.embed-body .milkdown-editor .milkdown),
  :global(.embed-body .milkdown-editor .ProseMirror) {
    min-height: 0 !important;
    border: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    background: transparent !important;
    padding-left: 0 !important;
    padding-right: 0 !important;
  }
</style>
