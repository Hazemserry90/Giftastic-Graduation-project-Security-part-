const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function parseGiftFlowRouteId(value) {
  if (typeof value !== 'string') return null;

  try {
    const id = decodeURIComponent(value).trim();
    return UUID_PATTERN.test(id) ? id : null;
  } catch {
    return null;
  }
}

export function getGiftFlowExecutionSteps(config) {
  return Array.isArray(config?.steps)
    ? config.steps.filter((step) => step && typeof step === 'object')
    : [];
}
