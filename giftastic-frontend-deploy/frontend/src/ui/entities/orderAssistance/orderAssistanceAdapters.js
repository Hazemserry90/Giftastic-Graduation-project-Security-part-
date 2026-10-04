import { adaptEntity, consumeEntitySourceField, setEntityValue } from '../shared/entityModel.js';
import { createOrderAssistanceModel } from './orderAssistanceModel.js';
import { adaptEmbeddedValue, applyEmbeddedResult } from '../shared/embeddedAdapters.js';
import { markEntityFieldInvalid } from '../shared/entityModel.js';

export function adaptOrderAssistance(input = {}, { source = 'order-assistance', complete = false } = {}) {
  if (
    input?.entityType === 'orderAssistance'
    && input?.meta?.loadedFields instanceof Set
  ) {
    return input;
  }
  const fields = ['id', 'orderId', 'supplierId', 'supplierName', 'message', 'status',
    'requestedAt', 'resolvedAt', 'resolvedBy', 'resolution'];
  const model = adaptEntity(input, createOrderAssistanceModel({ source }),
    Object.fromEntries(fields.map((field) => [field, [field]])));
  if (Object.hasOwn(input, 'messages')) {
    consumeEntitySourceField(model, 'messages');
    if (!Array.isArray(input.messages)) markEntityFieldInvalid(model, 'messages', input.messages, 'Expected assistance message array');
    else setEntityValue(model, 'messages', input.messages.map((message, index) => {
      const root = `messages.${index}`;
      return applyEmbeddedResult(model, root, adaptEmbeddedValue('orderAssistanceMessage', message, { path: root }));
    }));
  }
  model.meta.isPartial = !complete;
  return model;
}
