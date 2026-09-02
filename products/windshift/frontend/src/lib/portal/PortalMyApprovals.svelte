<script>
  import { ArrowLeft, Clock, ShieldCheck, Check, MessageSquare, X } from '@lucide/svelte';
  import Spinner from '../components/Spinner.svelte';
  import Badge from '../components/Badge.svelte';
  import Textarea from '../components/Textarea.svelte';
  import Button from '../components/Button.svelte';
  import PageHeader from '../layout/PageHeader.svelte';
  import { portalStore } from '../stores/portal.svelte.js';
  import { portalAuthStore } from '../stores/portalAuth.svelte.js';
  import { authStore } from '../stores';
  import { t } from '../stores/i18n.svelte.js';
  import { formatDateTimeLocale } from '../utils/dateFormatter.js';

  // Resolve "is this customer in the active pool" so we know whether to show
  // the decide controls. Mirrors the internal-side ApprovalsTimeline check.
  function activeStep(req) {
    return req?.step_instances?.find((si) => si.status === 'pending' && si.started_at);
  }

  function isInActivePool(req) {
    const step = activeStep(req);
    if (!step) return false;
    const customerId = $portalAuthStore.customer?.id;
    const userId = $authStore.currentUser?.id || $portalAuthStore.user?.id;
    return !!step.approvers?.some(
      (a) =>
        a.is_active &&
        ((customerId && a.portal_customer_id === customerId) ||
          (userId && a.user_id === userId))
    );
  }

  function statusVariant(status) {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'danger';
      case 'cancelled':
        return 'neutral';
      default:
        return 'neutral';
    }
  }

  function decisionText(d) {
    const actor = actorLabel(d);
    switch (d.decision) {
      case 'approve':
        return t('portal.decisionApproved', { actor });
      case 'reject':
        return t('portal.decisionRejected', { actor });
      case 'comment':
        return t('portal.decisionCommented', { actor });
      case 'cancel':
        return t('portal.decisionCancelled', { actor });
      case 'requested':
        return t('portal.decisionOpened', { actor });
      case 'completed':
        return t('portal.decisionCompleted', { actor });
      case 'reassign':
        return t('portal.decisionReassigned', { actor });
      case 'escalate':
        return t('portal.decisionEscalated', { actor });
      case 'substitute':
        return t('portal.decisionSubstituted', { actor });
      default:
        return `${actor} ${d.decision}`;
    }
  }

  function actorLabel(d) {
    if (d.actor_portal_customer_id) return t('portal.actorCustomer', { id: d.actor_portal_customer_id });
    if (d.actor_user_id) return t('portal.actorUser', { id: d.actor_user_id });
    return t('portal.actorSystem');
  }
</script>

