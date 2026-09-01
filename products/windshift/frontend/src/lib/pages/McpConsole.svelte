<script>
  // Live catalog + playground for the product's own MCP server (`/mcp`).
  // Talks the real MCP protocol via ../mcp/mcpClient.js instead of a shadow
  // REST copy of the tool registry — this tests exactly what an external
  // MCP client (Claude Code, etc.) sees. Mints its own short-lived API
  // token on mount (POST /api-tokens, same endpoint /security uses) and
  // revokes it on unmount so repeated visits don't pile up tokens.
  import { onMount, onDestroy } from 'svelte';
  import { Plug, Play, AlertTriangle } from '@lucide/svelte';
  import { api } from '../api.js';
  import { listTools, callTool } from '../mcp/mcpClient.js';
  import { t } from '../stores/i18n.svelte.js';
  import PageHeader from '../layout/PageHeader.svelte';
  import Input from '../components/Input.svelte';
  import Textarea from '../components/Textarea.svelte';
  import Button from '../components/Button.svelte';
  import Badge from '../components/Badge.svelte';
  import AlertBox from '../components/AlertBox.svelte';
  import Spinner from '../components/Spinner.svelte';
  import EmptyState from '../components/EmptyState.svelte';
  import ApiSchema from '../features/api-docs/ApiSchema.svelte';

  let token = $state(null);
  let tokenId = $state(null);
  let tokenError = $state('');
  let tools = $state([]);
  let toolsError = $state('');
  let loading = $state(true);
  let search = $state('');
  let selectedName = $state(null);
  let argsText = $state('');
  let running = $state(false);
  /** @type {{isError: boolean, parsed: any} | null} */
  let result = $state(null);
  let runError = $state('');

  const filteredTools = $derived(
    search.trim()
      ? tools.filter((tool) =>
          `${tool.name} ${tool.description}`.toLowerCase().includes(search.trim().toLowerCase())
        )
      : tools
  );

  const selectedTool = $derived(tools.find((tool) => tool.name === selectedName) ?? null);
  const requiredScopes = $derived(selectedTool?._meta?.required_scopes ?? []);
  const isDestructive = $derived(selectedTool?.annotations?.destructiveHint === true);

  function defaultForType(prop) {
    switch (prop?.type) {
      case 'integer':
      case 'number':
        return 0;
      case 'boolean':
        return false;
      case 'array':
        return [];
      case 'object':
        return {};
      default:
        return '';
    }
  }

  // Prefills the args box with just the required fields so the shape is
  // obvious without forcing a full JSON-Schema-to-form generator for every
  // tool's schema — the schema viewer above the box covers the rest.
  function skeletonFor(schema) {
    if (!schema?.properties) return {};
    const required = new Set(schema.required ?? []);
    const skeleton = {};
    for (const [key, prop] of Object.entries(schema.properties)) {
      if (required.has(key)) skeleton[key] = defaultForType(prop);
    }
    return skeleton;
  }

  function selectTool(tool) {
    selectedName = tool.name;
    result = null;
    runError = '';
    argsText = JSON.stringify(skeletonFor(tool.inputSchema), null, 2);
  }

  onMount(async () => {
    try {
      const resp = await api.createApiToken({ name: 'MCP Console' });
      token = resp.token;
      tokenId = resp.api_token?.id ?? null;
    } catch (err) {
      tokenError = err?.data?.error || err?.message || t('mcpConsole.tokenError');
      loading = false;
      return;
    }
    try {
      const list = await listTools(token);
      tools = [...list].sort((a, b) => a.name.localeCompare(b.name));
    } catch (err) {
      toolsError = err?.message || t('mcpConsole.loadError');
    } finally {
      loading = false;
    }
  });

  onDestroy(() => {
    if (tokenId) api.revokeApiToken(tokenId).catch(() => {});
  });

  async function execute() {
    if (!selectedTool || running) return;
    let args;
    try {
      args = argsText.trim() ? JSON.parse(argsText) : {};
    } catch {
      runError = t('mcpConsole.invalidJson');
      return;
    }
    running = true;
    runError = '';
    result = null;
    try {
      result = await callTool(token, selectedTool.name, args);
    } catch (err) {
      runError = err?.message || t('mcpConsole.loadError');
    } finally {
      running = false;
    }
  }
