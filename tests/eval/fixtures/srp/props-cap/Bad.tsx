// Violates srp.props-cap: 7 props (> 6). Distinct data props, not config flags —
// though > 6 props also legitimately triggers comp.config-soup (see expected.json).
interface ProductTileProps {
  id: string;
  title: string;
  price: number;
  currency: string;
  imageUrl: string;
  rating: number;
  inStock: boolean;
}

export function ProductTile({
  id,
  title,
  price,
  currency,
  imageUrl,
  rating,
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
      <p>Rated {rating.toFixed(1)} / 5</p>
      <p>{inStock ? "In stock" : "Sold out"}</p>
    </article>
  );
}
