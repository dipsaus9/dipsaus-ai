// Clean twin — several props, but they are flat data rendered into a single
// region. No header/body/footer structure to slot, so prop-driven is the right
// design: a false-positive trap.
export function ArticleByline({
  author,
  publishedAt,
  readMinutes,
}: {
  author: string;
  publishedAt: string;
  readMinutes: number;
}) {
  return (
    <p className="article-byline">
      By {author} · {publishedAt} · {readMinutes} min read
    </p>
  );
}
