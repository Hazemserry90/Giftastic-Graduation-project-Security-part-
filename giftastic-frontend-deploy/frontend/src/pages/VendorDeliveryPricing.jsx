import { useState, useEffect } from 'react';
import { MapPin, Save, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import VendorSidebar from '../components/VendorSidebar';
import deliveryService from '../services/deliveryService';
import { useAuthStore } from '../store/useAuthStore';
import { buildDeliveryZoneAccess, DELIVERY_ZONE_CONTEXT } from '../ui/entities/deliveryZone';
import {
  adaptVendorDeliveryPricing,
  buildVendorDeliveryPricingAccess,
  buildVendorDeliveryPricingCollectionActions,
  hasDeliveryPrice,
  VendorDeliveryPricingEditor,
} from '../ui/entities/vendorDeliveryPricing';
import { adaptEntityFromNamedSource } from '../ui/entities/namedAdapters';
import { mapVendorDeliveryPricingPayload } from '../ui/commands/vendorDeliveryPricing';

const VendorDeliveryPricing = () => {
  const viewer = useAuthStore((state) => state.viewer);
  const supplierId = viewer.supplierId;
  const [zones, setZones] = useState([]);
  const [pricing, setPricing] = useState({});
  const [pricingModels, setPricingModels] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (supplierId) loadData();
  }, [supplierId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [zonesData, pricingData] = await Promise.all([
        deliveryService.getAllZones(),
        deliveryService.getVendorPricing(supplierId)
      ]);

      const zoneModels = zonesData
        .map((zone) => adaptEntityFromNamedSource('adaptDeliveryZoneResponse', zone))
        .filter((zone) => buildDeliveryZoneAccess({
          zone,
          context: DELIVERY_ZONE_CONTEXT.MANAGEMENT,
        }).canRead);
      setZones(zoneModels);

      // Convert pricing array to object for easier management
      const pricingMap = {};
      const modelMap = {};
      pricingData.forEach((value) => {
        const model = adaptEntityFromNamedSource('adaptVendorDeliveryPricingResponse', value);
        if (buildVendorDeliveryPricingAccess({ pricing: model, viewer }).canRead) {
          pricingMap[model.zoneId] = model.deliveryCost;
          modelMap[model.zoneId] = model;
        }
      });
      zoneModels.forEach((zone) => {
        if (!modelMap[zone.id]) {
          modelMap[zone.id] = adaptVendorDeliveryPricing({
            vendorId: supplierId,
            zoneId: zone.id,
            zoneName: zone.zoneName,
          }, { source: 'vendor-delivery-pricing-draft', complete: false });
        }
      });
      setPricing(pricingMap);
      setPricingModels(modelMap);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load delivery zones');
    } finally {
      setLoading(false);
    }
  };

  const handlePriceChange = (zoneId, value) => {
    setPricing(prev => ({
      ...prev,
      [zoneId]: value
    }));
  };

  const handleSave = async () => {
    // Validate all zones have pricing
    const missingZones = zones.filter((zone) => !hasDeliveryPrice(pricing, zone.id));
    
    if (missingZones.length > 0) {
      toast.error(`Please set pricing for all zones. Missing: ${missingZones.length} zones`);
      return;
    }

    // Convert to numbers and validate
    const mapped = mapVendorDeliveryPricingPayload(pricing);
    if (!mapped.ok) {
      toast.error('All prices must be valid positive numbers');
      return;
    }

    try {
      setSaving(true);
      const updated = await deliveryService.updateVendorPricing(supplierId, mapped.payload);
      const models = (updated || []).map((value) =>
        adaptEntityFromNamedSource('adaptVendorDeliveryPricingResponse', value));
      if (models.length > 0) {
        setPricing(Object.fromEntries(models.map((model) => [model.zoneId, model.deliveryCost])));
        setPricingModels(Object.fromEntries(models.map((model) => [model.zoneId, model])));
      } else {
        await loadData();
      }
      toast.success('Delivery pricing updated successfully!');
    } catch (error) {
      console.error('Failed to save pricing:', error);
      toast.error('Failed to save delivery pricing');
    } finally {
      setSaving(false);
    }
  };

  const allZonesSet = zones.every((zone) => hasDeliveryPrice(pricing, zone.id));
  const pricingCollection = Object.values(pricingModels);
  const saveAction = buildVendorDeliveryPricingCollectionActions({
    pricings: pricingCollection,
    accessFor: (model) => buildVendorDeliveryPricingAccess({ pricing: model, viewer }),
    handlers: { updateAll: handleSave },
  }).find((action) => action.key === 'updateAll');

  return (
    <div className="min-h-screen bg-[#fbf9f6] flex flex-col">
      <Navbar />
      
      <div className="flex min-w-0 flex-1 flex-col md:flex-row">
        <VendorSidebar />
        
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="font-noto-serif text-4xl font-bold text-[#341547] mb-2">
                Delivery Pricing
              </h1>
              <p className="text-[#4b444d] font-manrope">
                Set your delivery costs for each area in Alexandria
              </p>
            </div>

            {!allZonesSet && (
              <div className="mb-6 bg-[#fff4e5] border border-[#8b5a00]/20 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-[#8b5a00] flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-plus-jakarta font-semibold text-[#8b5a00] mb-1">
                    Action Required
                  </p>
                  <p className="text-sm text-[#8b5a00] font-manrope">
                    You must set delivery pricing for all zones before customers can place orders from your store.
                  </p>
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#341547]"></div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(52,21,71,0.08)] overflow-hidden">
                <div className="p-6 border-b border-[#e4e2df]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#f4d9ff] flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-[#341547]" />
                      </div>
                      <div>
                        <h2 className="font-noto-serif text-xl font-semibold text-[#341547]">
                          Alexandria Zones
                        </h2>
                        <p className="text-sm text-[#4b444d] font-manrope">
                          {zones.length} delivery zones
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={saveAction?.onSelect}
                      disabled={saving || !saveAction}
                      className="bg-[#341547] text-white py-2 px-6 rounded-lg font-plus-jakarta font-semibold hover:bg-[#4b2c5e] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Saving...' : 'Save All'}
                    </button>
                  </div>
                </div>

                <div className="divide-y divide-[#e4e2df]">
                  {zones.map((zone) => {
                    const pricingModel = pricingModels[zone.id];
                    return (
                      <VendorDeliveryPricingEditor
                        key={zone.id}
                        zone={zone}
                        pricing={pricingModel}
                        access={buildVendorDeliveryPricingAccess({
                          pricing: pricingModel,
                          viewer,
                        })}
                        value={hasDeliveryPrice(pricing, zone.id) ? pricing[zone.id] : ''}
                        onChange={handlePriceChange}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default VendorDeliveryPricing;
