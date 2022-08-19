export default function ensure_array(L) {
  if (Array.isArray(L)) {
    return L
  } else if (L === undefined || L === null) {
    return []
  } else {
    return [L]
  }
}