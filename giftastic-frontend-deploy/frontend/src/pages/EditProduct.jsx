import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import commissionService from '../services/commissionService';
import VendorPricingChoice, { PRODUCT_PRICING_MODE } from '../ui/entities/product/VendorPricingChoice';
import VendorSidebar from '../components/VendorSidebar';
import { productService } from '../services/productService';
import { useAuthStore } from '../store/useAuthStore';
import { defaultProductDetails } from '../ui/commands/productCreateEdit';
import { adaptEntityFromNamedSource } from '../ui/entities/namedAdapters';
import {
  createProductCreateEditDraft,
  mapProductCreateEditPayload,
} from '../ui/commands/productCreateEdit';

const defaultDetails = defaultProductDetails;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const createImagePreview = (file) => ({
  id: `${file.name}-${file.size}-${file.lastModified}`,
  file,
  previewUrl: URL.createObjectURL(file),
});

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const viewer = useAuthStore((state) => state.viewer);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState(null);
  const [commissionRate, setCommissionRate] = useState(null);
  const [productImages, setProductImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const imageFilesRef = useRef([]);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rawProduct, allCategories] = await Promise.all([
        productService.getProductById(id),
        productService.getCategories()
      ]);
      const product = adaptEntityFromNamedSource('adaptProductDomain', rawProduct);
      setCategories((allCategories || []).map((category) =>
        adaptEntityFromNamedSource('adaptCategoryListRecord', category)));
      
      // Map domain product to form data
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price,
        pricingMode: product.pricingMode || PRODUCT_PRICING_MODE.CUSTOMER_PRICE,
        stockQuantity: product.stockQuantity ?? '',
        categoryIds: (product.categories || []).map((category) => category.id),
        details: { ...defaultDetails, ...(product.details || {}) },
        images: []
      });
      setProductImages(product.images || []);
    } catch (error) {
      console.error('Failed to load product', error);
      toast.error('Product not found');
      navigate('/vendor/products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewer.supplierId) commissionService.getCurrentRate(viewer.supplierId)
      .then((response) => setCommissionRate(response.rate)).catch(() => setCommissionRate(null));
  }, [viewer.supplierId]);

  useEffect(() => {
    imageFilesRef.current = imageFiles;
  }, [imageFiles]);

  useEffect(() => () => {
    imageFilesRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl));
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'categoryIds') {
      const nextCategoryIds = Array.from(e.target.selectedOptions).map((option) => option.value);
      setFormData({ ...formData, categoryIds: nextCategoryIds });
      return;
    }

    if (name in formData.details) {
      setFormData({
        ...formData,
        details: {
          ...formData.details,
          [name]: type === 'checkbox' ? checked : value
        }
      });
      return;
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleImageFiles = (event) => {
    const selected = Array.from(event.target.files || []);
    const availableSlots = 6 - productImages.length - imageFiles.length;
    const accepted = [];
    for (const file of selected.slice(0, Math.max(availableSlots, 0))) {
      if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
        toast.error(`${file.name} is not a supported image type.`);
        continue;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        toast.error(`${file.name} is larger than 10 MB.`);
        continue;
      }
      accepted.push(createImagePreview(file));
    }
    if (selected.length > availableSlots) {
      toast.error('A product can have at most 6 images.');
    }
    setImageFiles((current) => [...current, ...accepted]);
    event.target.value = '';
  };

  const removeSelectedImage = (imageId) => {
    setImageFiles((current) => {
      const target = current.find((image) => image.id === imageId);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return current.filter((image) => image.id !== imageId);
    });
  };

  const uploadSelectedImages = async () => {
    if (imageFiles.length === 0) return;
    const uploaded = [];
    for (const image of imageFiles) {
      uploaded.push(await productService.uploadProductImage(id, image.file));
      URL.revokeObjectURL(image.previewUrl);
    }
    setProductImages((current) => [...current, ...uploaded]);
    setImageFiles([]);
  };

  const deleteExistingImage = async (imageId) => {
    await productService.deleteProductImage(id, imageId);
    setProductImages((current) => current.filter((image) => image.id !== imageId));
    toast.success('Image deleted.');
  };

  const setPrimaryImage = async (imageId) => {
    await productService.setPrimaryProductImage(id, imageId);
    setProductImages((current) => current.map((image) => ({ ...image, primary: image.id === imageId })));
  };

  const parseNumber = (value) => {
    if (value === '' || value === null || value === undefined) return null;
    return Number(value);
  };

  const cleanDetails = () => {
    const numericKeys = new Set([
      'giftWrapPrice', 'engravingPrice', 'customMessagePrice',
      'engravingMaxLength', 'maxMessageLength', 'minDeliveryDays',
      'maxDeliveryDays', 'shelfLifeDays', 'itemCount', 'fulfillmentTime'
    ]);

    return Object.fromEntries(
      Object.entries(formData.details).map(([key, value]) => {
        if (numericKeys.has(key)) return [key, parseNumber(value)];
        if (typeof value === 'string' && value.trim() === '') return [key, null];
        return [key, value];
      })
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!viewer.supplierId) {
      toast.error('Vendor profile is not active yet.');
      return;
    }
    setSaving(true);

    try {
      const mapped = mapProductCreateEditPayload(createProductCreateEditDraft({
        supplierId: viewer.supplierId,
        name: formData.name,
        description: formData.description,
        price: formData.price,
        pricingMode: formData.pricingMode,
        stockQuantity: parseNumber(formData.stockQuantity),
        categoryIds: formData.categoryIds,
        details: cleanDetails(),
        images: []
      }));
      if (!mapped.ok) throw new Error(Object.values(mapped.errors)[0]);

      const requestedStockQuantity = mapped.payload.stockQuantity;
      const updatedResponse = await productService.updateProduct(id, mapped.payload);
      const updatedProduct = adaptEntityFromNamedSource('adaptProductDomain', updatedResponse);
      setFormData((current) => ({
        ...current,
        stockQuantity: updatedProduct.stockQuantity ?? current.stockQuantity
      }));
      if (updatedProduct.stockQuantity !== requestedStockQuantity) {
        const persistenceError = new Error('The server did not persist the updated stock quantity.');
        persistenceError.code = 'STOCK_NOT_PERSISTED';
        throw persistenceError;
      }
      await uploadSelectedImages();
      toast.success('Product updated successfully!');
    } catch (error) {
      console.error('Failed to update product', error);
      toast.error(error?.code === 'STOCK_NOT_PERSISTED'
        ? 'Product details were saved, but the server did not update the stock quantity.'
        : 'Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !formData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <div className="flex min-w-0 flex-col md:flex-row">
        <VendorSidebar />
        
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-12">
          <div className="max-w-4xl mx-auto">
            <header className="mb-12">
              <Link to="/vendor/products" className="text-secondary font-label-sm flex items-center gap-1 hover:underline mb-4">
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                Back to Inventory
              </Link>
              <h1 className="font-headline-lg text-headline-lg text-primary">Edit Product</h1>
              <p className="text-on-surface-variant">Update details for "{formData.name}"</p>
            </header>

            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-plum p-8 space-y-12">
              <section className="space-y-6">
                <h2 className="font-headline-md text-primary border-b border-surface-variant/10 pb-4">Essential Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block font-label-md text-on-surface-variant mb-2">Product Name</label>
                    <input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-surface-variant/30 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block font-label-md text-on-surface-variant mb-2">Price (EGP)</label>
                    <input
                      name="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-surface-variant/30 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block font-label-md text-on-surface-variant mb-2">Stock Quantity</label>
                    <input
                      name="stockQuantity"
                      type="number"
                      min="0"
                      value={formData.stockQuantity}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-surface-variant/30 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <VendorPricingChoice amount={formData.price} rate={commissionRate}
                      value={formData.pricingMode}
                      onChange={(pricingMode) => setFormData((current) => ({ ...current, pricingMode }))} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block font-label-md text-on-surface-variant mb-2">Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      required
                      rows="4"
                      className="w-full px-4 py-3 border border-surface-variant/30 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block font-label-md text-on-surface-variant mb-2">Categories</label>
                    <select
                      name="categoryIds"
                      multiple
                      value={formData.categoryIds}
                      onChange={handleChange}
                      required
                      className="w-full min-h-40 px-4 py-3 border border-surface-variant/30 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>

              <section className="space-y-6">
                <h2 className="font-headline-md text-primary border-b border-surface-variant/10 pb-4">Product Images</h2>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  {productImages.map((image) => (
                    <div key={image.id} className="overflow-hidden rounded-xl border border-stone-200 bg-stone-50">
                      <div className="aspect-square bg-stone-100">
                        <img src={image.url} alt={image.filename || formData.name} className="h-full w-full object-cover" />
                      </div>
                      <div className="flex items-center justify-between gap-2 p-3">
                        <button type="button" onClick={() => setPrimaryImage(image.id)} className="text-xs font-bold text-primary">
                          {image.primary ? 'Primary' : 'Set primary'}
                        </button>
                        <button type="button" onClick={() => deleteExistingImage(image.id)} className="text-error">
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                  {imageFiles.map((image) => (
                    <div key={image.id} className="overflow-hidden rounded-xl border border-primary/30 bg-primary/5">
                      <div className="aspect-square bg-stone-100">
                        <img src={image.previewUrl} alt={image.file.name} className="h-full w-full object-cover" />
                      </div>
                      <div className="flex items-center justify-between gap-2 p-3">
                        <span className="truncate text-xs text-on-surface-variant">Pending</span>
                        <button type="button" onClick={() => removeSelectedImage(image.id)} className="text-error">
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-primary px-4 py-2 font-bold text-primary hover:bg-primary/5">
                  <span className="material-symbols-outlined text-base">upload</span>
                  Select images
                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleImageFiles} />
                </label>
                <p className="text-xs text-on-surface-variant">JPG, PNG, or WebP. Up to 6 images, 10 MB each. Pending images upload when the product is saved.</p>
              </section>

              <section className="space-y-6">
                <h2 className="font-headline-md text-primary border-b border-surface-variant/10 pb-4">Product Behavior</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    ['allowsGiftWrap', 'Allows gift wrap'],
                    ['isGiftWrapped', 'Pre-wrapped'],
                    ['includesGiftBox', 'Includes gift box'],
                    ['includesRibbon', 'Includes ribbon'],
                    ['allowsGiftReceipt', 'Gift receipt allowed'],
                    ['requiresDeliveryDate', 'Requires delivery date'],
                    ['allowsScheduledDelivery', 'Scheduled delivery'],
                    ['isPerishable', 'Perishable item'],
                    ['requiresRecipientInfo', 'Requires recipient info'],
                    ['requiresRecipientName', 'Recipient name required'],
                    ['requiresRecipientEmail', 'Recipient email required'],
                    ['requiresRecipientPhone', 'Recipient phone required'],
                    ['requiresRecipientAddress', 'Recipient address required'],
                    ['allowsAnonymousGift', 'Anonymous gifting allowed'],
                    ['isContainer', 'Gift container'],
                    ['containsLetter', 'Contains letter'],
                    ['containsCard', 'Contains card'],
                    ['containsFlowers', 'Contains flowers'],
                    ['containsChocolates', 'Contains chocolates'],
                    ['containsFood', 'Contains food'],
                    ['isFeatured', 'Featured product'],
                    ['isBestseller', 'Bestseller'],
                    ['isNewArrival', 'New arrival'],
                    ['handmade', 'Handmade'],
                    ['madeToOrder', 'Made to order'],
                    ['customizable', 'Customizable']
                  ].map(([key, label]) => (
                    <label key={key} className="flex items-center gap-3 rounded-xl border border-stone-100 px-4 py-3 text-sm text-on-surface-variant bg-stone-50">
                      <input
                        type="checkbox"
                        name={key}
                        checked={formData.details[key]}
                        onChange={handleChange}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </section>

              <section className="space-y-6">
                <h2 className="font-headline-md text-primary border-b border-surface-variant/10 pb-4">Personalization & Marketing</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <DetailField label="Gift wrap price" name="giftWrapPrice" value={formData.details.giftWrapPrice} onChange={handleChange} type="number" step="0.01" />
                  <DetailField label="Engraving price" name="engravingPrice" value={formData.details.engravingPrice} onChange={handleChange} type="number" step="0.01" />
                  <DetailField label="Custom message price" name="customMessagePrice" value={formData.details.customMessagePrice} onChange={handleChange} type="number" step="0.01" />
                  <DetailField label="Engraving max length" name="engravingMaxLength" value={formData.details.engravingMaxLength} onChange={handleChange} type="number" />
                  <DetailField label="Message max length" name="maxMessageLength" value={formData.details.maxMessageLength} onChange={handleChange} type="number" />
                  <DetailField label="Video URL" name="videoUrl" value={formData.details.videoUrl} onChange={handleChange} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DetailField label="Tags" name="tags" value={formData.details.tags} onChange={handleChange} placeholder="birthday, luxury, romantic" />
                  <DetailField label="Occasion" name="occasion" value={formData.details.occasion} onChange={handleChange} placeholder="Birthday, anniversary" />
                </div>
              </section>

              <div className="flex gap-4 pt-6 border-t border-surface-variant/10">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-primary text-on-primary py-4 rounded-xl font-bold hover:shadow-lg active:scale-95 transition-all disabled:opacity-50"
                >
                  {saving ? 'Saving Changes...' : 'Save Product'}
                </button>
                <Link
                  to="/vendor/products"
                  className="px-12 py-4 border border-surface-variant/30 text-primary rounded-xl font-bold hover:bg-stone-50 transition-all text-center"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}

function DetailField({ label, name, value, onChange, type = 'text', step, placeholder, as = 'input', children }) {
  return (
    <div>
      <label className="block font-label-md text-on-surface-variant mb-2">{label}</label>
      {as === 'select' ? (
        <select
          name={name}
          value={value}
          onChange={onChange}
          className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
        >
          {children}
        </select>
      ) : (
        <input
          name={name}
          type={type}
          step={step}
          value={value}
          onChange={onChange}
          className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
          placeholder={placeholder}
        />
      )}
    </div>
  );
}
