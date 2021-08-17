export default function callable(maybe_func) {
  if (typeof maybe_func === 'function') {
    return async (...args) => await maybe_func(...args)
  } else if (maybe_func instanceof Promise) {
    return async (...args) => await maybe_func
  } else {
    return async (...args) => maybe_func
  }
}