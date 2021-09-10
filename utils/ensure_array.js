export default function ensure_array(L) {
  if (Array.isArray(L)) {
    return L
  } else {
    return [L]
  }
}