import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { productService } from '../services/productService';
import { favoriteService } from '../services/favoriteService';
import { getFriendlyErrorMessage } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import {
  buildProductAccess,
  formatProductMoney,
  PRODUCT_CONTEXT,
  ProductSummary,
} from '../ui/entities/product';
import { adaptEntityFromNamedSource } from '../ui/entities/namedAdapters';
import { buildFavoriteAccess, buildFavoriteToggleAction } from '../ui/entities/favorite';
import { getCategoryDisplayName } from '../ui/entities/category';

export default function ProductCatalog() {
  const { viewer } = useAuthStore();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [favoriteByProduct, setFavoriteByProduct] = useState(new Map());
  const [priceRangeMax, setPriceRangeMax] = useState(5000);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const requestGeneration = useRef(0);
  const initialCategoryId = searchParams.get('category') || '';
  const [filters, setFilters] = useState({
    categoryIds: initialCategoryId ? [String(initialCategoryId)] : [],
    minPrice: '',
    maxPrice: '',
    sortBy: 'featured'
  });

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  useEffect(() => {
    let active = true;
    productService.getCategories()
      .then((records) => {
        if (!active) return;
        setCategories((records || []).map((record) =>
          adaptEntityFromNamedSource('adaptCategoryListRecord', record)));
      })
      .catch(() => {
        if (active) setCategories([]);
      });
    return () => { active = false; };
  }, []);

  const fetchProducts = async () => {
    const generation = ++requestGeneration.current;
    setLoading(true);
    setLoadError('');
    try {
      const params = {
        page: 0,
        size: 100,
      };
      const [productsResponse, favoritesResponse] = await Promise.all([
        productService.getProducts(params),
        favoriteService.getFavorites().catch(() => [])
      ]);
      if (generation !== requestGeneration.current) return;
      const canonicalProducts = (productsResponse.content || []).map((product) =>
        adaptEntityFromNamedSource('adaptProductDomain', product));
      const highestProductPrice = canonicalProducts.reduce((max, product) => {
        const price = Number(product.currentPrice ?? product.price ?? 0);
        return Number.isFinite(price) && price > max ? price : max;
      }, 5000);
      setPriceRangeMax(Math.ceil(highestProductPrice));
      const selectedCategoryIds = new Set((filters.categoryIds || []).map(String));
      const minPrice = filters.minPrice === '' ? null : Number(filters.minPrice);
      const maxPrice = filters.maxPrice === '' ? null : Number(filters.maxPrice);
      const filteredProducts = canonicalProducts
        .filter((product) => selectedCategoryIds.size === 0 || product.categories.some((category) =>
          selectedCategoryIds.has(String(category.id))))
        .filter((product) => !Number.isFinite(minPrice) || Number(product.currentPrice ?? product.price) >= minPrice)
        .filter((product) => !Number.isFinite(maxPrice) || Number(product.currentPrice ?? product.price) <= maxPrice)
        .sort((left, right) => {
          if (filters.sortBy === 'price-asc') {
            return Number(left.currentPrice ?? left.price) - Number(right.currentPrice ?? right.price);
          }
          if (filters.sortBy === 'price-desc') {
            return Number(right.currentPrice ?? right.price) - Number(left.currentPrice ?? left.price);
          }
          if (filters.sortBy === 'rating') {
            return Number(right.averageRating ?? 0) - Number(left.averageRating ?? 0);
          }
          return String(right.createdAt || '').localeCompare(String(left.createdAt || ''));
        });
      setProducts(filteredProducts);
      const favorites = favoritesResponse
        .map((record) => adaptEntityFromNamedSource('adaptFavoriteLegacyRecord', record))
        .filter((favorite) => buildFavoriteAccess({ favorite, viewer }).canRead);
      setFavoriteByProduct(new Map(favorites.filter((favorite) => favorite.productId).map((favorite) => [favorite.productId, favorite])));
    } catch (error) {
      if (generation !== requestGeneration.current) return;
      setProducts([]);
      setLoadError(getFriendlyErrorMessage(error, 'We could not load products. Please refresh and try again.'));
    } finally {
      if (generation === requestGeneration.current) setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  const handleCategoryToggle = (categoryId, checked) => {
    const id = String(categoryId);
    setFilters((current) => ({
      ...current,
      categoryIds: checked
        ? Array.from(new Set([...(current.categoryIds || []), id]))
        : (current.categoryIds || []).filter((selectedId) => selectedId !== id),
    }));
  };

  const toggleFavorite = async (productId) => {
    try {
      const favorite = favoriteByProduct.get(productId) || null;
      const action = buildFavoriteToggleAction({
        favorite,
        access: favorite ? buildFavoriteAccess({ favorite, viewer }) : null,
        target: { type: 'product', id: productId },
        viewer,
        handlers: {
          remove: async () => { await favoriteService.removeProductFavorite(productId); setFavoriteByProduct((current) => { const next = new Map(current); next.delete(productId); return next; }); toast.success('Removed from favorites'); },
          add: async () => { const created = await favoriteService.addProductFavorite(productId); const model = adaptEntityFromNamedSource('adaptFavoriteLegacyRecord', created); setFavoriteByProduct((current) => new Map(current).set(productId, model)); toast.success('Added to favorites!'); },
        },
      });
      await action?.onSelect();
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error, 'We could not update your favorites. Please try again.'));
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl flex-grow px-4 py-12 sm:px-6 lg:px-12">
        <section className="mb-12">
          <nav className="flex text-label-sm font-label-sm text-on-surface-variant mb-4 gap-2">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <span>&gt;</span>
            <span className="text-primary font-semibold">All Gifts</span>
          </nav>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="font-display-xl text-display-xl text-primary mb-2">
                Browse our Curated Collections
              </h1>
              <p className="text-body-lg font-body-lg text-on-surface-variant max-w-2xl">
                Discover artisanal treasures and luxury experiences hand-picked for your most cherished moments in Alexandria.
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-label-md font-label-md text-on-surface-variant">Sort by:</span>
              <select 
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="bg-transparent border-b border-outline py-1 font-label-md focus:border-primary-container focus:ring-0 transition-colors"
              >
                <option value="featured">Featured Arrivals</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
          </div>
        </section>

        <div className="ribbon-divider mb-16"></div>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Filters Sidebar */}
          <aside className="w-full lg:w-64 space-y-10 shrink-0">
            <div>
              <h3 className="font-headline-md text-headline-md text-primary mb-6">Category</h3>
              <div className="space-y-3">
                {categories.map((category) => (
                  <label key={category.id} className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={(filters.categoryIds || []).includes(String(category.id))}
                      onChange={(e) => handleCategoryToggle(category.id, e.target.checked)}
                      className="rounded-sm text-primary-container focus:ring-primary-container border-outline w-5 h-5"
                    />
                    <span className="text-body-md font-body-md group-hover:text-primary transition-colors">
                      {getCategoryDisplayName(category)}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-headline-md text-headline-md text-primary mb-6">Price Range</h3>
              <div className="space-y-4">
                <input 
                  type="range" 
                  min="0" 
                  max={priceRangeMax}
                  value={filters.maxPrice || priceRangeMax}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  className="w-full h-1 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary-container"
                />
                <div className="flex items-center justify-between text-label-md font-label-md">
                  <span className="bg-surface-container-low px-3 py-1 rounded border border-outline-variant text-primary">
                    {formatProductMoney(filters.minPrice || '0')}
                  </span>
                  <span className="bg-surface-container-low px-3 py-1 rounded border border-outline-variant text-primary">
                    {formatProductMoney(filters.maxPrice || String(priceRangeMax))}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-label-sm font-label-sm text-on-surface-variant">
                    Min
                    <input
                      type="number"
                      min="0"
                      value={filters.minPrice}
                      onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                      className="mt-1 w-full rounded-lg border border-outline-variant px-3 py-2 text-primary outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="0"
                    />
                  </label>
                  <label className="text-label-sm font-label-sm text-on-surface-variant">
                    Max
                    <input
                      type="number"
                      min="0"
                      value={filters.maxPrice}
                      onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                      className="mt-1 w-full rounded-lg border border-outline-variant px-3 py-2 text-primary outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder={String(priceRangeMax)}
                    />
                  </label>
                </div>
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-12">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-square bg-stone-200 rounded-lg mb-6"></div>
                    <div className="h-4 bg-stone-200 rounded mb-2"></div>
                    <div className="h-3 bg-stone-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : loadError ? (
              <div className="py-12 text-center">
                <p className="text-error">{loadError}</p>
                <button type="button" onClick={fetchProducts} className="mt-4 rounded-lg bg-primary px-5 py-2 text-white">
                  Try again
                </button>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-on-surface-variant text-body-lg">No products found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-12">
                {products.map((product) => {
                  const access = buildProductAccess({
                    product,
                    viewer,
                    context: PRODUCT_CONTEXT.PUBLIC,
                  });
                  return (
                  <div key={product.id} className="group relative">
                    <ProductSummary product={product} access={access} to={`/products/${product.id}`} />
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleFavorite(product.id);
                      }}
                      className="absolute top-4 right-4 p-2.5 rounded-full bg-white/80 backdrop-blur-sm shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-white"
                    >
                      <span className={`material-symbols-outlined text-[20px] transition-colors ${favoriteByProduct.has(product.id) ? 'text-error fill' : 'text-on-surface-variant hover:text-error'}`}>
                        favorite
                      </span>
                    </button>
                  </div>
                )})}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
