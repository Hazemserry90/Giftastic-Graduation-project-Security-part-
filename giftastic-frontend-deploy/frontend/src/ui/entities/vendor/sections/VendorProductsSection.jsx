import VendorSection from './VendorSection';
import { ProductSummary } from '../../product';

export default function VendorProductsSection({ products = [], accessFor }) {
  return (
    <VendorSection title="Products Preview" icon="inventory_2">
      {products.length === 0 ? (
        <p className="text-sm italic text-on-surface-variant">No products are currently listed.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.slice(0, 8).map((product) => (
            <ProductSummary
              key={product.id}
              product={product}
              access={accessFor?.(product)}
              to={`/products/${product.id}`}
            />
          ))}
        </div>
      )}
    </VendorSection>
  );
}
