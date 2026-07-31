/**
 * Product tile for grid listings.
 *
 * Six props of flat display data is the ceiling the props budget allows
 * (srp.props-cap: at most 6). They are all atomic values for one region of
 * markup — the moment this tile needs configurable regions or more knobs,
 * the design moves to composition instead of a seventh prop.
 */
interface ProductTileProps {
  id: string;
  title: string;
  price: number;
  currency: string;
  imageUrl: string;
  inStock: boolean;
}

export function ProductTile({
  id,
  title,
  price,
  currency,
  imageUrl,
  inStock,
}: ProductTileProps) {
  return (
    <article data-product-id={id}>
      <img src={imageUrl} alt={title} />
      <h3>{title}</h3>
      <p>
        {currency}
        {price.toFixed(2)}
      </p>
      <p>{inStock ? "In stock" : "Sold out"}</p>
    </article>
  );
}