</script>

<div style="background-color: var(--ds-surface);">
  <div class="px-6 pt-6">
    <PageHeader icon={Plug} title={t('mcpConsole.title')} subtitle={t('mcpConsole.subtitle')} />
  </div>

  {#if loading}
    <div class="flex items-center justify-center py-16">
      <Spinner />
    </div>
  {:else if tokenError}
    <div class="px-6">
      <AlertBox variant="error" message={tokenError} />
    </div>
  {:else}
    <div class="flex gap-4 px-6 pb-6 items-start">
      <div
        class="w-72 shrink-0 flex flex-col rounded-md border"
        style="border-color: var(--ds-border); background-color: var(--ds-surface-raised);"
      >
        <div class="p-2 border-b" style="border-color: var(--ds-border);">
          <Input placeholder={t('mcpConsole.searchPlaceholder')} bind:value={search} />
        </div>
        <div class="max-h-[75vh] overflow-y-auto">
          {#if toolsError}
            <div class="p-3">
              <AlertBox variant="error" message={toolsError} size="sm" />
            </div>
          {:else}
            {#each filteredTools as tool (tool.name)}
              <button
                type="button"
                class="w-full text-left px-3 py-2 border-b transition-colors"
                style="border-color: var(--ds-border); background-color: {selectedName === tool.name ? 'var(--ds-surface-hover)' : 'transparent'};"
                onclick={() => selectTool(tool)}
              >
                <div class="text-sm font-mono font-medium" style="color: var(--ds-text);">
                  {tool.name}
                </div>
                <div class="text-xs truncate" style="color: var(--ds-text-subtle);">
                  {tool.description}
                </div>
              </button>
            {/each}
          {/if}
        </div>
      </div>

      <div class="flex-1 min-w-0">
        {#if !selectedTool}
          <EmptyState title={t('mcpConsole.selectPrompt')} />
        {:else}
          <div class="max-w-3xl space-y-4">
            <div>
              <h2 class="text-base font-mono font-semibold" style="color: var(--ds-text);">
                {selectedTool.name}
              </h2>
              <p class="text-sm mt-1" style="color: var(--ds-text-subtle);">
                {selectedTool.description}
              </p>
              {#if requiredScopes.length}
                <div class="flex flex-wrap gap-1.5 mt-2">
                  {#each requiredScopes as scope (scope)}
                    <Badge variant="neutral" size="xs">{scope}</Badge>
                  {/each}
                </div>
              {/if}
            </div>

            <div>
              <h3 class="text-xs uppercase tracking-wide mb-1" style="color: var(--ds-text-subtle);">
                {t('mcpConsole.schemaHeading')}
              </h3>
              <div class="rounded-md border p-2" style="border-color: var(--ds-border);">
                <ApiSchema spec={null} schema={selectedTool.inputSchema} defaultOpen={true} />
              </div>
            </div>

            <div>
              <h3 class="text-xs uppercase tracking-wide mb-1" style="color: var(--ds-text-subtle);">
                {t('mcpConsole.argsHeading')}
              </h3>
              <Textarea bind:value={argsText} rows={8} class="font-mono text-sm" />
            </div>

            {#if isDestructive}
              <AlertBox variant="warning" showIcon={true}>
                {t('mcpConsole.destructiveWarning')}
              </AlertBox>
            {/if}

            <Button variant="default" icon={Play} onclick={execute} loading={running} disabled={running}>
              {running ? t('mcpConsole.executing') : t('mcpConsole.execute')}
            </Button>

            {#if runError}
              <AlertBox variant="error" message={runError} />
            {:else if result}
              <div>
                <h3 class="text-xs uppercase tracking-wide mb-1 flex items-center gap-1.5" style="color: var(--ds-text-subtle);">
                  {#if result.isError}<AlertTriangle size={12} />{/if}
                  {result.isError ? t('mcpConsole.errorHeading') : t('mcpConsole.resultHeading')}
                </h3>
                <pre
                  class="rounded-md border p-3 text-xs overflow-x-auto"
                  style="border-color: var(--ds-border); background-color: var(--ds-surface-raised); color: var(--ds-text);"
                >{typeof result.parsed === 'string' ? result.parsed : JSON.stringify(result.parsed, null, 2)}</pre>
              </div>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>
