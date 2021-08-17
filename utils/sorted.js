export default function sorted(L, cmp) {
  const L_sorted = [...L]
  if (cmp === undefined) cmp = (a, b) => { if (a > b) { return -1 } else if (b < a) { return 1 } else { return 0 } }
  L_sorted.sort(cmp)
  return L_sorted
}