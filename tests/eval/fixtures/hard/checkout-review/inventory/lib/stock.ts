export type StockLevel = number;

/** Internal helper — consumers should go through the inventory barrel. */
export function stockLabel(level: StockLevel): string {
  if (level === 0) {
    return "Sold out";
  }
  if (level <= 5) {
    return `Only ${level} left`;
  }
  return "In stock";
}
