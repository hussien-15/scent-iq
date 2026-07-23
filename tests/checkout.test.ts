import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateCheckoutTotals, createOrderNumber } from '../src/services/checkout.service';
import { checkoutSchema } from '../src/validators/checkout';

const baseCheckout = {
  customerName: 'Ali Hassan',
  phone: '07701234567',
  city: 'Baghdad',
  address: 'Karrada, Street 10',
  deliveryCompanyId: 'delivery-1',
  submissionId: 'a9d0d829-6f4a-4cbf-b5c6-0b5bdeab0f98',
};

test('checkout totals use server prices and apply free delivery threshold', () => {
  assert.deepEqual(calculateCheckoutTotals([{ price: 75_000, quantity: 2 }], 5_000, 100_000), {
    subtotal: 150_000,
    deliveryFee: 0,
    total: 150_000,
  });
});

test('checkout totals keep delivery below the threshold', () => {
  assert.deepEqual(calculateCheckoutTotals([{ price: 45_000, quantity: 1 }], 5_000, 100_000), {
    subtotal: 45_000,
    deliveryFee: 5_000,
    total: 50_000,
  });
});

test('checkout validation rejects duplicate product targets', () => {
  const item = { perfumeId: '9fb6d0c2-3ca0-41ef-89d9-8e7d60bd66b7', quantity: 1 };
  const result = checkoutSchema.safeParse({ ...baseCheckout, items: [item, item] });
  assert.equal(result.success, false);
});

test('checkout validation normalizes an Iraqi mobile number', () => {
  const result = checkoutSchema.parse({
    ...baseCheckout,
    phone: '+964 (770) 123-4567',
    items: [{ perfumeId: '9fb6d0c2-3ca0-41ef-89d9-8e7d60bd66b7', quantity: 1 }],
  });
  assert.equal(result.phone, '+9647701234567');
});

test('order numbers are readable, stable and date-prefixed', () => {
  assert.equal(createOrderNumber(new Date('2026-07-14T12:00:00.000Z'), 'A1B2C3D4'), 'SIQ-20260714-A1B2C3D4');
});
