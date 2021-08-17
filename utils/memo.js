export default function memo(func) {
  const func_cache = {}
  function memoFunc(...args) {
    const serialized_args = JSON.stringify(args)
    if (!(serialized_args in func_cache)) {
      func_cache[serialized_args] = func(...args).then(ret => {
        func_cache[serialized_args] = ret
        return ret
      })
    }
    return func_cache[serialized_args]
  }
  return memoFunc
}
