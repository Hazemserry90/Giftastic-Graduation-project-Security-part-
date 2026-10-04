import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-stone-100 border-t border-stone-200 py-16">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 w-full px-12 max-w-7xl mx-auto">
        <div className="space-y-4">
          <div className="text-lg font-serif font-semibold text-[#4B2C5E]">Giftastic</div>
          <p className="font-['Plus_Jakarta_Sans'] text-sm tracking-wide text-stone-500 max-w-xs">
            Elevating the art of gifting in Alexandria with curated local treasures and premium service.
          </p>
        </div>
        
        <div className="space-y-4">
          <h5 className="font-label-md text-primary">Discover</h5>
          <ul className="space-y-2">
            <li>
              <Link to="/about" className="font-['Plus_Jakarta_Sans'] text-sm tracking-wide text-stone-500 hover:text-[#4B2C5E] underline decoration-dotted transition-all">
                Our Story
              </Link>
            </li>
            <li>
              <Link to="/locations" className="font-['Plus_Jakarta_Sans'] text-sm tracking-wide text-stone-500 hover:text-[#4B2C5E] underline decoration-dotted transition-all">
                Boutique Locations
              </Link>
            </li>
            <li>
              <Link to="/concierge" className="font-['Plus_Jakarta_Sans'] text-sm tracking-wide text-stone-500 hover:text-[#4B2C5E] underline decoration-dotted transition-all">
                Gift Concierge
              </Link>
            </li>
          </ul>
        </div>
        
        <div className="space-y-4">
          <h5 className="font-label-md text-primary">Customer Care</h5>
          <ul className="space-y-2">
            <li>
              <Link to="/shipping" className="font-['Plus_Jakarta_Sans'] text-sm tracking-wide text-stone-500 hover:text-[#4B2C5E] underline decoration-dotted transition-all">
                Shipping & Returns
              </Link>
            </li>
            <li>
              <Link to="/privacy" className="font-['Plus_Jakarta_Sans'] text-sm tracking-wide text-stone-500 hover:text-[#4B2C5E] underline decoration-dotted transition-all">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link to="/become-vendor" className="font-['Plus_Jakarta_Sans'] text-sm tracking-wide text-stone-500 hover:text-[#4B2C5E] underline decoration-dotted transition-all">
                Become a Vendor
              </Link>
            </li>
          </ul>
        </div>
        
        <div className="space-y-4">
          <h5 className="font-label-md text-primary">Connect</h5>
          <div className="flex gap-4">
            <a href="#" className="material-symbols-outlined text-stone-600 hover:text-primary transition-colors">
              public
            </a>
            <a href="#" className="material-symbols-outlined text-stone-600 hover:text-primary transition-colors">
              alternate_email
            </a>
            <a href="#" className="material-symbols-outlined text-stone-600 hover:text-primary transition-colors">
              phone_iphone
            </a>
          </div>
          <p className="font-['Plus_Jakarta_Sans'] text-sm tracking-wide text-stone-400 pt-4">
            © 2024 Giftastic Alexandria. Joyful, Premium, Trustworthy.
          </p>
        </div>
      </div>
    </footer>
  );
}
