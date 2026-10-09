/**
 * Feature switches. A feature turned off here is hidden from the side menu, its screens are not
 * registered, and links to it (search, notifications) are dropped. Its code stays in the project,
 * so switching it back on restores it unchanged.
 */
export const FEATURES = {
  /** Loans & Liabilities (side menu → Plan & Save). */
  loans: false,
  /** Stock Market and stock detail screens (side menu → Growth). */
  stockMarket: false,
} as const;

/** Screen names that belong to each switchable feature. */
const FEATURE_ROUTES: Record<keyof typeof FEATURES, string[]> = {
  loans: ['Loans'],
  stockMarket: ['StockMarket', 'StockDetail'],
};

const DISABLED_ROUTES = new Set(
  (Object.keys(FEATURES) as (keyof typeof FEATURES)[])
    .filter(key => !FEATURES[key])
    .flatMap(key => FEATURE_ROUTES[key]),
);

/** False for screens of a feature that is switched off. */
export const isRouteEnabled = (route: string) => !DISABLED_ROUTES.has(route);
