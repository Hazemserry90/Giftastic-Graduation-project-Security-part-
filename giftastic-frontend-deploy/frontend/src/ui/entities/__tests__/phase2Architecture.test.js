import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(process.cwd(), 'src');
const source = (relative) => readFileSync(resolve(process.cwd(), relative), 'utf8');
const productionFiles = ['pages', 'components', 'store'].flatMap((directory) =>
  readdirSync(resolve(root, directory), { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.(js|jsx)$/.test(entry.name))
    .map((entry) => resolve(entry.parentPath || entry.path, entry.name)));

test('Tasks 6-8: pages do not own enum meaning, entity formatting, or known protected-state shortcuts', () => {
  for (const file of productionFiles) {
    const contents = readFileSync(file, 'utf8');
    assert.doesNotMatch(contents, /\.status\s*[!=]==?\s*['"][A-Z][A-Z_]+['"]/, file);
    assert.doesNotMatch(contents, /new Date\(|\.toLocale(?:DateString|String)\(|\.toFixed\(|\bIntl\./, file);
  }
  assert.doesNotMatch(source('src/ui/entities/product/ProductPublicDetails.jsx'), /product\.stockQuantity/);
  assert.match(source('src/pages/UserProfile.jsx'), /getReadableUserField/);
  assert.match(source('src/components/ProtectedRoute.jsx'), /isUserBanned/);
});

test('Tasks 9-11: actions, commands, and canonical mutation helpers guard production writes', () => {
  const admin = source('src/pages/AdminDashboard.jsx');
  assert.match(admin, /buildUserActions[\s\S]*grantPermission/);
  assert.match(admin, /buildCategoryActions/);
  assert.doesNotMatch(admin, /setAdmins[^\n]+\{\s*\.\.\./);
  assert.match(source('src/pages/ProductDetails.jsx'), /buildFavoriteToggleAction/);
  assert.match(source('src/pages/ProductCatalog.jsx'), /buildFavoriteToggleAction/);
  for (const [file, command] of [
    ['src/pages/UserProfile.jsx', 'adminRequestSubmission'],
    ['src/pages/UserProfile.jsx', 'userProfile'],
    ['src/pages/UserProfile.jsx', 'userAddresses'],
    ['src/pages/AdminDashboard.jsx', 'notificationComposition'],
    ['src/pages/GiftFlowStep.jsx', 'mapGiftFlowCartItems'],
    ['src/pages/VendorSettings.jsx', 'mapVendorProfilePayload'],
  ]) assert.match(source(file), new RegExp(command), file);
  assert.doesNotMatch(source('src/pages/GiftFlowStep.jsx'), /JSON\.stringify/);
  assert.doesNotMatch(source('src/store/useCartStore.js'), /metadata:\s*JSON\.stringify/);
});

test('Tasks 12-14: hydration, projections, and duplicate workflows have one production owner', () => {
  const hydration = source('src/ui/entities/shared/productionHydration.js');
  assert.match(hydration, /authorized/);
  assert.match(hydration, /const caches/);
  for (const file of ['src/pages/Favorites.jsx', 'src/pages/GiftFlowStep.jsx']) {
    assert.match(source(file), /hydrateEntitiesById/, file);
    assert.doesNotMatch(source(file), /productService\.getProductById|giftFlowService\.getFlowById/, file);
  }
  const projectionConsumers = {
    authentication: 'src/services/authService.js',
    unifiedSearch: 'src/components/GlobalSearch.jsx',
    productSearch: 'src/components/ProductSearch.jsx',
    recommendations: 'src/components/ProductRecommendations.jsx',
    platformAnalytics: 'src/pages/AdminDashboard.jsx',
    vendorAnalytics: 'src/pages/VendorAnalytics.jsx',
    financialAnalytics: 'src/ui/workflows/financialWorkflow.js',
  };
  for (const [projection, file] of Object.entries(projectionConsumers)) {
    assert.match(source(file), new RegExp(`adapt${projection[0].toUpperCase()}${projection.slice(1)}Projection`), file);
  }
  assert.match(source('src/pages/AdminFinancial.jsx'), /loadFinancialSection/);
  assert.match(source('src/pages/AdminDashboard.jsx'), /loadFinancialSection/);
  assert.match(source('src/pages/Notifications.jsx'), /loadNotificationWorkflow/);
  assert.match(source('src/components/NotificationBell.jsx'), /loadNotificationWorkflow/);
});

test('Task 15: superseded harnesses, modal semantic ownership, and old Product utility are absent', () => {
  assert.equal(existsSync(resolve(root, 'ui/entities/Phase1EntityHarness.jsx')), false);
  assert.doesNotMatch(source('src/App.jsx'), /__phase1|Phase1EntityHarness/);
  assert.equal(existsSync(resolve(root, 'utils/productUtils.js')), false);
  for (const directory of ['product', 'order', 'giftFlow', 'vendor']) {
    const legacy = resolve(root, 'components/modals', directory);
    const files = existsSync(legacy) ? readdirSync(legacy, { recursive: true, withFileTypes: true }).filter((entry) => entry.isFile()) : [];
    assert.equal(files.length, 0, directory);
  }
});

test('Task 16: semantic presentations remain service- and adapter-free', () => {
  const entityRoot = resolve(root, 'ui/entities');
  const semanticFiles = readdirSync(entityRoot, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && /(?:Summary|Row|Card|Details|SemanticViews|sections).*\.(js|jsx)$/.test(entry.name));
  for (const entry of semanticFiles) {
    const file = resolve(entry.parentPath || entry.path, entry.name);
    assert.doesNotMatch(readFileSync(file, 'utf8'), /services\/|adaptEntityFromNamedSource/, file);
  }
});
