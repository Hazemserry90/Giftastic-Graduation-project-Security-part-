export const selectRecommendationsData = (projection) => projection?.projectionType === 'recommendations' ? projection.data : null;
