import test from 'node:test';
import assert from 'node:assert/strict';
import { registerAdapterContract } from '../../__tests__/entityContractSuite.js';
import { adaptCommissionRule } from '../commissionRuleAdapters.js';

registerAdapterContract('commissionRule');

test('commission rule adapter preserves backend LocalDateTime start and end dates', () => {
  const rule = adaptCommissionRule({
    id: 'rule-1',
    type: 'GLOBAL',
    rate: '0.10',
    startDate: '2026-06-23T10:00:00',
    endDate: '2026-06-30T18:30:00',
    active: true,
  });

  assert.equal(rule.startDate, '2026-06-23T10:00:00');
  assert.equal(rule.endDate, '2026-06-30T18:30:00');
  assert.equal(rule.meta.invalidFields.has('startDate'), false);
  assert.equal(rule.meta.invalidFields.has('endDate'), false);
});
