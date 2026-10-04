export const getGiftFlowDisplayName = (flow) => flow?.name || 'Unknown Gift Flow';
export const getGiftFlowId = (flow) => flow?.id || null;
export const getGiftFlowImage = (flow) => flow?.imageUrl || null;
export const formatGiftFlowDate = (value) => formatEntityDateTime(value);
export const summarizeGiftFlow = (flow) => {
  const steps = flow?.parsedConfiguration?.steps || [];
  return {
    steps: steps.length,
    productRefs: flow?.productIds?.length || 0,
    requiredSteps: steps.filter((step) => step.required !== false).length,
    requiredProducts: steps.flatMap((step) => step.products || [])
      .filter((product) => product.required).length,
  };
};
import { formatEntityDateTime } from '../shared/date.js';
