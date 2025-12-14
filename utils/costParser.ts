/**
 * Parses a cost string (e.g., "JPY 400", "Rp 50000", "$100") into a numeric amount and currency symbol.
 *
 * @param costString The string containing the cost and currency.
 * @returns An object with `amount` (number) and `currency` (string), or null if parsing fails.
 */
export function parseCostString(costString: string): { amount: number, currency: string } | null {
  if (!costString) {
    return null;
  }

  // Regular expression to match currency code/symbol and number
  // It handles formats like "JPY 400", "Rp 50000", "$100", "400 JPY"
  const match = costString.match(/([A-Z]{2,3}|[\$€£₹])?\s*([\d,.]+)\s*([A-Z]{2,3}|[\$€£₹])?/i);

  if (!match) {
    return null;
  }

  let amountString = match[2].replace(/,/g, ''); // Remove commas for parsing
  let currency = (match[1] || match[3] || '').toUpperCase(); // Prioritize explicit code, then symbol

  // Try to infer common currency symbols if not explicitly provided or matched
  if (!currency) {
    if (costString.includes('$')) currency = '$';
    else if (costString.includes('Rp')) currency = 'Rp';
    else if (costString.includes('€')) currency = '€';
    else if (costString.includes('£')) currency = '£';
    else if (costString.includes('₹')) currency = '₹';
    // Add more common symbols if needed
  }

  const amount = parseFloat(amountString);

  if (isNaN(amount)) {
    return null;
  }

  // Default currency if none found
  if (!currency) {
    currency = 'IDR'; // Assuming IDR as a common default for Indonesian context
  }

  return { amount, currency };
}
