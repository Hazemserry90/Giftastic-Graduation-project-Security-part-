import { EMBEDDED_SCHEMAS } from './domainRegistry.js';
import { normalizeDate, normalizeDecimal, normalizeUrl, safeParseJson } from './entityModel.js';
import { BACKEND_ENUM_CONTRACTS } from './backendContract.js';

const own = (value, key) => Object.prototype.hasOwnProperty.call(value || {}, key);
const enumValues = {
  productDetails: { gender: BACKEND_ENUM_CONTRACTS.targetGender[1] },
  orderAssistanceMessage: { senderRole: BACKEND_ENUM_CONTRACTS.assistanceSender[1] },
};

function normalize(type, value) {
  if (value === null || value === undefined || value === '') return { ok: true, value: value ?? null };
  if (type === 'id') return ['string', 'number'].includes(typeof value)
    ? { ok: true, value: String(value) } : { ok: false, value: null, reason: 'Expected identifier' };
  if (type === 'boolean') return typeof value === 'boolean'
    ? { ok: true, value } : { ok: false, value: null, reason: 'Expected boolean' };
  if (type === 'integer') return Number.isSafeInteger(value)
    ? { ok: true, value } : { ok: false, value: null, reason: 'Expected safe integer' };
  if (type === 'decimal') return normalizeDecimal(value);
  if (type === 'date') return normalizeDate(value, true);
  if (type === 'datetime') return normalizeDate(value);
  if (type === 'url') return normalizeUrl(value);
  if (type === 'array') return Array.isArray(value)
    ? { ok: true, value } : { ok: false, value: null, reason: 'Expected array' };
  if (type === 'string' || type === 'json-string') return typeof value === 'string'
    ? { ok: true, value } : { ok: false, value: null, reason: 'Expected string' };
  return { ok: true, value };
}

export function adaptEmbeddedValue(name, input = {}, { aliases = {}, path = name } = {}) {
  const definition = EMBEDDED_SCHEMAS[name];
  if (!definition) throw new TypeError(`Unknown embedded schema: ${name}`);
  const value = {};
  const issues = [];
  const loadedFields = new Set();
  const consumed = new Set();
  for (const [field, fieldDefinition] of Object.entries(definition.fields)) {
    const sourceNames = aliases[field] || [field];
    const source = sourceNames.find((candidate) => own(input, candidate));
    if (!source) continue;
    consumed.add(source);
    loadedFields.add(field);
    const result = normalize(fieldDefinition.type, input[source]);
    const allowedEnum = enumValues[name]?.[field];
    if (result.ok && allowedEnum && result.value != null && !allowedEnum.includes(result.value)) {
      value[field] = null;
      issues.push({ path: `${path}.${field}`, reason: `Unknown ${field} enum value`, severity: 'error' });
    } else if (result.ok) value[field] = result.value;
    else {
      value[field] = null;
      issues.push({ path: `${path}.${field}`, reason: result.reason, severity: 'error' });
    }
  }
  return {
    value,
    loadedFields,
    issues,
    unknownFields: Object.keys(input || {}).filter((field) => !consumed.has(field)),
  };
}

export function adaptStructuredMetadata(raw, path) {
  const parsed = safeParseJson(raw);
  return parsed.ok
    ? { value: parsed.value, issues: [] }
    : { value: null, issues: [{ path, reason: parsed.reason, severity: 'error' }] };
}

export function applyEmbeddedResult(model, rootPath, result) {
  for (const field of result.loadedFields) model.meta.loadedFields.add(`${rootPath}.${field}`);
  for (const issue of result.issues) {
    model.meta.invalidFields.add(issue.path);
    model.meta.issues.push({ source: model.meta.source, ...issue });
  }
  for (const unknown of result.unknownFields) model.meta.unknownFields.push(`${rootPath}.${unknown}`);
  return result.value;
}
