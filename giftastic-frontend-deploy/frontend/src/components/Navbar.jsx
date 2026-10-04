import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Heart,
  Menu,
  Package,
  PanelTop,
  ShoppingCart,
  Sparkles,
  Store,
  X,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';
import { useEffect, useState } from 'react';
import NotificationBell from './NotificationBell';
import GlobalSearch from './GlobalSearch';
import { getCartItemCount } from '../ui/entities/cart';
import giftasticLogo from '../assets/Giftastic Logo.png';

const navigationItems = [
  { to: '/gift-flow', label: 'Gift Flow', icon: Sparkles },
  { to: '/products', label: 'Collections', icon: Package },
  { to: '/vendors', label: 'Vendors', icon: Store },
  { to: '/dashboard', label: 'Reminders', icon: PanelTop },
];

const NavItem = ({ to, label, icon: Icon, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) => `giftastic-nav-link ${isActive ? 'active' : ''}`}
  >
    <Icon className="h-4 w-4" aria-hidden="true" />
    <span>{label}</span>
  </NavLink>
);

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const viewer = useAuthStore((state) => state.viewer);
  const logout = useAuthStore((state) => state.logout);
  const syncSession = useAuthStore((state) => state.syncSession);
  const cartItemCount = useCartStore((state) => getCartItemCount(state.cart) ?? 0);

  useEffect(() => {
    syncSession();
  }, [syncSession]);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-[#e8ddd5]/80 bg-[#fbf9f6]/92 shadow-[0_12px_34px_-26px_rgba(52,21,71,0.45)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:flex-nowrap lg:px-8">
        <Link
          to="/"
          aria-label="Giftastic home"
          onClick={closeMobileMenu}
          className="group flex min-w-0 shrink-0 items-center gap-3 rounded-full border border-[#eadfd7] bg-white/80 py-1.5 pl-2 pr-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#d8b98e] hover:shadow-md"
        >
          <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-[#fff7ed]">
            <img
              src={giftasticLogo}
              alt="Giftastic"
              className="h-9 w-auto object-contain transition duration-300 group-hover:scale-105"
            />
          </span>
          <span className="hidden min-w-0 sm:block">
            <span className="block font-headline-md text-base leading-none text-primary">Giftastic</span>
            <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.18em] text-[#8a4b16]">Alexandria gifts</span>
          </span>
        </Link>

        <div className="hidden items-center rounded-full border border-[#eadfd7] bg-[#f5efe9]/80 p-1 lg:flex">
          {navigationItems.map((item) => <NavItem key={item.to} {...item} />)}
        </div>

        <div className="order-last w-full min-w-0 lg:order-none lg:ml-auto lg:max-w-md lg:flex-1">
          <GlobalSearch />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2 lg:ml-0">
          <button
            type="button"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="giftastic-nav-action lg:hidden"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>

          <Link to="/cart" aria-label="Cart" className="giftastic-nav-action">
            <ShoppingCart className="h-5 w-5" aria-hidden="true" />
            {cartItemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#8a4b16] px-1 text-[10px] font-bold text-white shadow-sm">
                {cartItemCount > 9 ? '9+' : cartItemCount}
              </span>
            )}
          </Link>

          <Link to="/favorites" aria-label="Favorites" className="giftastic-nav-action">
            <Heart className="h-5 w-5" aria-hidden="true" />
          </Link>

          <NotificationBell />
          
          <div className="relative group">
            <button aria-label="Account menu" className="material-symbols-outlined flex h-11 w-11 items-center justify-center rounded-full text-stone-600 transition-all hover:bg-stone-100">
              <span aria-hidden="true">account_circle</span>
            </button>
            <div className="absolute right-0 top-full z-50 w-48 pt-2 opacity-0 invisible transition-all duration-200 group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible">
              <div className="rounded-lg bg-white py-2 shadow-lg">
                {isAuthenticated ? (
                  <>
                  <Link to="/profile" className="block px-4 py-2 text-sm text-stone-700 hover:bg-stone-100">
                    My Profile
                  </Link>
                  <Link to="/orders" className="block px-4 py-2 text-sm text-stone-700 hover:bg-stone-100">
                    Order History
                  </Link>
                  {viewer?.isVendor && (
                    <>
                      <Link to="/vendor/analytics" className="block px-4 py-2 text-sm text-stone-700 hover:bg-stone-100">
                        Vendor Portal
                      </Link>
                      <Link to="/vendor/commissions" className="block px-4 py-2 text-sm text-stone-700 hover:bg-stone-100">
                        Commissions
                      </Link>
                    </>
                  )}
                  {viewer?.isAdmin && (
                    <Link to="/admin/dashboard" className="block px-4 py-2 text-sm text-stone-700 hover:bg-stone-100">
                      Admin Panel
                    </Link>
                  )}
                  <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-stone-700 hover:bg-stone-100">
                    Logout
                  </button>
                  </>
                ) : (
                  <>
                  <Link to="/orders" className="block px-4 py-2 text-sm text-stone-700 hover:bg-stone-100">
                    Order History
                  </Link>
                  <Link to="/login" className="block px-4 py-2 text-sm text-stone-700 hover:bg-stone-100">
                    Sign In
                  </Link>
                  <Link to="/register" className="block px-4 py-2 text-sm text-stone-700 hover:bg-stone-100">
                    Create Account
                  </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div id="mobile-navigation" className="order-last grid w-full gap-2 border-t border-[#eadfd7] pt-3 lg:hidden">
            {navigationItems.map((item) => (
              <NavItem
                key={item.to}
                {...item}
                onClick={closeMobileMenu}
              />
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
