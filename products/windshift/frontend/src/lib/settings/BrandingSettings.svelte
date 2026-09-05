<script>
  import { onMount } from 'svelte';
  import { api } from '../api.js';
  import { Tag } from '@lucide/svelte';
  import Button from '../components/Button.svelte';
  import Input from '../components/Input.svelte';
  import Label from '../components/Label.svelte';
  import Spinner from '../components/Spinner.svelte';
  import PageHeader from '../layout/PageHeader.svelte';
  import DescriptionText from '../components/DescriptionText.svelte';
  import { t } from '../stores/i18n.svelte.js';
  import { successToast, errorToast } from '../stores/toasts.svelte.js';
  import { brandingStore } from '../stores/branding.svelte.js';

  let loading = $state(true);
  let saving = $state(false);

  let instanceName = $state('Windshift');
  let iconBefore = $state('');
  let iconAfter = $state('');

  onMount(async () => {
    try {
      const settings = await api.brandingSettings.get();
      instanceName = settings.instance_name || 'Windshift';
      iconBefore = settings.icon_before || '';
      iconAfter = settings.icon_after || '';
    } catch (error) {
      errorToast(t('settings.branding.failedToLoad', { error: error.message || error }));
    } finally {
      loading = false;
    }
  });

  async function save() {
    saving = true;
    try {
      await api.brandingSettings.update({
        instance_name: instanceName,
        icon_before: iconBefore,
        icon_after: iconAfter
      });
      brandingStore.patch({ instanceName, iconBefore, iconAfter });
      successToast(t('settings.branding.savedSuccess'));
    } catch (error) {
      errorToast(t('settings.branding.failedToSave', { error: error.message || error }));
    } finally {
      saving = false;
    }
  }
</script>

<PageHeader icon={Tag} title={t('settings.branding.title')} subtitle={t('settings.branding.subtitle')} />

{#if loading}
  <div class="flex items-center justify-center py-12">
    <Spinner />
  </div>
{:else}
  <div class="rounded border p-6 max-w-lg" style="background-color: var(--ds-surface-raised); border-color: var(--ds-border);">
    <div class="mb-4">
      <Label class="mb-2">{t('settings.branding.instanceName')}</Label>
      <Input bind:value={instanceName} placeholder="Windshift" />
    </div>

    <div class="grid grid-cols-2 gap-4 mb-4">
      <div>
        <Label class="mb-2">{t('settings.branding.iconBefore')}</Label>
        <Input bind:value={iconBefore} placeholder="🧭" maxlength={8} />
      </div>
      <div>
        <Label class="mb-2">{t('settings.branding.iconAfter')}</Label>
        <Input bind:value={iconAfter} placeholder="🧱" maxlength={8} />
      </div>
    </div>

    <DescriptionText class="mb-4">{t('settings.branding.description')}</DescriptionText>

    <!-- Live preview, same layout as the sidebar's expanded brand block -->
    <div class="flex items-center px-4 h-10 rounded mb-4" style="background-color: var(--ds-surface);">
      {#if iconBefore}<span class="text-xl leading-none">{iconBefore}</span>{/if}
      <span class="mx-2 font-semibold text-sm">{instanceName || 'Windshift'}</span>
      {#if iconAfter}<span class="text-xl leading-none">{iconAfter}</span>{/if}
    </div>

    <Button variant="primary" onclick={save} loading={saving}>{t('common.save')}</Button>
  </div>
{/if}
