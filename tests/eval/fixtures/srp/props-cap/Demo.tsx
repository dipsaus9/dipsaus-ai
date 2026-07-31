// Demo seam — the caller the behavior tests pin. Tests assert this component's
// rendered output only, so a refactor may reshape ProductTile's API freely as
// long as Demo is updated to produce the same output.
import { ProductTile } from "./Bad";

export function ProductTileDemo() {
  return (
    <ProductTile
      id="p-201"
      title="Walnut desk organiser"
      price={34.5}
      currency="€"
      imageUrl="/img/p-201.jpg"
      rating={4.6}
      inStock={true}
    />
  );
}
