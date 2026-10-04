import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import { adaptCommission } from '../commissionAdapters.js';
import { groupInstapayPayoutsByVendor } from '../commissionSelectors.js';
import { formatRatePercent, normalizeRateFraction } from '../../shared/decimal.js';

const source = (path) => fs.readFileSync(new URL(`../../../../${path}`, import.meta.url), 'utf8');

test('Financial dashboard wires the Instapay settlement tab to its direction-specific endpoint', () => {
  const dashboard = source('pages/AdminDashboard.jsx');
  const service = source('services/commissionService.js');
  const workflow = source('ui/workflows/financialWorkflow.js');

  assert.match(service, /api\.get\('\/admin\/commissions\/instapay-payouts'\)/);
  assert.match(workflow, /section === 'instapay'/);
  assert.match(dashboard, />\s*Instapay\s*<\/button>/);
  assert.match(dashboard, /groupInstapayPayoutsByVendor\(instapayPayouts\)/);
  assert.match(dashboard, />Commission</);
  assert.match(dashboard, /Net payout/);
});

test('Instapay payout DTO dates remain available to the Financial settlement view', () => {
  const payout = adaptCommission({
    id: 'commission-1',
    orderId: 'order-1',
    supplierId: 'vendor-1',
    direction: 'PLATFORM_TO_VENDOR',
    status: 'PENDING',
    orderPlacedAt: '2026-06-01T10:00:00',
    completedAt: '2026-06-10T12:00:00',
  });

  assert.equal(payout.orderPlacedAt, '2026-06-01T10:00:00');
  assert.equal(payout.completedAt, '2026-06-10T12:00:00');
});

test('Instapay payouts are grouped by vendor with gross, commission, and net totals', () => {
  const groups = groupInstapayPayoutsByVendor([
    {
      id: 'commission-1', supplierId: 'vendor-1', supplierName: 'Vendor One',
      orderSubtotal: '100.00', commissionAmount: '10.00', payableAmount: '90.00',
    },
    {
      id: 'commission-2', supplierId: 'vendor-1', supplierName: 'Vendor One',
      orderSubtotal: '50.00', commissionAmount: '5.00', payableAmount: '45.00',
    },
    {
      id: 'commission-3', supplierId: 'vendor-2', supplierName: 'Vendor Two',
      orderSubtotal: '80.00', commissionAmount: '8.00', payableAmount: '72.00',
    },
  ]);

  assert.equal(groups.length, 2);
  assert.deepEqual(
    [groups[0].grossTotal, groups[0].commissionTotal, groups[0].netTotal],
    ['150', '15', '135'],
  );
  assert.equal(groups[0].payouts.length, 2);
});

test('commission rate helpers treat whole-number input as a percent, not a multiplier', () => {
  assert.equal(normalizeRateFraction('10'), '0.1');
  assert.equal(formatRatePercent('10'), '10%');
  assert.equal(formatRatePercent('0.10'), '10%');
});
