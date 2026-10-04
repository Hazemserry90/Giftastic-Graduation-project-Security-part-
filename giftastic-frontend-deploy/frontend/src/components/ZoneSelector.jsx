import { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import deliveryService from '../services/deliveryService';
import {
  buildDeliveryZoneAccess,
  getDeliveryZoneLabel,
  DELIVERY_ZONE_CONTEXT,
} from '../ui/entities/deliveryZone';
import { adaptEntityFromNamedSource } from '../ui/entities/namedAdapters';
import { formatDeliveryCost } from '../ui/entities/vendorDeliveryPricing';

const ZoneSelector = ({ vendorId, onZoneSelect, selectedZoneId }) => {
  const [zones, setZones] = useState([]);
  const [deliveryCost, setDeliveryCost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadZones();
  }, []);

  useEffect(() => {
    if (selectedZoneId && vendorId) {
      loadDeliveryCost();
    }
  }, [selectedZoneId, vendorId]);

  const loadZones = async () => {
    try {
      const data = await deliveryService.getAllZones();
      setZones(data
        .map((zone) => adaptEntityFromNamedSource('adaptDeliveryZoneResponse', zone))
        .filter((zone) => buildDeliveryZoneAccess({
          zone,
          context: DELIVERY_ZONE_CONTEXT.CHECKOUT,
        }).canRead));
    } catch (error) {
      console.error('Failed to load zones:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDeliveryCost = async () => {
    try {
      const cost = await deliveryService.getDeliveryCost(vendorId, selectedZoneId);
      setDeliveryCost(cost);
    } catch (error) {
      console.error('Failed to load delivery cost:', error);
      setDeliveryCost(null);
    }
  };

  const handleZoneChange = (e) => {
    const zoneId = e.target.value;
    if (onZoneSelect) {
      onZoneSelect(zoneId);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-12 bg-surface-container rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <select
        value={selectedZoneId || ''}
        onChange={handleZoneChange}
        className="w-full bg-transparent border border-outline-variant rounded-lg px-4 py-3 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all hover:border-primary/50"
        required
      >
        <option value="">Select your area in Alexandria</option>
        {zones.map((zone) => (
          <option key={zone.id} value={zone.id}>
            {getDeliveryZoneLabel(zone)}
          </option>
        ))}
      </select>

      {deliveryCost !== null && selectedZoneId && vendorId && (
        <div className="bg-secondary-container/10 border border-secondary/20 rounded-lg p-3">
          <p className="text-sm text-on-surface">
            <strong>Delivery Cost:</strong> {formatDeliveryCost(deliveryCost)} for {zones.find(z => z.id === selectedZoneId)?.zoneName}
          </p>
        </div>
      )}
    </div>
  );
};

export default ZoneSelector;
