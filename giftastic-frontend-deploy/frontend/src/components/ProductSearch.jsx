import React, { useState, useEffect, useRef } from 'react';
import { productSearchService } from '../services/productSearchService';
import {
  buildProductAccess,
  PRODUCT_CONTEXT,
  ProductSummary,
} from '../ui/entities/product';
import { useAuthStore } from '../store/useAuthStore';
import { adaptProductSearchProjection } from '../ui/projections/productSearch';
import { mapProductSearchFilters } from '../ui/commands/productSearch';

const ProductSearch = () => {
  const viewer = useAuthStore((state) => state.viewer);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    inStockOnly: false,
    onSaleOnly: false,
    sortBy: 'newest'
  });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const requestGeneration = useRef(0);

  const handleSearch = async () => {
    const generation = ++requestGeneration.current;
    setLoading(true);
    try {
      const response = await productSearchService.searchWithFilters(mapProductSearchFilters({
        query: searchQuery,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        inStockOnly: filters.inStockOnly,
        onSaleOnly: filters.onSaleOnly,
        sortBy: filters.sortBy,
        page,
        size: 20
      }));
      if (generation !== requestGeneration.current) return;
      const projection = adaptProductSearchProjection(response);
      setProducts(projection.data.products);
      setTotalPages(projection.data.totalPages);
    } catch (error) {
      if (generation !== requestGeneration.current) return;
      console.error('Search failed:', error);
    } finally {
      if (generation === requestGeneration.current) setLoading(false);
    }
  };

  useEffect(() => () => {
    requestGeneration.current += 1;
  }, []);

  useEffect(() => {
    handleSearch();
  }, [page, filters.sortBy, filters.inStockOnly, filters.onSaleOnly]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Search Bar */}
      <div className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search products..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Search
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Min Price</label>
            <input
              type="number"
              value={filters.minPrice}
              onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Max Price</label>
            <input
              type="number"
              value={filters.maxPrice}
              onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              placeholder="1000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Sort By</label>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.inStockOnly}
                onChange={(e) => setFilters({ ...filters, inStockOnly: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm">In Stock Only</span>
            </label>
          </div>
          <div className="flex items-end">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.onSaleOnly}
                onChange={(e) => setFilters({ ...filters, onSaleOnly: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm">On Sale Only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductSummary
                key={product.id}
                product={product}
                access={buildProductAccess({ product, viewer, context: PRODUCT_CONTEXT.SEARCH })}
                to={`/products/${product.id}`}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="px-4 py-2 border rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="px-4 py-2 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProductSearch;
