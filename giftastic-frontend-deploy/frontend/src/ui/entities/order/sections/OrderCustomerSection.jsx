// Canonical Order presentation section.
import OrderSection from './OrderSection';
import UserSummary from '../../user/UserSummary';
import { getReadableUserField } from '../../user';

export default function OrderCustomerSection({
  order,
  customerEntity,
  customerAccess,
  onCustomerOpen,
}) {
  const email = getReadableUserField(customerEntity, 'email', customerAccess?.fields?.email).value;
  const phone = getReadableUserField(customerEntity, 'phoneNumber', customerAccess?.fields?.phoneNumber).value;
  return (
    <OrderSection title="Customer" icon="person">
      {customerEntity && customerAccess ? (
        <div className="space-y-3">
          <UserSummary
            model={customerEntity}
            access={customerAccess}
            onClick={() => onCustomerOpen?.(customerEntity)}
          />
          <div className="grid gap-1 text-sm text-on-surface-variant">
            {email && <p><span className="font-semibold text-primary">Email:</span> {email}</p>}
            {phone && <p><span className="font-semibold text-primary">Phone:</span> {phone}</p>}
          </div>
        </div>
      ) : (
        <p className="text-sm italic text-on-surface-variant">
          {order?.customerId ? 'Customer details are unavailable.' : 'No customer profile is attached to this order.'}
        </p>
      )}
    </OrderSection>
  );
}
