import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoaderCircle, Search } from 'lucide-react';
import api from '../services/api';
import { buildProductAccess, PRODUCT_CONTEXT, ProductSearchResult } from '../ui/entities/product';
import { buildVendorAccess, VENDOR_CONTEXT, VendorSearchResult } from '../ui/entities/vendor';
import { buildGiftFlowAccess, GiftFlowSearchResult } from '../ui/entities/giftFlow';
import { useAuthStore } from '../store/useAuthStore';
import { adaptUnifiedSearchProjection } from '../ui/projections';
import { selectUnifiedSearchData } from '../ui/projections/unifiedSearch/UnifiedSearchSelectors';

const GlobalSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef(null);
  const requestGeneration = useRef(0);
  const navigate = useNavigate();
  const viewer = useAuthStore((state) => state.viewer);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query || query.length < 2) {
      requestGeneration.current += 1;
      setResults(null);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      const generation = ++requestGeneration.current;
      setLoading(true);
      try {
        const response = await api.get(`/search?q=${encodeURIComponent(query)}&limit=5`);
        if (generation !== requestGeneration.current) return;
        setResults(selectUnifiedSearchData(adaptUnifiedSearchProjection(response.data)));
        setIsOpen(true);
      } catch (error) {
        if (generation !== requestGeneration.current) return;
        console.error('Search failed:', error);
      } finally {
        if (generation === requestGeneration.current) setLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      requestGeneration.current += 1;
    };
  }, [query]);

  const handleResultClick = () => {
    setQuery('');
    setResults(null);
    setIsOpen(false);
  };

  const hasResults = results && (
    results.products.length > 0 ||
    results.vendors.length > 0 ||
    results.giftFlows.length > 0
  );

  return (
    <div ref={searchRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search gifts, vendors, flows..."
          className="w-full rounded-full border border-[#eadfd7] bg-white/90 py-3 pl-11 pr-4 text-sm font-medium text-primary shadow-sm outline-none transition placeholder:text-stone-400 hover:border-[#d8b98e] focus:border-primary focus:ring-2 focus:ring-primary/15"
        />
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a4b16]" aria-hidden="true" />
        {loading && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2">
            <LoaderCircle className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
          </span>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && hasResults && (
        <div className="absolute top-full z-50 mt-2 max-h-96 w-full overflow-y-auto rounded border border-[#eadfd7] bg-white shadow-xl shadow-primary/10">
          {/* Products */}
          {results.products.length > 0 && (
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[#8a4b16]">
                Products ({results.products.length})
              </div>
              {results.products.map((product) => (
                <ProductSearchResult
                  key={product.id}
                  product={product}
                  access={buildProductAccess({ product, viewer, context: PRODUCT_CONTEXT.SEARCH })}
                  to={`/products/${product.id}`}
                  onSelect={handleResultClick}
                />
              ))}
            </div>
          )}

          {/* Vendors */}
          {results.vendors.length > 0 && (
            <div className="border-t border-[#f0e6df] p-2">
              <div className="px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[#8a4b16]">
                Vendors ({results.vendors.length})
              </div>
              {results.vendors.map((vendor) => (
                <VendorSearchResult
                  key={vendor.supplierId}
                  vendor={vendor}
                  access={buildVendorAccess({ vendor, viewer, context: VENDOR_CONTEXT.SEARCH })}
                  to={`/vendors/${vendor.supplierId}`}
                  onSelect={handleResultClick}
                />
              ))}
            </div>
          )}

          {/* Gift Flows */}
          {results.giftFlows.length > 0 && (
            <div className="border-t border-[#f0e6df] p-2">
              <div className="px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[#8a4b16]">
                Gift Flows ({results.giftFlows.length})
              </div>
              {results.giftFlows.map((flow) => (
                <GiftFlowSearchResult
                  key={flow.id}
                  flow={flow}
                  access={buildGiftFlowAccess({ flow, viewer })}
                  to={`/gift-flow/${flow.id}`}
                  onSelect={handleResultClick}
                />
              ))}
            </div>
          )}

          {/* Total Results */}
          <div className="border-t border-[#f0e6df] bg-[#fffaf5] p-3 text-center text-xs font-semibold text-stone-500">
            {results.totalResults} result{results.totalResults !== 1 ? 's' : ''} found
          </div>
        </div>
      )}

      {/* No Results */}
      {isOpen && results && !hasResults && (
        <div className="absolute top-full z-50 mt-2 w-full rounded border border-[#eadfd7] bg-white p-4 text-center text-sm text-stone-500 shadow-xl shadow-primary/10">
          No results found for "{query}"
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
