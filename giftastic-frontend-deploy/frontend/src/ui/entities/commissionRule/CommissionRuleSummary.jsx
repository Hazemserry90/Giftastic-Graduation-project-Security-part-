import { hasLoadedEntityField } from '../shared/entityModel';
import { buildCommissionRuleActions } from './commissionRuleActions';
import {
  formatCommissionRuleDate,
  formatCommissionRuleRate,
  getCommissionRuleScopeLabel,
  getCommissionRuleState,
} from './commissionRuleSelectors';

export default function CommissionRuleSummary({
  rule,
  access,
  handlers = {},
  onDetails,
}) {
  if (!rule || !access?.canRead) return null;
  const actions = buildCommissionRuleActions({ rule, access, handlers });
  const state = getCommissionRuleState(rule);

  return (
    <article className="border rounded-lg p-4 bg-white">
      <div className="flex justify-between items-start gap-4">
        <div>
          <p className="font-semibold">{getCommissionRuleScopeLabel(rule)}</p>
          {hasLoadedEntityField(rule, 'rate') && (
            <p className="text-sm text-gray-600">Rate: {formatCommissionRuleRate(rule.rate)}</p>
          )}
          {hasLoadedEntityField(rule, 'startDate') && rule.startDate && (
            <p className="text-sm text-gray-600">Starts: {formatCommissionRuleDate(rule.startDate)}</p>
          )}
          {hasLoadedEntityField(rule, 'endDate') && (
            <p className="text-sm text-gray-600">
              Ends: {rule.endDate ? formatCommissionRuleDate(rule.endDate) : 'No end date'}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {hasLoadedEntityField(rule, 'active') && (
            <span className={`px-3 py-1 rounded-full text-sm ${state.className}`}>
              {state.label}
            </span>
          )}
          {actions.map((action) => (
            <button
              key={action.key}
              type="button"
              onClick={() => action.onSelect(rule)}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
            >
              {action.label}
            </button>
          ))}
          {typeof onDetails === 'function' && (
            <button type="button" onClick={() => onDetails(rule)} className="px-3 py-1 border rounded text-sm">
              Details
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
