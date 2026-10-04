import UserSummary from '../user/UserSummary';
import {
  formatCountdown,
  formatOrderDate,
  formatOrderMoney,
  getOrderStatusClass,
  getOrderVisibleTotal,
  getShortOrderId,
  getVendorFinancialReleaseWindow,
} from './orderSelectors';

export default function VendorOrderRow({
  order,
  access,
  customer,
  customerAccess,
  statusOptions,
  updating,
  onOpen,
  onCustomerOpen,
  onStatusChange,
}) {
  const supplierId = access?.viewerSupplierId || Object.keys(order.vendorStatuses || {})[0];
  const vendorStatus = order.vendorStatuses?.[supplierId] || order.status;
  const releaseWindow = getVendorFinancialReleaseWindow(order, supplierId);
  return (
    <tr onClick={() => onOpen?.(order)} className="group cursor-pointer transition-colors hover:bg-primary/5">
      <td className="px-8 py-6">
        <p className="font-mono text-sm font-bold text-primary">#{getShortOrderId(order)}</p>
        <p className="mt-1 text-[10px] text-on-surface-variant">{formatOrderDate(order.placedAt, { dateStyle: 'medium' }) || 'Unknown date'}</p>
      </td>
      <td className="px-8 py-6">
        <UserSummary model={customer} access={customerAccess} compact onClick={(event) => {
          event?.stopPropagation?.();
          onCustomerOpen?.(customer);
        }} />
      </td>
      <td className="px-8 py-6 text-right"><p className="font-display-sm text-primary">{formatOrderMoney(getOrderVisibleTotal(order, access)) || '-'}</p></td>
      <td className="px-8 py-6 text-center" onClick={(event) => event.stopPropagation()}>
        <select
          value={vendorStatus}
          onChange={(event) => onStatusChange?.(order.id, event.target.value)}
          disabled={updating || statusOptions.length === 1}
          className={`cursor-pointer rounded-full border px-4 py-1.5 text-[10px] font-bold uppercase outline-none ${getOrderStatusClass(vendorStatus)}`}
        >
          {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
        {vendorStatus === 'DONE' && releaseWindow.releaseAt && (
          <p className="mt-2 text-[10px] font-semibold text-on-surface-variant">
            {releaseWindow.open ? `Unlocks in ${formatCountdown(releaseWindow.secondsLeft)}` : 'Payments unlocked'}
          </p>
        )}
        {vendorStatus === 'INVALID' && (
          <p className="mt-2 text-[10px] font-semibold text-red-700">Invalid portion</p>
        )}
      </td>
    </tr>
  );
}
