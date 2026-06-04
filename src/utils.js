
export function computeTokensTotal(subscription) {
  const planned = subscription.planned_cleaners_per_day || 0;
  const days = subscription.scheduled_days || subscription.days || (subscription.cleaning_days ? subscription.cleaning_days.length : 0);
  return planned * days;
}

export function computeTokensAvailable(subscription) {
  const total = computeTokensTotal(subscription);
  const usedObj = subscription.tokens_used || {};
  const usedSum = Object.values(usedObj).reduce((s, v) => s + (Number(v) || 0), 0);
  return total - usedSum;
}

export function applyAdminValidation(subscription, dateISO, validatedCount) {
  const tokens_used = { ...(subscription.tokens_used || {}) };
  tokens_used[dateISO] = Number(validatedCount);
  const updated = { ...subscription, tokens_used };
  updated.tokens_available = computeTokensAvailable(updated);
  updated.tokens_total = computeTokensTotal(updated);
  return updated;
}

export function clientUseCleaners(subscription, dateISO, requestedCount) {
  const requests = subscription.client_requests || {};
  requests[dateISO] = Number(requestedCount);
  const updated = { ...subscription, client_requests: requests };
  return updated;
}
