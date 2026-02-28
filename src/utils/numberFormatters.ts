/**
 * Number formatting utilities
 */

/**
 * Format number with commas
 * @example formatNumber(1234567) => '1,234,567'
 */
export function formatNumber(num: number): string {
    return num.toLocaleString('en-US');
}

/**
 * Format currency
 * @example formatCurrency(1234.56) => '₹1,234.56'
 */
export function formatCurrency(amount: number, currency: string = 'INR'): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
    }).format(amount);
}

/**
 * Format percentage
 * @example formatPercentage(0.1234) => '12.34%'
 */
export function formatPercentage(value: number, decimals: number = 2): string {
    return `${(value * 100).toFixed(decimals)}%`;
}