<div class="space-y-6" data-testid="portal-my-approvals">
  {#if portalStore.selectedApproval}
    {@const req = portalStore.selectedApproval}
    {@const inPool = isInActivePool(req)}
    {@const myStep = activeStep(req)}
    {@const itemCtx = portalStore.selectedApprovalRequest}

    <!-- Approval Detail View -->
    <div class="space-y-4">
      <button
        type="button"
        onclick={() => portalStore.closeApprovalDetail()}
        class="inline-flex items-center gap-2 text-sm font-medium mb-2 hover:underline"
        style="color: var(--ds-text-link);"
        id="portal-approval-close"
      >
        <ArrowLeft class="w-4 h-4" />
        {t('portal.backToApprovals')}
      </button>

      <div class="pb-6 border-b" style="border-color: var(--ds-border);">
        <div class="flex items-start justify-between">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-sm font-mono" style="color: var(--ds-text-subtle);">
                {t('portal.approvalNumber', { id: req.id })}
              </span>
              <Badge size="sm" variant={statusVariant(req.status)}>
                {req.status}
              </Badge>
            </div>
            <div class="text-sm" style="color: var(--ds-text-subtle);">
              {t('portal.openedAt', { date: formatDateTimeLocale(req.created_at) })}
              {#if req.completed_at} · {t('portal.closedAt', { date: formatDateTimeLocale(req.completed_at) })}{/if}
            </div>
          </div>
        </div>
      </div>

      {#if itemCtx}
        <!-- Request context: title, description, current status. Approver-derived
             access — backend gates this on active-pool membership. -->
        <div
          class="p-6 rounded"
          style="background-color: var(--ds-surface-card); border: 1px solid var(--ds-border);"
          data-testid="portal-approval-item-context"
        >
          <div class="flex items-center gap-2 mb-2">
            <span class="text-xs font-mono" style="color: var(--ds-text-subtle);">
              {itemCtx.workspace_key}-{itemCtx.workspace_item_number}
            </span>
            <Badge size="xs" variant={statusVariant(itemCtx.status)}>{itemCtx.status}</Badge>
          </div>
          <h3 class="text-lg font-semibold mb-2" style="color: var(--ds-text);">{itemCtx.title}</h3>
          {#if itemCtx.description}
            <div class="text-sm whitespace-pre-wrap" style="color: var(--ds-text-subtle);">
              {itemCtx.description}
            </div>
          {/if}
        </div>
      {/if}

      <!-- Step list -->
      <div class="p-6 rounded" style="background-color: var(--ds-surface-card); border: 1px solid var(--ds-border);">
        <h4 class="text-lg font-semibold mb-4" style="color: var(--ds-text);">{t('portal.steps')}</h4>
        <div class="space-y-2">
          {#each req.step_instances ?? [] as si (si.id)}
            <div class="flex items-start gap-3 p-3 rounded" style="background-color: var(--ds-surface-raised);">
              <div class="text-xs font-mono w-6 text-center pt-1" style="color: var(--ds-text-subtle);">
                {si.display_order + 1}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-sm font-medium" style="color: var(--ds-text);">
                    {t('portal.stepNumber', { number: si.display_order + 1 })}
                  </span>
                  <Badge size="xs" variant={statusVariant(si.status)}>{si.status}</Badge>
                </div>
                {#if si.escalation_due_at && si.status === 'pending'}
                  <div class="text-xs mt-1 flex items-center gap-1" style="color: var(--ds-text-subtle);">
                    <Clock class="w-3 h-3" />
                    {t('portal.escalatesAt', { date: formatDateTimeLocale(si.escalation_due_at) })}
                  </div>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </div>

      <!-- Decision controls (only for active pool members on a pending step) -->
      {#if req.status === 'pending' && inPool && myStep}
        <div
          class="p-6 rounded space-y-3"
          style="background-color: var(--ds-surface-card); border: 1px solid var(--ds-border);"
          data-testid="portal-approval-decide"
        >
          <div class="flex items-center gap-2">
            <ShieldCheck class="w-5 h-5" style="color: var(--ds-text);" />
            <span class="text-base font-semibold" style="color: var(--ds-text);">
              {t('portal.decisionRequired')}
            </span>
          </div>
          <Textarea
            value={portalStore.approvalComment}
            oninput={(e) => (portalStore.approvalComment = e.target.value)}
            placeholder={t('portal.optionalCommentPlaceholder')}
            rows={3}
            data-testid="portal-approval-comment"
          />
          <div class="flex flex-wrap gap-2">
            <Button
              variant="primary"
              icon={Check}
              disabled={portalStore.decidingApproval}
              loading={portalStore.decidingApproval}
              onclick={() => portalStore.decideApproval('approve')}
              dataTestid="portal-approval-approve"
            >
              {t('portal.approve')}
            </Button>
            <Button
              variant="danger"
              icon={X}
              disabled={portalStore.decidingApproval}
              onclick={() => portalStore.decideApproval('reject')}
              dataTestid="portal-approval-reject"
            >
              {t('portal.reject')}
            </Button>
            <Button
              variant="default"
              icon={MessageSquare}
              disabled={portalStore.decidingApproval || portalStore.approvalComment.trim() === ''}
              onclick={() => portalStore.decideApproval('comment')}
              dataTestid="portal-approval-comment-submit"
            >
              {t('portal.commentAction')}
            </Button>
          </div>
        </div>
      {/if}

      <!-- Audit log -->
      {#if req.decisions?.length > 0}
        <div
          class="p-6 rounded"
          style="background-color: var(--ds-surface-card); border: 1px solid var(--ds-border);"
          data-testid="portal-approval-audit"
        >
          <h4 class="text-sm font-semibold mb-3" style="color: var(--ds-text-subtle);">{t('portal.auditLog')}</h4>
          <ul class="space-y-2 text-sm">
            {#each req.decisions as d (d.id)}
              <li style="color: var(--ds-text-subtle);">
                <span style="color: var(--ds-text);">{decisionText(d)}</span>
                <span class="opacity-70"> · {formatDateTimeLocale(d.created_at)}</span>
                {#if d.comment}
                  <div class="ml-4 mt-1 italic" style="color: var(--ds-text);">"{d.comment}"</div>
                {/if}
              </li>
            {/each}
          </ul>
        </div>
      {/if}
    </div>
  {:else}
    <!-- Inbox List -->
    <PageHeader
      title={t('portal.myApprovalsTitle')}
      subtitle={t('portal.myApprovalsSubtitle')}
    />
    {#if portalStore.loadingApprovals}
      <div class="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    {:else if portalStore.myApprovals.length === 0}
      <div class="max-w-xl py-8 border-t" style="border-color: var(--ds-border);">
        <div class="flex items-start gap-3">
          <ShieldCheck class="w-5 h-5 mt-0.5" style="color: var(--ds-text-subtle);" />
          <div>
            <h2 class="text-base font-medium" style="color: var(--ds-text);">{t('portal.nothingToApprove')}</h2>
            <p class="text-sm mt-1" style="color: var(--ds-text-subtle);">
              {t('portal.nothingToApproveSubtitle')}
            </p>
          </div>
        </div>
      </div>
    {:else}
      <div class="border rounded-md overflow-hidden" style="border-color: var(--ds-border); background-color: var(--ds-surface-card);" data-testid="portal-approvals-list">
        {#each portalStore.myApprovals as approval (approval.id)}
          <button
            onclick={() => portalStore.viewApproval(approval)}
            class="w-full p-4 border-b last:border-b-0 text-left transition-colors hover:bg-black/[0.025]"
            style="border-color: var(--ds-border);"
            data-testid="portal-approval-row"
            id={`portal-approval-row-${approval.id}`}
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-sm font-medium" style="color: var(--ds-text);">
                    {t('portal.approvalNumber', { id: approval.id })}
                  </span>
                  <Badge size="sm" variant={statusVariant(approval.status)}>
                    {approval.status}
                  </Badge>
                </div>
                <div class="text-xs" style="color: var(--ds-text-subtle);">
                  {t('portal.itemNumber', { id: approval.item_id })} · {t('portal.openedAt', { date: formatDateTimeLocale(approval.created_at) })}
                </div>
              </div>
            </div>
          </button>
        {/each}
      </div>
    {/if}
  {/if}
</div>
