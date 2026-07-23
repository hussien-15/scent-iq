import test from 'node:test';
import assert from 'node:assert/strict';
import { LAUNCH_APPROVAL_AREAS, QA_CHECK_DEFINITIONS } from '../src/lib/qa-catalog';
import {
  calculateLaunchReadiness,
  type ReadinessApprovalInput,
  type ReadinessBugInput,
  type ReadinessCheckInput,
} from '../src/services/qa.service';

function passedChecks(): ReadinessCheckInput[] {
  return QA_CHECK_DEFINITIONS.map((check) => ({
    key: check.key,
    category: check.category,
    title: check.title,
    critical: check.critical ?? false,
    weight: check.weight ?? 1,
    status: 'PASSED',
  }));
}

function approvals(): ReadinessApprovalInput[] {
  return LAUNCH_APPROVAL_AREAS.map((area) => ({ area: area.key, approved: true }));
}

test('fully evidenced launch reaches 100 and is ready', () => {
  const result = calculateLaunchReadiness(passedChecks(), [], approvals());
  assert.equal(result.overallScore, 100);
  assert.equal(result.ready, true);
  assert.equal(result.blockers.length, 0);
});

test('an unpassed critical check blocks launch', () => {
  const checks = passedChecks();
  checks[0] = { ...checks[0], status: 'NOT_TESTED' };
  const result = calculateLaunchReadiness(checks, [], approvals());
  assert.equal(result.ready, false);
  assert.equal(result.criticalCategoriesReady, false);
  assert.equal(result.failedCriticalChecks.length, 1);
});

test('a High bug remains blocking at Fixed and resolves only after verification', () => {
  const bug: ReadinessBugInput = {
    id: 'bug-1',
    title: 'Checkout total mismatch',
    severity: 'HIGH',
    status: 'FIXED',
  };
  assert.equal(calculateLaunchReadiness(passedChecks(), [bug], approvals()).ready, false);
  assert.equal(calculateLaunchReadiness(passedChecks(), [{ ...bug, status: 'VERIFIED' }], approvals()).ready, true);
});

test('a missing accountable approval blocks an otherwise perfect launch', () => {
  const result = calculateLaunchReadiness(passedChecks(), [], approvals().slice(0, -1));
  assert.equal(result.overallScore, 100);
  assert.equal(result.ready, false);
  assert.equal(result.missingApprovals.length, 1);
});
