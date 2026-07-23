// Clean twin — exactly 6 props, sitting on the cap. A false-positive trap.
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
