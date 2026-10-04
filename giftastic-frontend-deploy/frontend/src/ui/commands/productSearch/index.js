export function mapProductSearchFilters(filters = {}) {
  return {
    ...filters,
    minPrice: filters.minPrice === '' ? null : filters.minPrice,
    maxPrice: filters.maxPrice === '' ? null : filters.maxPrice,
  };
}
