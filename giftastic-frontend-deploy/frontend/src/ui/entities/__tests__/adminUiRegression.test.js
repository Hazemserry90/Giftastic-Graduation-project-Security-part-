import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source = (path) => fs.readFileSync(new URL(`../../../${path}`, import.meta.url), 'utf8');

test('admin permission management refreshes server state and current auth context', () => {
  const dashboard = source('pages/AdminDashboard.jsx');
  const protectedRoute = source('components/ProtectedRoute.jsx');

  assert.match(dashboard, /await refreshAdmins\(\)/);
  assert.match(dashboard, /onCurrentAdminProfileChange\?\.\(currentProfile\)/);
  assert.match(dashboard, /grantPermission: \(\) => changePermission\('grant'\)/);
  assert.match(dashboard, /revokePermission: \(\) => changePermission\('revoke'\)/);
  assert.match(dashboard, /disabled=\{!permissionSelectionComplete\}/);
  assert.match(protectedRoute, /adminService\.getMyAdminProfile\(\)/);
  assert.match(protectedRoute, /hydrateAdminFacet\(profile\)/);
});

test('category management exposes create, read, edit, and delete actions', () => {
  const dashboard = source('pages/AdminDashboard.jsx');
  const service = source('services/adminService.js');

  assert.match(service, /api\.patch\(`\/categories\/\$\{id\}`/);
  assert.match(dashboard, /openDetailsModal/);
  assert.match(dashboard, /openEditModal/);
  assert.match(dashboard, /Category updated/);
  assert.match(dashboard, /Category deleted/);
});

test('Reports is an internal dashboard tab and report loading accepts page or list responses', () => {
  const dashboard = source('pages/AdminDashboard.jsx');
  const navbar = source('components/Navbar.jsx');
  const reports = source('pages/AdminReports.jsx');

  assert.match(dashboard, /id: 'reports', label: 'Reports'/);
  assert.match(dashboard, /navigate\('\/admin\/reports'\)/);
  assert.doesNotMatch(navbar, /\/admin\/reports/);
  assert.match(reports, /Array\.isArray\(data\) \? data : data\?\.content \|\| \[\]/);
  assert.match(reports, /Submitted by:/);
  assert.match(reports, /id: 'admin-reports-load'/);
});

test('Reminders expose CRUD feedback and omit Gift Concierge', () => {
  const reminders = source('pages/UserDashboard.jsx');

  assert.doesNotMatch(reminders, /Gift Concierge|Speak to a Stylist/);
  assert.match(reminders, /reminderService\.createReminder/);
  assert.match(reminders, /reminderService\.updateReminder/);
  assert.match(reminders, /reminderService\.deleteReminder/);
  assert.match(reminders, /toast\.success\(editingReminderId \? 'Reminder updated' : 'Reminder created'\)/);
  assert.match(reminders, /type="datetime-local"/);
});

test('commission rule form keeps controlled date-time values and validates submissions', () => {
  const dashboard = source('pages/AdminDashboard.jsx');

  assert.match(dashboard, /id="commission-rule-start" type="datetime-local" value=\{startDate\}/);
  assert.match(dashboard, /id="commission-rule-end" type="datetime-local" value=\{endDate\}/);
  assert.match(dashboard, /End date must be after the start date/);
  assert.match(dashboard, /onSubmit=\{handleCreateRule\}/);
});

test('checkout loads the configured Instapay destination before allowing selection', () => {
  const checkout = source('pages/Checkout.jsx');

  assert.match(checkout, /import\('\.\.\/services\/api'\)\.then\(\(\{ default: api \}\)/);
  assert.match(checkout, /api\.get\('\/payment\/instapay\/phone'\)/);
  assert.match(checkout, /user && instapayPhone && <label/);
  assert.match(checkout, /formData\.paymentMethod === 'INSTAPAY' && !instapayPhone/);
  assert.match(checkout, /orderService\.placeOrder\(mapped\.payload\)/);
});

test('Instapay review updates aggregate and vendor progress after confirmation', () => {
  const dashboard = source('pages/AdminDashboard.jsx');
  const app = source('App.jsx');
  const navbar = source('components/Navbar.jsx');

  assert.match(dashboard, /adminService\.confirmOrderPayment\(detailOrder\.id\)/);
  assert.match(dashboard, /\[supplierId, 'IN_PROGRESS'\]/);
  assert.match(dashboard, /type="button" disabled=\{loading \|\| !detailOrder\.instapayTransactionIds\?\.length\}/);
  assert.match(app, /<Toaster position="top-center"/);
  assert.match(navbar, /import giftasticLogo from '\.\.\/assets\/Giftastic Logo\.png'/);
  assert.match(navbar, /<img[\s\S]+src=\{giftasticLogo\}[\s\S]+alt="Giftastic"/);
  assert.match(navbar, /className="-ml-2 shrink-0 sm:-ml-3"/);
});
