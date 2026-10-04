import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarDays,
  Gift,
  LoaderCircle,
  PackageCheck,
  Search,
  Sparkles,
  Store,
  WandSparkles,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { productService } from '../services/productService';
import { productSearchService } from '../services/productSearchService';
import { giftFlowService } from '../services/giftFlowService';
import { adaptEntityFromNamedSource } from '../ui/entities/namedAdapters';
import { useAuthStore } from '../store/useAuthStore';
import { getCategoryDisplayName } from '../ui/entities/category';
import {
  buildGiftFlowAccess,
  GiftFlowSummary,
  GIFT_FLOW_CONTEXT,
} from '../ui/entities/giftFlow';
import { buildProductAccess, ProductSummary, PRODUCT_CONTEXT } from '../ui/entities/product';

const heroImage = 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?q=85&w=2400&auto=format&fit=crop';
const reminderImage = 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=85&w=1800&auto=format&fit=crop';

const giftModes = [
  {
    title: 'Gift flows',
    description: 'Guided bundles that feel personal without the guesswork.',
    to: '/gift-flow',
    icon: WandSparkles,
    tone: 'bg-[#fff1df] text-[#8a4b16] border-[#f0d3ac]',
  },
  {
    title: 'Collections',
    description: 'Browse ready-to-send finds from local makers and stores.',
    to: '/products',
    icon: Gift,
    tone: 'bg-[#eef8f5] text-[#0c6b5b] border-[#bee6dc]',
  },
  {
    title: 'Vendors',
    description: 'Discover the people and shops behind every thoughtful pick.',
    to: '/vendors',
    icon: Store,
    tone: 'bg-[#f2edf8] text-primary border-[#ded0e8]',
  },
];

const serviceNotes = [
  { label: 'Local stores', value: 'Alexandria first' },
  { label: 'Flexible checkout', value: 'COD or Instapay' },
  { label: 'Gift memory', value: 'Reminders built in' },
];

const PRODUCT_RAIL_SIZE = 4;
const productSkeletons = [1, 2, 3, 4];

const ProductGridSkeleton = () => (
  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
    {productSkeletons.map((item) => (
      <div key={item} className="animate-pulse rounded border border-stone-100 bg-white p-3 shadow-sm">
        <div className="aspect-square rounded bg-stone-200" />
        <div className="mt-4 h-4 rounded bg-stone-200" />
        <div className="mt-2 h-3 w-2/3 rounded bg-stone-200" />
      </div>
    ))}
  </div>
);

const SectionHeading = ({ eyebrow, title, copy, action }) => (
  <div className="mb-8 flex flex-col gap-5 sm:mb-10 lg:flex-row lg:items-end lg:justify-between">
    <div className="max-w-2xl">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#0c6b5b]">{eyebrow}</p>
      <h2 className="font-headline-lg text-3xl text-primary sm:text-4xl">{title}</h2>
      {copy && <p className="mt-3 text-base leading-7 text-on-surface-variant">{copy}</p>}
    </div>
    {action}
  </div>
);

