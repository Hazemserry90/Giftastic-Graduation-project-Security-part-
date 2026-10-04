export const getFavoriteTarget = (favorite) => favorite?.productId
  ? { type: 'product', id: favorite.productId }
  : favorite?.flowId ? { type: 'giftFlow', id: favorite.flowId } : null;
export const isValidFavorite = (favorite) => Boolean(favorite?.productId) !== Boolean(favorite?.flowId);
