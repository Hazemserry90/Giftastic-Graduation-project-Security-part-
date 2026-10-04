const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN;

if (!BACKEND_ORIGIN) {
  throw new Error('BACKEND_ORIGIN must be configured in the deployment environment');
}
const STRIPPED_REQUEST_HEADERS = [
  'forwarded',
  'host',
  'origin',
  'referer',
  'x-forwarded-host',
  'x-forwarded-proto',
  'x-real-ip',
];

export const config = { runtime: 'edge' };

export default async function handler(request) {
  const incomingUrl = new URL(request.url);
  const path = incomingUrl.searchParams.get('path') || '';
  incomingUrl.searchParams.delete('path');

  const targetUrl = new URL(`/api/v1/${path.replace(/^\/+/, '')}`, BACKEND_ORIGIN);
  targetUrl.search = incomingUrl.search;

  const headers = new Headers(request.headers);
  STRIPPED_REQUEST_HEADERS.forEach((header) => headers.delete(header));

  const init = {
    method: request.method,
    headers,
    redirect: 'manual',
  };

  if (!['GET', 'HEAD'].includes(request.method)) {
    init.body = request.body;
  }

  return fetch(targetUrl, init);
}