const SectionLink = ({ to, children, icon: Icon }) => (
  <Link
    to={to}
    className="inline-flex w-fit items-center gap-2 rounded border border-primary/20 bg-white px-4 py-3 text-sm font-bold text-primary shadow-sm transition hover:border-primary/40 hover:bg-primary/5"
  >
    {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
    {children}
    <ArrowRight className="h-4 w-4" aria-hidden="true" />
  </Link>
);

const LazyCategoryProductSection = ({ category, viewer }) => {
  const sectionRef = useRef(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const categoryId = category?.id;
  const categoryName = getCategoryDisplayName(category);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node || shouldLoad) return undefined;

    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setShouldLoad(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '620px 0px', threshold: 0.01 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [shouldLoad]);

  useEffect(() => {
    if (!shouldLoad || loaded || !categoryId) return undefined;

    let active = true;
    setLoading(true);

    productSearchService.searchWithFilters({
      categoryIds: [categoryId],
      inStockOnly: true,
      page: 0,
      size: PRODUCT_RAIL_SIZE,
      sortBy: 'newest',
    }).then((response) => {
      if (!active) return;
      const records = response?.content || response?.products || [];
      setProducts(records.map((product) =>
        adaptEntityFromNamedSource('adaptProductSearchResult', product)));
    }).catch(() => {
      if (active) setProducts([]);
    }).finally(() => {
      if (!active) return;
      setLoading(false);
      setLoaded(true);
    });

    return () => {
      active = false;
    };
  }, [categoryId, loaded, shouldLoad]);

  if (loaded && products.length === 0) return null;

  return (
    <section ref={sectionRef} className="border-t border-[#eadfd7] pt-10 first:border-t-0 first:pt-0">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8a4b16]">Category collection</p>
          <h3 className="mt-2 flex items-center gap-3 font-headline-lg text-2xl text-primary">
            {categoryName}
            {loading && (
              <LoaderCircle className="h-4 w-4 animate-spin text-[#8a4b16]" aria-hidden="true" />
            )}
          </h3>
        </div>
        <Link
          to={`/products?category=${categoryId}`}
          className="inline-flex w-fit items-center gap-2 rounded border border-primary/20 bg-white px-4 py-3 text-sm font-bold text-primary shadow-sm transition hover:border-primary/40 hover:bg-primary/5"
        >
          View category
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      {loading || !loaded ? (
        <ProductGridSkeleton />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <div key={product.id} className="giftastic-hover-sheen rounded border border-[#eadfd7] bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
              <ProductSummary
                product={product}
                access={buildProductAccess({ product, viewer, context: PRODUCT_CONTEXT.PUBLIC })}
                to={`/products/${product.id}`}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default function HomePage() {
  const landingRef = useRef(null);
  const viewer = useAuthStore((state) => state.viewer);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [giftFlows, setGiftFlows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, flowsRes, categoriesRes] = await Promise.all([
          productService.getProducts({ page: 0, size: 4 }).catch(() => ({ content: [] })),
          giftFlowService.getAllFlows().catch(() => []),
          productService.getCategories().catch(() => []),
        ]);
        setTrendingProducts((productsRes.content || []).map((product) =>
          adaptEntityFromNamedSource('adaptProductDomain', product)));
        setGiftFlows((flowsRes || []).map((flow) =>
          adaptEntityFromNamedSource('adaptGiftFlowResponse', flow)));
        setCategories((categoriesRes || []).map((category) =>
          adaptEntityFromNamedSource('adaptCategoryListRecord', category)));
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const root = landingRef.current;
    if (!root || typeof window === 'undefined') return undefined;

    let frameId = 0;
    const updateProgress = () => {
      frameId = 0;
      const page = document.documentElement;
      const maxScroll = Math.max(1, page.scrollHeight - window.innerHeight);
      const progress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
      const phase = progress > 0.78 ? 4 : progress > 0.52 ? 3 : progress > 0.25 ? 2 : progress > 0.06 ? 1 : 0;

      root.style.setProperty('--giftastic-scroll-progress', progress.toFixed(3));
      root.dataset.vinePhase = String(phase);
    };

    const scheduleProgress = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(updateProgress);
    };

    updateProgress();
    window.addEventListener('scroll', scheduleProgress, { passive: true });
    window.addEventListener('resize', scheduleProgress);

    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      window.removeEventListener('scroll', scheduleProgress);
      window.removeEventListener('resize', scheduleProgress);
    };
  }, []);

  return (
    <div ref={landingRef} className="giftastic-landing flex min-h-screen flex-col bg-[#fbf9f6] text-on-surface">
      <Navbar />
      <div className="giftastic-vine-pillars" aria-hidden="true">
        <span className="giftastic-vine-pillar giftastic-vine-pillar-left">
          <span className="giftastic-vine-progress" />
          <span className="giftastic-vine-leaf giftastic-vine-leaf-1" />
          <span className="giftastic-vine-leaf giftastic-vine-leaf-2" />
          <span className="giftastic-vine-leaf giftastic-vine-leaf-3" />
          <span className="giftastic-vine-bloom giftastic-vine-bloom-1" />
          <span className="giftastic-vine-bloom giftastic-vine-bloom-2" />
          <span className="giftastic-vine-bloom giftastic-vine-bloom-3" />
          <span className="giftastic-vine-bloom giftastic-vine-bloom-4" />
        </span>
        <span className="giftastic-vine-pillar giftastic-vine-pillar-right">
          <span className="giftastic-vine-progress" />
          <span className="giftastic-vine-leaf giftastic-vine-leaf-1" />
          <span className="giftastic-vine-leaf giftastic-vine-leaf-2" />
          <span className="giftastic-vine-leaf giftastic-vine-leaf-3" />
          <span className="giftastic-vine-bloom giftastic-vine-bloom-1" />
          <span className="giftastic-vine-bloom giftastic-vine-bloom-2" />
          <span className="giftastic-vine-bloom giftastic-vine-bloom-3" />
          <span className="giftastic-vine-bloom giftastic-vine-bloom-4" />
        </span>
      </div>
      <div className="giftastic-floral-frame" aria-hidden="true">
        <span className="giftastic-floral-corner giftastic-floral-corner-tl" />
        <span className="giftastic-floral-corner giftastic-floral-corner-tr" />
        <span className="giftastic-floral-corner giftastic-floral-corner-br" />
        <span className="giftastic-floral-corner giftastic-floral-corner-bl" />
      </div>

      <header className="relative isolate h-[calc(100svh-10rem)] min-h-[480px] max-h-[680px] overflow-hidden bg-primary">
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src={heroImage}
          alt="A curated gift box with flowers and wrapped presents"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(29,12,41,0.82),rgba(29,12,41,0.52)_42%,rgba(29,12,41,0.14))]" />
        <div className="absolute inset-x-0 bottom-0 h-36 bg-[linear-gradient(0deg,rgba(251,249,246,0.96),rgba(251,249,246,0))]" />

        <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-10 pt-20 sm:px-6 lg:px-8 lg:pb-14">
          <div className="max-w-3xl text-white">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur-sm">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Alexandria gift marketplace
            </div>
            <h1 className="font-display-xl text-5xl leading-tight text-white sm:text-6xl lg:text-7xl">
              Giftastic
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/90 sm:text-xl">
              Thoughtful gifts, curated stores, and customizable gift flows for the people you actually care about.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/gift-flow"
                className="giftastic-hover-sheen inline-flex items-center justify-center gap-2 rounded bg-white px-5 py-4 text-sm font-bold text-primary shadow-xl shadow-black/20 transition hover:bg-[#fff7ed]"
              >
                <WandSparkles className="h-4 w-4" aria-hidden="true" />
                Build a gift
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                to="/products"
                className="giftastic-hover-sheen inline-flex items-center justify-center gap-2 rounded border border-white/30 bg-white/10 px-5 py-4 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                <Search className="h-4 w-4" aria-hidden="true" />
                Browse collections
              </Link>
            </div>
          </div>

          <dl className="mt-10 hidden max-w-4xl grid-cols-1 gap-3 sm:grid sm:grid-cols-3">
            {serviceNotes.map((note) => (
              <div key={note.label} className="border-l border-white/30 bg-black/10 px-4 py-3 text-white backdrop-blur-sm">
                <dt className="text-xs font-bold uppercase tracking-[0.16em] text-white/60">{note.label}</dt>
                <dd className="mt-1 text-sm font-semibold">{note.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      <main>
        <section className="border-b border-[#e9ded7] bg-[#fffaf5]">
          <div className="mx-auto grid max-w-7xl gap-4 px-4 py-6 sm:px-6 md:grid-cols-3 lg:px-8">
            {giftModes.map(({ title, description, to, icon: Icon, tone }) => (
              <Link
                key={title}
                to={to}
                className={`giftastic-hover-sheen group flex min-h-32 items-start gap-4 rounded border p-5 transition hover:-translate-y-0.5 hover:shadow-lg ${tone}`}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded bg-white/70">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2 text-base font-bold">
                    {title}
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" />
                  </span>
                  <span className="mt-2 block text-sm leading-6 opacity-80">{description}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <SectionHeading
            eyebrow="Curated journeys"
            title="Gift flows that do the hard part for you"
            copy="Start with a mood or occasion, then shape the final bundle with products from real vendors."
            action={<SectionLink to="/gift-flow" icon={WandSparkles}>View gift flows</SectionLink>}
          />

          {loading ? (
            <div className="grid gap-6 md:grid-cols-2">
              {[1, 2].map((item) => (
                <div key={item} className="h-96 animate-pulse rounded bg-white shadow-sm" />
              ))}
            </div>
          ) : giftFlows.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {giftFlows.slice(0, 2).map((flow) => (
                <GiftFlowSummary
                  key={flow.id}
                  flow={flow}
                  access={buildGiftFlowAccess({ flow, viewer, context: GIFT_FLOW_CONTEXT.PUBLIC })}
                  to={`/gift-flow/${flow.id}`}
                />
              ))}
            </div>
          ) : (
            <div className="rounded border border-dashed border-[#d8c7bd] bg-white px-6 py-12 text-center text-secondary">
              New curated gift experiences are coming soon.
            </div>
          )}
        </section>

        <section className="bg-[#eef8f5] py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Fresh picks"
              title="Trending in Alexandria"
              copy="Easy-to-love products from local stores, ready for birthdays, thank-yous, and last-minute saves."
              action={<SectionLink to="/products" icon={Gift}>Browse all products</SectionLink>}
            />

            {loading ? (
              <ProductGridSkeleton />
            ) : trendingProducts.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {trendingProducts.map((product) => (
                  <div key={product.id} className="giftastic-hover-sheen rounded border border-white/80 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                    <ProductSummary
                      product={product}
                      access={buildProductAccess({ product, viewer, context: PRODUCT_CONTEXT.PUBLIC })}
                      to={`/products/${product.id}`}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded border border-dashed border-[#a8d7cc] bg-white/80 px-6 py-12 text-center text-[#0c6b5b]">
                Products are being refreshed. Check the full catalog for more.
              </div>
            )}
          </div>
        </section>

        {categories.length > 0 && (
          <section className="bg-[#fbf9f6] py-16 sm:py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <SectionHeading
                eyebrow="Shop by category"
                title="Fresh finds, one collection at a time"
                copy="Each section loads as you reach it, so browsing stays quick even when the catalog grows."
                action={<SectionLink to="/products" icon={Gift}>Open catalog</SectionLink>}
              />
              <div className="space-y-12">
                {categories.map((category) => (
                  <LazyCategoryProductSection
                    key={category.id}
                    category={category}
                    viewer={viewer}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="relative isolate overflow-hidden bg-primary">
          <img
            className="absolute inset-0 h-full w-full object-cover opacity-55"
            src={reminderImage}
            alt="A calendar with notes for important dates"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(52,21,71,0.92),rgba(52,21,71,0.74)_48%,rgba(52,21,71,0.34))]" />
          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <div className="max-w-2xl text-white">
              <CalendarDays className="mb-5 h-10 w-10 text-[#f7c978]" aria-hidden="true" />
              <h2 className="font-display-xl text-4xl leading-tight text-white sm:text-5xl">Remember the moment before it becomes urgent</h2>
              <p className="mt-5 text-lg leading-8 text-white/85">
                Save birthdays, anniversaries, and milestones, then come back to gift ideas that fit the occasion.
              </p>
              <Link
                to="/dashboard"
                className="giftastic-hover-sheen mt-8 inline-flex items-center gap-2 rounded bg-[#f7c978] px-5 py-4 text-sm font-bold text-[#341547] shadow-xl shadow-black/20 transition hover:bg-[#ffe1a3]"
              >
                <PackageCheck className="h-4 w-4" aria-hidden="true" />
                Set a reminder
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
