export default function memo(func) {
  const func_cache = {}
  async function memoFunc(...args) {
    const serialized_args = JSON.stringify(args)
    if (!(serialized_args in func_cache)) {
      func_cache[serialized_args] = await func(...args)
    }
    return func_cache[serialized_args]
  }
  return memoFunc
}
