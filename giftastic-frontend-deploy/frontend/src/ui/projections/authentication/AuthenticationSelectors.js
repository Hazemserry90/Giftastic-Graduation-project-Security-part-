export const selectAuthenticationData = (projection) => projection?.projectionType === 'authentication' ? projection.data : null;
