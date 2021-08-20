export default function cmp(a, b) {
  // CF prioritized
  if (a.tags.CF && !b.tags.CF) {
    return -1
  } else if (!a.tags.CF && b.tags.CF) {
    return 1
  }
  // More clicks prioritized
  const clicks = b.clicks - a.clicks
  if (clicks > 0) {
    return 1
  } else if (clicks < 0) {
    return -1
  }
  // Alphabetical order
  if (b.title.toLowerCase() < a.title.toLowerCase()) {
    return 1
  } else if (a.title.toLowerCase() < b.title.toLowerCase()) {
    return -1
  }
  return 0
}
