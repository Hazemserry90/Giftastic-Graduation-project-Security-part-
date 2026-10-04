import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { productService } from '../services/productService';
import { useAuthStore } from '../store/useAuthStore';
import VendorSidebar from '../components/VendorSidebar';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import commissionService from '../services/commissionService';
import VendorPricingChoice, { PRODUCT_PRICING_MODE } from '../ui/entities/product/VendorPricingChoice';
import { adaptEntityFromNamedSource } from '../ui/entities/namedAdapters';
import {
  createProductCreateEditDraft,
  mapProductCreateEditPayload,
  defaultProductDetails,
} from '../ui/commands/productCreateEdit';

const defaultDetails = defaultProductDetails;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const createImagePreview = (file) => ({
  id: `${file.name}-${file.size}-${file.lastModified}`,
  file,
  previewUrl: URL.createObjectURL(file),
});

export default function UploadProduct() {
  const navigate = useNavigate();
  const viewer = useAuthStore((state) => state.viewer);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [commissionRate, setCommissionRate] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const imageFilesRef = useRef([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    pricingMode: PRODUCT_PRICING_MODE.CUSTOMER_PRICE,
    stockQuantity: '',
    categoryIds: [],
    details: defaultDetails,
    images: []
  });

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await productService.getCategories();
        setCategories((data || []).map((category) =>
          adaptEntityFromNamedSource('adaptCategoryListRecord', category)));
      } catch (error) {
        console.error('Failed to load categories', error);
      }
    };
    loadCategories();
  }, []);

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
    const availableSlots = 6 - imageFiles.length;
    const accepted = [];
    for (const file of selected.slice(0, availableSlots)) {
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

  const removeSelectedImage = (id) => {
    setImageFiles((current) => {
      const target = current.find((image) => image.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return current.filter((image) => image.id !== id);
    });
  };

  const parseNumber = (value) => {
    if (value === '' || value === null || value === undefined) {
      return null;
    }

    return Number(value);
  };

  const cleanDetails = () => {
    const numericKeys = new Set([
      'giftWrapPrice',
      'engravingPrice',
      'customMessagePrice',
      'engravingMaxLength',
      'maxMessageLength',
      'minDeliveryDays',
      'maxDeliveryDays',
      'shelfLifeDays',
      'itemCount',
      'fulfillmentTime'
    ]);

    return Object.fromEntries(
      Object.entries(formData.details).map(([key, value]) => {
        if (numericKeys.has(key)) {
          return [key, parseNumber(value)];
        }

        if (typeof value === 'string' && value.trim() === '') {
          return [key, null];
        }

        return [key, value];
      })
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!viewer.supplierId) {
      toast.error('Vendor profile is not active yet. Please complete vendor activation first.');
      return;
    }

    if (formData.categoryIds.length === 0) {
      toast.error('Please select at least one category.');
      return;
    }

    setLoading(true);

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

      const product = await productService.createProduct(mapped.payload);
      for (const image of imageFiles) {
        await productService.uploadProductImage(product.id, image.file);
      }
      await productService.submitForApproval(product.id, viewer.supplierId);
      toast.success('Product submitted for review!');
      navigate('/vendor/products');
    } catch (error) {
      toast.error('Failed to submit product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <div className="flex min-w-0 flex-col md:flex-row">
        <VendorSidebar />

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-12">
          <div className="max-w-4xl mx-auto">
          <h1 className="font-headline-lg text-headline-lg text-primary mb-8">Upload New Product</h1>

          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-plum p-8 space-y-8">
            <section className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-headline-md text-headline-md text-primary">Core product info</h2>
                <span className="text-sm text-secondary">Required for catalog and vendor inventory</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-label-md text-on-surface-variant mb-2">Product Name</label>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    placeholder="e.g., Artisan Chocolate Box"
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
                    className="w-full px-4 py-3 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    placeholder="0.00"
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
                    className="w-full px-4 py-3 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    placeholder="Available units"
                  />
                </div>
              </div>

              <VendorPricingChoice amount={formData.price} rate={commissionRate}
                value={formData.pricingMode}
                onChange={(pricingMode) => setFormData((current) => ({ ...current, pricingMode }))} />

              <div>
                <label className="block font-label-md text-on-surface-variant mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows="4"
                  className="w-full px-4 py-3 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  placeholder="Describe your product..."
                />
              </div>

              <div>
                <label className="block font-label-md text-on-surface-variant mb-2">Categories</label>
                <select
                  name="categoryIds"
                  multiple
                  value={formData.categoryIds}
                  onChange={handleChange}
                  required
                  className="w-full min-h-40 px-4 py-3 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-secondary mt-2">Hold Ctrl or Cmd to select multiple categories.</p>
              </div>
            </section>

            <section className="space-y-4 pt-6 border-t border-outline-variant">
              <h2 className="font-headline-md text-headline-md text-primary">Product images</h2>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {imageFiles.map((image, index) => (
                  <div key={image.id} className="overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest">
                    <div className="aspect-square bg-stone-100">
                      <img src={image.previewUrl} alt={image.file.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex items-center justify-between gap-2 p-3">
                      <span className="truncate text-xs text-on-surface-variant">{index === 0 ? 'Primary' : image.file.name}</span>
                      <button type="button" onClick={() => removeSelectedImage(image.id)} className="text-error">
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-outline px-4 py-2 font-semibold text-on-surface hover:bg-surface-container">
                <span className="material-symbols-outlined text-base">upload</span>
                Select images
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleImageFiles} />
              </label>
              <p className="text-xs text-secondary">JPG, PNG, or WebP. Up to 6 images, 10 MB each.</p>
            </section>

            <section className="space-y-4 pt-6 border-t border-outline-variant">
              <h2 className="font-headline-md text-headline-md text-primary">Product behavior</h2>
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
                  <label key={key} className="flex items-center gap-3 rounded-lg border border-outline-variant px-4 py-3 text-sm text-on-surface-variant">
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

            <section className="space-y-4 pt-6 border-t border-outline-variant">
              <h2 className="font-headline-md text-headline-md text-primary">Pricing and personalization</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <DetailField label="Gift wrap price" name="giftWrapPrice" value={formData.details.giftWrapPrice} onChange={handleChange} type="number" step="0.01" />
                <DetailField label="Engraving price" name="engravingPrice" value={formData.details.engravingPrice} onChange={handleChange} type="number" step="0.01" />
                <DetailField label="Custom message price" name="customMessagePrice" value={formData.details.customMessagePrice} onChange={handleChange} type="number" step="0.01" />
                <DetailField label="Engraving max length" name="engravingMaxLength" value={formData.details.engravingMaxLength} onChange={handleChange} type="number" />
                <DetailField label="Message max length" name="maxMessageLength" value={formData.details.maxMessageLength} onChange={handleChange} type="number" />
                <DetailField label="Video URL" name="videoUrl" value={formData.details.videoUrl} onChange={handleChange} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DetailField label="Available colors" name="availableColors" value={formData.details.availableColors} onChange={handleChange} placeholder="Red, gold, ivory" />
                <DetailField label="Available sizes" name="availableSizes" value={formData.details.availableSizes} onChange={handleChange} placeholder="Small, medium, large" />
              </div>
            </section>

            <section className="space-y-4 pt-6 border-t border-outline-variant">
              <h2 className="font-headline-md text-headline-md text-primary">Delivery and fulfillment</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <DetailField label="Min delivery days" name="minDeliveryDays" value={formData.details.minDeliveryDays} onChange={handleChange} type="number" />
                <DetailField label="Max delivery days" name="maxDeliveryDays" value={formData.details.maxDeliveryDays} onChange={handleChange} type="number" />
                <DetailField label="Shelf life days" name="shelfLifeDays" value={formData.details.shelfLifeDays} onChange={handleChange} type="number" />
                <DetailField label="Fulfillment time" name="fulfillmentTime" value={formData.details.fulfillmentTime} onChange={handleChange} type="number" />
                <DetailField label="Vendor SKU" name="vendorSku" value={formData.details.vendorSku} onChange={handleChange} />
                <DetailField label="Slug" name="slug" value={formData.details.slug} onChange={handleChange} />
              </div>
            </section>

            <section className="space-y-4 pt-6 border-t border-outline-variant">
              <h2 className="font-headline-md text-headline-md text-primary">Marketing and recipient targeting</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DetailField label="Tags" name="tags" value={formData.details.tags} onChange={handleChange} placeholder="birthday, luxury, romantic" />
                <DetailField label="Seasonal availability" name="seasonalAvailability" value={formData.details.seasonalAvailability} onChange={handleChange} placeholder="Ramadan, Eid, Wedding season" />
                <DetailField label="Occasion" name="occasion" value={formData.details.occasion} onChange={handleChange} placeholder="Birthday, anniversary" />
                <DetailField label="Recipient type" name="recipientType" value={formData.details.recipientType} onChange={handleChange} placeholder="Friend, partner, colleague" />
                <DetailField label="Age group" name="ageGroup" value={formData.details.ageGroup} onChange={handleChange} placeholder="Adults, teens, children" />
                <DetailField label="Meta title" name="metaTitle" value={formData.details.metaTitle} onChange={handleChange} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DetailField label="Meta description" name="metaDescription" value={formData.details.metaDescription} onChange={handleChange} />
                <DetailField label="Vendor notes" name="vendorNotes" value={formData.details.vendorNotes} onChange={handleChange} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <DetailField label="Gender" name="gender" value={formData.details.gender} onChange={handleChange} as="select">
                  <option value="UNISEX">Unisex</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="CHILD">Child</option>
                </DetailField>
              </div>
            </section>

            <div className="flex gap-4 pt-6 border-t border-outline-variant">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary text-on-primary py-4 rounded-lg font-label-md hover:bg-primary-container active:scale-98 transition-all disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Product for Review'}
              </button>
              <Link
                to="/vendor/products"
                className="px-8 py-4 border border-outline text-on-surface rounded-lg font-label-md hover:bg-surface-container transition-all text-center"
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
          className="w-full px-4 py-3 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
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
          className="w-full px-4 py-3 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
          placeholder={placeholder}
        />
      )}
    </div>
  );
}
