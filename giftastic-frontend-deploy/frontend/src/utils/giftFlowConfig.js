const MAX_FLOW_STEPS = 5;

function resolveMaxSteps(maxSteps = MAX_FLOW_STEPS) {
  const value = Number(maxSteps);
  return Number.isSafeInteger(value) && value > 0 ? value : MAX_FLOW_STEPS;
}

function toWholeNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.floor(number) : fallback;
}

const TEMPLATE_THREE_STEP_BOX = {
  version: 1,
  maxSteps: MAX_FLOW_STEPS,
  steps: [
    {
      id: 'step-1',
      title: 'Choose Base Gift',
      description: 'Pick the main gift item.',
      type: 'single',
      required: true,
      minSelections: 1,
      maxSelections: 1,
      products: []
    },
    {
      id: 'step-2',
      title: 'Add Extras',
      description: 'Choose supporting products for the box.',
      type: 'multiple',
      required: true,
      minSelections: 1,
      maxSelections: 3,
      products: []
    }
  ]
};

function sanitizeStep(rawStep, index) {
  const id = rawStep?.id || `step-${index + 1}`;
  let type = 'single';

  let mappedProducts = [];
  if (Array.isArray(rawStep?.products)) {
    mappedProducts = rawStep.products
      .filter(p => p && (p.productId || typeof p === 'string'))
      .map(p => {
        if (typeof p === 'string') {
          return { productId: p, required: false, min: 0, max: 1 };
        }
        return {
          productId: p.productId,
          required: p.required === true,
          min: Math.max(0, toWholeNumber(p.min, 0)),
          max: Math.max(1, toWholeNumber(p.max, 1))
        };
      });
  } else if (Array.isArray(rawStep?.productIds)) {
    // Backwards compatibility
    mappedProducts = rawStep.productIds
      .filter(Boolean)
      .map(pid => ({ productId: pid, required: false, min: 0, max: 1 }));
  }
  
  // Deduplicate by productId, keeping first occurrence
  const seen = new Set();
  mappedProducts = mappedProducts.filter(p => {
    if (seen.has(p.productId)) return false;
    seen.add(p.productId);
    return true;
  });

  // Automatically infer single vs multiple based on product count
  type = mappedProducts.length > 1 ? 'multiple' : 'single';
  mappedProducts = mappedProducts.map((product) => {
    const min = product.required ? Math.max(1, product.min) : Math.max(0, product.min);
    return {
      ...product,
      min,
      max: Math.max(min || 1, product.max)
    };
  });
  const totalConfiguredMax = mappedProducts.reduce((total, product) => total + product.max, 0);
  const configuredMaxSelections = Math.max(1, toWholeNumber(rawStep?.maxSelections, totalConfiguredMax || 1));

  return {
    id,
    title: typeof rawStep?.title === 'string' ? rawStep.title : `Step ${index + 1}`,
    description: typeof rawStep?.description === 'string' ? rawStep.description : '',
    type,
    required: rawStep?.required !== false,
    minSelections: Math.max(0, toWholeNumber(rawStep?.minSelections, rawStep?.required === false ? 0 : 1)),
    maxSelections: Math.max(configuredMaxSelections, totalConfiguredMax || 1),
    products: mappedProducts,
    metadataKey: null,
    placeholder: null
  };
}

export function buildDefaultFlowConfig(maxSteps = MAX_FLOW_STEPS) {
  return {
    ...JSON.parse(JSON.stringify(TEMPLATE_THREE_STEP_BOX)),
    maxSteps: resolveMaxSteps(maxSteps)
  };
}

export function normalizeFlowConfig(parsedConfig, maxSteps = MAX_FLOW_STEPS) {
  const resolvedMaxSteps = resolveMaxSteps(maxSteps);
  const source = parsedConfig && typeof parsedConfig === 'object' ? parsedConfig : {};
  const rawSteps = Array.isArray(source.steps) ? source.steps : [];
  const steps = rawSteps.slice(0, resolvedMaxSteps).map((step, index) => sanitizeStep(step, index));

  return {
    version: Number(source.version || 1),
    maxSteps: resolvedMaxSteps,
    steps
  };
}

export function parseFlowConfiguration(configuration) {
  try {
    if (!configuration) {
      return normalizeFlowConfig(buildDefaultFlowConfig());
    }

    const parsed = typeof configuration === 'string' ? JSON.parse(configuration) : configuration;
    return normalizeFlowConfig(parsed);
  } catch {
    return normalizeFlowConfig(buildDefaultFlowConfig());
  }
}

export function serializeFlowConfiguration(config, maxSteps = MAX_FLOW_STEPS) {
  const normalized = normalizeFlowConfig(config, maxSteps);
  return JSON.stringify(normalized);
}

export function validateFlowConfig(config, maxSteps = MAX_FLOW_STEPS) {
  const resolvedMaxSteps = resolveMaxSteps(maxSteps);
  const normalized = normalizeFlowConfig(config, resolvedMaxSteps);

  if (normalized.steps.length === 0) {
    return 'At least one step is required.';
  }

  if (normalized.steps.length > resolvedMaxSteps) {
    return `A flow can have at most ${resolvedMaxSteps} steps.`;
  }

  if (!normalized.steps.some((step) => step.required)) {
    return 'At least one step must be required for the entire customization.';
  }

  for (let index = 0; index < normalized.steps.length; index += 1) {
    const step = normalized.steps[index];

    if (!step.title.trim()) {
      return `Step ${index + 1} title is required.`;
    }

    if (!step.products || step.products.length === 0) {
      return `Step ${index + 1} must include at least one product.`;
    }

    if (step.required && !step.products.some((product) => product.required && product.min > 0)) {
      return `Step ${index + 1} is required, so at least one product in it must be marked required.`;
    }

    if (step.products) {
      for (const p of step.products) {
        if (p.min > p.max) {
          return `Step ${index + 1} has a product where min exceeds max.`;
        }
      }
    }
  }

  return null;
}

export { MAX_FLOW_STEPS };
