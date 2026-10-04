import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';

export default function VendorSidebar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuItems = [
    { name: 'Analytics', path: '/vendor/analytics', icon: 'bar_chart', aliases: ['/vendor/dashboard'] },
    { name: 'Products', path: '/vendor/products', icon: 'inventory_2' },
    { name: 'Orders', path: '/vendor/orders', icon: 'shopping_bag' },
    { name: 'Commissions', path: '/vendor/commissions', icon: 'payments' },
    { name: 'Gift Flows', path: '/vendor/flows', icon: 'auto_awesome' },
    { name: 'Delivery Pricing', path: '/vendor/delivery-pricing', icon: 'local_shipping' },
    { name: 'Activity Log', path: '/vendor/activity', icon: 'analytics' },
    { name: 'Profile Settings', path: '/vendor/profile', icon: 'settings' },
  ];

  const renderLink = (item, mobile = false) => {
    const isActive = location.pathname === item.path || item.aliases?.includes(location.pathname);
    return (
      <Link
        key={item.path}
        to={item.path}
        onClick={() => mobile && setMobileOpen(false)}
        className={`flex items-center gap-3 rounded-lg px-4 py-3 font-label-md transition-all ${
          isActive
            ? 'bg-primary/5 text-primary shadow-sm'
            : 'text-stone-600 hover:bg-stone-50 hover:text-primary'
        }`}
      >
        <span className={`material-symbols-outlined text-[20px] ${isActive ? 'fill' : ''}`}>
          {item.icon}
        </span>
        {item.name}
      </Link>
    );
  };

  return (
    <>
      <div className="md:hidden">
        <button
          type="button"
          aria-label="Open vendor dashboard menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(true)}
          className="fixed bottom-4 left-4 z-[900] flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        {mobileOpen && (
          <div className="fixed inset-0 z-[1000]">
            <button
              type="button"
              aria-label="Close vendor dashboard menu"
              className="absolute inset-0 bg-stone-900/50"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white p-4 shadow-2xl">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-headline-md text-primary">Vendor menu</h2>
                <button
                  type="button"
                  aria-label="Close vendor dashboard menu"
                  onClick={() => setMobileOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-stone-100"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <nav className="grid gap-2">
                {menuItems.map((item) => renderLink(item, true))}
              </nav>
            </aside>
          </div>
        )}
      </div>

      <aside className="sticky top-20 hidden h-[calc(100vh-80px)] w-64 shrink-0 border-r border-stone-200 bg-white md:block">
        <nav className="space-y-2 p-4">
          {menuItems.map((item) => renderLink(item))}
        </nav>
        
        <div className="absolute bottom-0 left-0 w-full border-t border-stone-100 p-6">
          <div className="rounded-xl bg-primary/5 p-4">
             <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-primary">Boutique Status</p>
             <div className="flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-tertiary"></span>
                <span className="text-xs font-medium text-primary">Live in Alexandria</span>
             </div>
          </div>
        </div>
      </aside>
    </>
  );
}
