/**
 * References-collision logic — the parallel-safety check. Two stories collide when any path in
 * one is a prefix of any path in the other, so they must not be picked up at the same time.
 *
 * The prefix rule is ported verbatim from skills/backlog-plan/reference/story-standard.md § Scope:
 * "Two paths collide if either is a prefix of the other." Prefix is tested on **path segments**,
 * not raw string prefix — otherwise `hooks/dad-joke` would falsely collide with `hooks/dad-joke-2`.
 *
 * Pure: no filesystem, no backlog CLI. The CLI wraps these with a reader that fetches story
 * References from `backlog`.
 */

/** Split a path into segments, dropping a trailing slash and empty parts. */
function segments(path: string): string[] {
  return path.split('/').filter((s) => s.length > 0)
}

/** True if one path is a prefix of the other on segment boundaries (equal paths collide). */
export function pathsCollide(a: string, b: string): boolean {
  const sa = segments(a)
  const sb = segments(b)
  const shorter = sa.length <= sb.length ? sa : sb
  const longer = sa.length <= sb.length ? sb : sa
  return shorter.every((seg, i) => seg === longer[i])
}

/** True if any path in `a` collides with any path in `b`. */
export function referencesCollide(a: readonly string[], b: readonly string[]): boolean {
  return a.some((pa) => b.some((pb) => pathsCollide(pa, pb)))
}

/** A story reduced to what the collision check needs. */
export interface StoryRefs {
  id: string
  references: string[]
}

/**
 * Every story in `others` whose References collide with the target's. The target is excluded
 * from `others` by id, so a story never collides with itself.
 */
export function findCollisions(target: StoryRefs, others: readonly StoryRefs[]): StoryRefs[] {
  return others.filter(
    (o) => o.id !== target.id && referencesCollide(target.references, o.references),
  )
}
