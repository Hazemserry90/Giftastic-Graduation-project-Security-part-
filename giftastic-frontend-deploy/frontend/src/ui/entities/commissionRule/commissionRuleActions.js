import { hasEntityIdentity, hasLoadedEntityField } from '../shared/entityModel.js';

export function buildCommissionRuleActions({ rule, access, handlers = {} }) {
  if (
    !access.canManage
    || !hasEntityIdentity(rule)
    || !hasLoadedEntityField(rule, 'active')
    || rule.active !== true
    || typeof handlers.deactivate !== 'function'
  ) return [];
  return [{ key: 'deactivate', label: 'Deactivate', tone: 'danger', onSelect: handlers.deactivate }];
}
