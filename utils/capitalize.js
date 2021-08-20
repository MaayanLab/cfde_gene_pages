export default function capitalize(s) {
  if (s.length === 0) return ''
  else return `${s[0].toUpperCase()}${s.slice(1)}`
}