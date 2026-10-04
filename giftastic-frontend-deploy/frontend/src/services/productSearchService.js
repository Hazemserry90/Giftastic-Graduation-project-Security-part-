import api from './api';

export const productSearchService = {
  search: async (searchRequest) => {
    const response = await api.post('/products/search', searchRequest);
    return response.data;
  },

  quickSearch: async (query, page = 0, size = 20) => {
    return productSearchService.search({
      query,
      page,
      size,
      sortBy: 'newest'
    });
  },

  searchWithFilters: async (filters) => {
    return productSearchService.search({
      query: filters.query || null,
      categoryIds: filters.categoryIds || null,
      minPrice: filters.minPrice || null,
      maxPrice: filters.maxPrice || null,
      inStockOnly: filters.inStockOnly || false,
      onSaleOnly: filters.onSaleOnly || false,
      sortBy: filters.sortBy || 'newest',
      page: filters.page || 0,
      size: filters.size || 20
    });
  },

  searchOnSale: async (page = 0, size = 20) => {
    return productSearchService.search({
      onSaleOnly: true,
      sortBy: 'price_desc',
      page,
      size
    });
  }
};

export default productSearchService;
