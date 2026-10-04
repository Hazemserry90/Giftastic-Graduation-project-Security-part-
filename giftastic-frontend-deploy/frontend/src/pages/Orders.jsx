import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ShoppingBag } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuthStore } from '../store/useAuthStore';
import { orderService } from '../services/orderService';
import {
  buildOrderAccess,
  OrderHistoryCard,
  ORDER_CONTEXT,
} from '../ui/entities/order';
import { adaptEntityFromNamedSource } from '../ui/entities/namedAdapters';
import { guestOrderRecordToOrder, readGuestOrderRecords } from '../utils/guestOrders';

export default function Orders() {
  const user = useAuthStore((state) => state.user);
  const viewer = useAuthStore((state) => state.viewer);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);

    if (user) {
      orderService.getCustomerOrders(user.id)
        .then((data) => {
          if (!active) return;
          setOrders((data || []).map((order) =>
            adaptEntityFromNamedSource('adaptOrderCustomerListRecord', order)));
        })
        .catch(() => toast.error('Failed to fetch orders'))
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => { active = false; };
    }

    const records = readGuestOrderRecords();
    if (!records.length) {
      setOrders([]);
      setLoading(false);
      return () => { active = false; };
    }

    setOrders(records
      .map((record) => adaptEntityFromNamedSource('adaptOrderCustomerListRecord', guestOrderRecordToOrder(record)))
      .sort((a, b) => new Date(b.placedAt || 0) - new Date(a.placedAt || 0)));
    setLoading(false);

    Promise.all(records.map(async (record) => ({
      record,
      order: await orderService.trackGuestOrder(record.orderId, record.email, record.phone).catch(() => null),
    })))
      .then((results) => {
        if (!active) return;
        const guestOrders = results
          .map(({ record, order }) => order || guestOrderRecordToOrder(record))
          .map((order) => adaptEntityFromNamedSource('adaptOrderCustomerListRecord', order))
          .sort((a, b) => new Date(b.placedAt || 0) - new Date(a.placedAt || 0));
        setOrders(guestOrders);
      })
      .catch(() => toast.error('Failed to refresh guest orders'));

    return () => { active = false; };
  }, [user]);

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-grow px-4 py-12 sm:px-6 lg:px-8">
        <header className="mb-12">
          <h1 className="font-display-xl text-headline-lg text-primary">Order History</h1>
          <p className="mt-2 max-w-2xl text-on-surface-variant">Track your gifts and review past orders.</p>
        </header>
        {loading ? (
          <div className="flex justify-center py-20" role="status"><div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" /></div>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl border border-outline-variant bg-white py-24 text-center shadow-sm">
            <ShoppingBag className="mx-auto mb-6 h-10 w-10 text-primary/40" />
            <h2 className="text-xl font-bold text-primary">No orders yet</h2>
            <Link to="/products" className="mt-8 inline-flex rounded-xl bg-primary px-10 py-3 font-bold text-on-primary">Browse Products</Link>
          </div>
        ) : (
          <div className="grid gap-8">
            {orders.map((order) => (
              <OrderHistoryCard
                key={order.id}
                order={order}
                access={buildOrderAccess({
                  order,
                  viewer,
                  context: ORDER_CONTEXT.CUSTOMER,
                  relationship: !user && !order.customerId ? { isGuestSessionAuthorized: true } : {},
                })}
              />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
