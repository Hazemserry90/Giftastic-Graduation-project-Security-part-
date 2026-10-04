import { hasLoadedEntityField } from '../shared/entityModel';
import { buildCommissionActions } from './commissionActions';
import {
  formatCommissionDate,
  formatCommissionMoney,
  formatCommissionRate,
  getCommissionDaysUntilDue,
  getCommissionOrderLabel,
  isCommissionOverdue,
} from './commissionSelectors';

export default function CommissionSummary({
  commission,
  access,
  handlers = {},
  onDetails,
}) {
  if (!commission || !access?.canRead) return null;
  const actions = buildCommissionActions({ commission, access, handlers });
  const daysUntilDue = getCommissionDaysUntilDue(commission);
  const overdue = isCommissionOverdue(commission);

  return (
    <article className={`border rounded-lg p-4 ${overdue ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
      <div className="flex justify-between items-start gap-4">
        <div>
          {hasLoadedEntityField(commission, 'supplierName') && commission.supplierName && (
            <p className="font-semibold">{commission.supplierName}</p>
          )}
          {hasLoadedEntityField(commission, 'orderId') && (
            <p className="font-semibold">Order {getCommissionOrderLabel(commission)}</p>
          )}
          {hasLoadedEntityField(commission, 'orderSubtotal') && hasLoadedEntityField(commission, 'commissionRate') && (
            <p className="text-sm text-gray-600">
              Subtotal: {formatCommissionMoney(commission.orderSubtotal)} × {formatCommissionRate(commission.commissionRate)}
            </p>
          )}
          {hasLoadedEntityField(commission, 'dueDate') && commission.dueDate && (
            <p className="text-sm text-gray-600">
              Due: {formatCommissionDate(commission.dueDate)}
              {overdue ? (
                <span className="text-red-600 font-semibold ml-2">OVERDUE</span>
              ) : daysUntilDue !== null && (
                <span className="text-gray-500 ml-2">({daysUntilDue} days left)</span>
              )}
            </p>
          )}
        </div>
        <div className="text-right">
          {hasLoadedEntityField(commission, 'commissionAmount') && (
            <p className="text-xl font-bold">{formatCommissionMoney(
              commission.direction === 'PLATFORM_TO_VENDOR' ? commission.payableAmount : commission.commissionAmount
            )}</p>
          )}
          {commission.direction === 'PLATFORM_TO_VENDOR' && <p className="text-xs text-emerald-700">Platform payout to vendor</p>}
          <div className="mt-2 flex flex-wrap justify-end gap-2">
            {actions.map((action) => (
              <button
                key={action.key}
                type="button"
                onClick={() => action.onSelect(commission)}
                className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 text-sm"
              >
                {action.label}
              </button>
            ))}
            {typeof onDetails === 'function' && (
              <button type="button" onClick={() => onDetails(commission)} className="px-4 py-2 border rounded text-sm">
                Details
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
