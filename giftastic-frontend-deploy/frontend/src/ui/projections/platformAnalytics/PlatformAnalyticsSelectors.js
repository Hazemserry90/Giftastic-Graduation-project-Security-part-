export const selectPlatformAnalyticsData = (projection) => projection?.projectionType === 'platformAnalytics' ? projection.data : null;
