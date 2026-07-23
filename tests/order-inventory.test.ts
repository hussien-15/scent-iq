import test from 'node:test';
import assert from 'node:assert/strict';
import { availableStock, inventoryStatus } from '../src/services/inventory.service';
import { assertOrderTransition, canTransitionOrder } from '../src/services/order.service';

test('available stock never becomes negative', () => {
  assert.equal(availableStock(3, 5), 0);
  assert.equal(availableStock(10, 4), 6);
});

test('inventory status respects reservation and low-stock boundaries', () => {
  assert.equal(inventoryStatus({ stock: 5, reservedStock: 5, lowStockThreshold: 2, availability: 'IN_STOCK' }), 'RESERVED');
  assert.equal(inventoryStatus({ stock: 5, reservedStock: 4, lowStockThreshold: 2, availability: 'IN_STOCK' }), 'LOW_STOCK');
});

test('order state machine allows valid transitions and blocks invalid ones', () => {
  assert.equal(canTransitionOrder('PENDING', 'CONFIRMED'), true);
  assert.equal(canTransitionOrder('DELIVERED', 'CANCELLED'), false);
  assert.throws(() => assertOrderTransition('DELIVERED', 'CANCELLED'), /Cannot move an order/);
});
