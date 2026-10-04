export const selectProductSearchData = (projection) => projection?.projectionType === 'productSearch' ? projection.data : null;
