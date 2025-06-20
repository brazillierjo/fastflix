# Dynamic Currency System

This document explains the dynamic currency system implemented in FastFlix that adapts price display according to the user's region/language.

## Features

### 1. Automatic Currency Detection

The system automatically detects the appropriate currency based on:

- The country selected by the user in settings
- The region detected from device settings
- The application language as fallback

### 2. Country-Currency Mapping

The following correspondences are configured:

| Country        | Code | Currency | Symbol |
| -------------- | ---- | -------- | ------ |
| France         | FR   | EUR      | €      |
| United States  | US   | USD      | $      |
| Canada         | CA   | CAD      | C$     |
| United Kingdom | GB   | GBP      | £      |
| Germany        | DE   | EUR      | €      |
| Spain          | ES   | EUR      | €      |
| Italy          | IT   | EUR      | €      |
| Japan          | JP   | JPY      | ¥      |

### 3. Localized Formatting

Prices are formatted according to local conventions:

- **France**: `9,99 €`
- **United States**: `$9.99`
- **Japan**: `¥999`
- **United Kingdom**: `£9.99`

## Architecture

### Modified Files

1. **`utils/currency.ts`** - New file containing:

   - Country-currency mappings
   - Formatting functions
   - Conversion utilities

2. **`components/SubscriptionModal.tsx`** - Modified to:

   - Use the user's country
   - Format prices with appropriate currency
   - Maintain compatibility with RevenueCat

3. **`contexts/LanguageContext.tsx`** - Fixed AsyncStorage import

### Main Functions

#### `formatPrice(priceString: string): string`

Formats a RevenueCat price according to the user's country currency:

```typescript
// Usage example
const formattedPrice = formatPrice('$9.99'); // Returns "9,99 €" if user is in France
```

#### `getCurrencyForCountry(country: SupportedCountry): string`

Retrieves the currency code for a country:

```typescript
getCurrencyForCountry('FR'); // Returns 'EUR'
getCurrencyForCountry('US'); // Returns 'USD'
```

#### `formatPriceForCountry(price: number, country: SupportedCountry): string`

Formats a numeric price according to country conventions:

```typescript
formatPriceForCountry(9.99, 'FR'); // Returns "9,99 €"
formatPriceForCountry(9.99, 'US'); // Returns "$9.99"
```

## Current Behavior

### Important Limitation

⚠️ **Currency Conversion**: Currently, the system does **not** perform real-time currency conversion. It:

1. **Detects** the currency of the RevenueCat price
2. **Compares** with the expected currency of the country
3. **Reformats** if it's the same currency
4. **Preserves** the original price if currencies differ

### Behavior Example

```typescript
// French user (country: FR, expected currency: EUR)
// RevenueCat price: "$9.99" (USD)
// Result: "$9.99" (kept as is)

// RevenueCat price: "9.99 EUR" (EUR)
// Result: "9,99 €" (reformatted according to French conventions)
```

## Future Improvements

### 1. Real-Time Currency Conversion

To implement real conversion:

```typescript
// Exchange rate API integration
import { getExchangeRate } from '@/services/exchangeRateAPI';

const convertPrice = async (price: number, from: string, to: string) => {
  const rate = await getExchangeRate(from, to);
  return price * rate;
};
```

### 2. Exchange Rate Caching

```typescript
// Cache with expiration
const exchangeRateCache = new Map();
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour
```

### 3. Error Handling

- Fallback to original currency on error
- Visual indicator if conversion fails
- Offline mode with cached exchange rates

## RevenueCat Configuration

### Recommendations

To optimize user experience:

1. **Configure prices by region** in RevenueCat Dashboard
2. **Use local currencies** for each App Store
3. **Test** with different App Store regions

### Configuration Example

```json
{
  "monthly_subscription": {
    "US": { "price": 9.99, "currency": "USD" },
    "FR": { "price": 8.99, "currency": "EUR" },
    "JP": { "price": 1200, "currency": "JPY" }
  }
}
```

## Testing

### Test Scenarios

1. **Country change** in settings
2. **Different RevenueCat currencies**
3. **Formatting** according to local conventions
4. **Fallback** on formatting error

### Test Example

```typescript
// Formatting tests
expect(formatPriceForCountry(9.99, 'FR')).toBe('9,99 €');
expect(formatPriceForCountry(9.99, 'US')).toBe('$9.99');
expect(formatPriceForCountry(1200, 'JP')).toBe('¥1,200');
```

## Conclusion

This system provides a solid foundation for localized price display. While it doesn't yet perform real-time currency conversion, it significantly improves user experience by displaying prices according to appropriate local conventions.

The next step would be to integrate an exchange rate API for automatic currency conversion.
