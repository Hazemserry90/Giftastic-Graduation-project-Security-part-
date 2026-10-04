export const getDeliveryZoneLabel = (zone) =>
  [zone?.zoneName, zone?.description].filter(Boolean).join(' - ');
