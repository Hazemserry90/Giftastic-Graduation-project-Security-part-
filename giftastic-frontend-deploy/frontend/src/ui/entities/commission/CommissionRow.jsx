import { hasLoadedEntityField } from '../shared/entityModel';
import {
  formatCommissionDate,
  formatCommissionMoney,
  getCommissionOrderLabel,
} from './commissionSelectors';

export default function CommissionRow({ commission, access, onDetails }) {
  if (!commission || !access?.canRead) return null;
  const overdue = commission.overdue || commission.status === 'OVERDUE';
  return (
    <tr>
      <td className="px-4 py-2 text-sm">{getCommissionOrderLabel(commission) || '-'}</td>
      <td className="px-4 py-2 text-sm">
        {hasLoadedEntityField(commission, 'commissionAmount')
          ? formatCommissionMoney(commission.commissionAmount)
          : '-'}
      </td>
      <td className="px-4 py-2 text-sm">
        {hasLoadedEntityField(commission, 'status') && (
          <span className={`px-2 py-1 rounded-full text-xs ${commission.status === 'PAID' ? 'bg-green-100 text-green-800' : overdue ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
            {commission.status}
          </span>
        )}
      </td>
      <td className="px-4 py-2 text-sm">{formatCommissionDate(commission.dueDate) || '-'}</td>
      <td className="px-4 py-2 text-sm">{formatCommissionDate(commission.paidAt) || '-'}</td>
      {typeof onDetails === 'function' && (
        <td className="px-4 py-2 text-sm">
          <button type="button" onClick={() => onDetails(commission)} className="px-3 py-1 border rounded">Details</button>
        </td>
      )}
    </tr>
  );
}
