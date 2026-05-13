/**
 * Utility functions for precise monetary calculations
 * Uses integer math (cents) to avoid floating point precision issues
 */

/**
 * Convert decimal amount to cents (integer)
 * @param amount - Amount in decimal currency (e.g., 100.50)
 * @returns Amount in cents (e.g., 10050)
 */
export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Convert cents back to decimal amount
 * @param cents - Amount in cents (e.g., 10050)
 * @returns Amount in decimal currency (e.g., 100.50)
 */
export function fromCents(cents: number): number {
  return cents / 100;
}

/**
 * Calculate percentage of an amount with precise rounding
 * @param amount - Base amount
 * @param percentage - Percentage to calculate (e.g., 5 for 5%)
 * @returns Result rounded to 2 decimal places
 */
export function calculatePercentage(amount: number, percentage: number): number {
  const cents = toCents(amount);
  const resultCents = (cents * percentage) / 100;
  return fromCents(Math.round(resultCents));
}

/**
 * Add two amounts precisely
 */
export function addAmounts(a: number, b: number): number {
  return fromCents(toCents(a) + toCents(b));
}

/**
 * Subtract two amounts precisely
 */
export function subtractAmounts(a: number, b: number): number {
  return fromCents(toCents(a) - toCents(b));
}

/**
 * Multiply amount by a number precisely
 */
export function multiplyAmount(amount: number, multiplier: number): number {
  return fromCents(Math.round(toCents(amount) * multiplier));
}

/**
 * Calculate total from products (unitPrice * quantity)
 */
export function calculateProductTotal(unitPrice: number, quantity: number): number {
  return fromCents(toCents(unitPrice) * quantity);
}

/**
 * Round monetary amount to 2 decimal places
 */
export function roundMoney(amount: number): number {
  return fromCents(toCents(amount));
}

/**
 * Format amount for display (currency)
 */
export function formatCurrency(amount: number, currency = "৳"): string {
  return `${currency}${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
