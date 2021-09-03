export default function try_or_else(func, otherwise) {
  return async (...args) => {
    try {
      return await func(...args)
    } catch (e) {
      console.warn(e.stack)
      return otherwise
    }
  }
}