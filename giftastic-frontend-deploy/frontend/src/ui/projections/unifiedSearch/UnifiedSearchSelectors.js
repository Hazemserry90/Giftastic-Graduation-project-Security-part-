export const selectUnifiedSearchData = (projection) => projection?.projectionType === 'unifiedSearch' ? projection.data : null;
