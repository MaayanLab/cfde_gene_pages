export default function flatten(obj, K) {
  const flat_obj = {}
  for (const k in obj) {
    if (typeof obj[k] === 'object' && obj[k] !== null) {
      Object.assign(flat_obj, flatten(obj[k], K === undefined ? k : `${K}.${k}`))
    } else {
      Object.assign(flat_obj, { [K === undefined ? k : `${K}.${k}`]: obj[k] })
    }
  }
  return flat_obj
}