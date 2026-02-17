/**
 * Date formatting utilities
 */

/**
 * Format date range for display
 * @example formatDateRange('2026-03-15', '2026-03-18') => 'Mar 15 – Mar 18'
 */
export function formatDateRange(startDate: string, endDate: string): string {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const startYear = start.getFullYear();
    const endYear = end.getFullYear();

    const startFormatted = start.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    });

    if (startYear === endYear) {
        const endFormatted = end.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
        return `${startFormatted} – ${endFormatted}, ${startYear}`;
    } else {
        const startWithYear = start.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        const endWithYear = end.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        return `${startWithYear} – ${endWithYear}`;
    }
}

/**
 * Format single date for display
 * @example formatDate('2026-03-15') => 'Mar 15, 2026'
 */
export function formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

/**
 * Format date with full month name
 * @example formatDateLong('2026-03-15') => 'March 15, 2026'
 */
export function formatDateLong(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
}
