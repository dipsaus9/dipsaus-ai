/**
 * Article byline.
 *
 * Three flat data values rendered into one line of text. Slots
 * (comp.regions-as-slots) are for components with distinct composable
 * regions — a byline has none, so plain data props are the right design.
 * Promoting these to ReactNode slots would only push formatting onto every
 * caller.
 */
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
