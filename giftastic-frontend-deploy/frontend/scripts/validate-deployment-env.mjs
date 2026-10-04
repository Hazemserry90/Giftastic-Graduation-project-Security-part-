import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const envFiles = ['.env', '.env.local', '.env.production', '.env.production.local'];
const deploymentEnvKeys = ['CI', 'VERCEL', 'NETLIFY', 'RAILWAY_ENVIRONMENT', 'RENDER', 'CF_PAGES'];

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return {};

  return readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .reduce((env, line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return env;

      const match = trimmed.match(/^([\w.-]+)\s*=\s*(.*)$/);
      if (!match) return env;

      const [, key, rawValue] = match;
      env[key] = rawValue.replace(/^['"]|['"]$/g, '').trim();
      return env;
    }, {});
}

function loadEnv() {
  const fromFiles = envFiles.reduce((env, file) => ({
    ...env,
    ...parseEnvFile(resolve(process.cwd(), file)),
  }), {});

  return {
    ...fromFiles,
    ...process.env,
  };
}

function isDeployment(env) {
  return deploymentEnvKeys.some((key) => Boolean(env[key]));
}

function isLocalhostUrl(url) {
  try {
    const { hostname } = new URL(url);
    return ['localhost', '127.0.0.1', '0.0.0.0', '::1'].includes(hostname);
  } catch {
    return false;
  }
}

function fail(message) {
  console.error(`\nDeployment env check failed: ${message}\n`);
  process.exit(1);
}

function useSameOriginFallback(message) {
  console.warn(`\nDeployment env warning: ${message}`);
  console.warn('Using the same-origin /api/v1 fallback.\n');
  process.exit(0);
}

const env = loadEnv();
const apiBaseUrl = String(env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');
const allowLocalApi = String(env.VITE_ALLOW_LOCAL_API_BASE_URL || '').toLowerCase() === 'true';
const deploymentBuild = isDeployment(env);

if (!apiBaseUrl) {
  if (deploymentBuild) {
    useSameOriginFallback('VITE_API_BASE_URL is not set.');
  }
  fail('set VITE_API_BASE_URL to the backend API URL, including /api/v1.');
}

if (apiBaseUrl === '/api/v1') {
  console.log('Deployment env check passed for the same-origin /api/v1 API.');
  process.exit(0);
}

let parsedApiBaseUrl;
try {
  parsedApiBaseUrl = new URL(apiBaseUrl);
} catch {
  fail(`VITE_API_BASE_URL must be an absolute URL. Received: ${apiBaseUrl}`);
}

if (!['http:', 'https:'].includes(parsedApiBaseUrl.protocol)) {
  fail('VITE_API_BASE_URL must start with http:// or https://.');
}

if (!apiBaseUrl.endsWith('/api/v1')) {
  fail('VITE_API_BASE_URL must include the backend API prefix and end with /api/v1.');
}

if (deploymentBuild && isLocalhostUrl(apiBaseUrl)) {
  useSameOriginFallback('VITE_API_BASE_URL points at localhost, which browsers cannot use from Vercel.');
}

if (deploymentBuild && parsedApiBaseUrl.protocol !== 'https:') {
  fail('deployment builds must use an https backend URL.');
}

if (isLocalhostUrl(apiBaseUrl) && !allowLocalApi) {
  fail('deployment builds cannot use localhost. Set VITE_API_BASE_URL to the Railway backend URL.');
}

const checkLabel = deploymentBuild ? 'Deployment' : 'Build';
console.log(`${checkLabel} env check passed for ${apiBaseUrl}`);
