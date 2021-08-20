export default function defined(func) {
  return async (...args) => {
    const value = await func(...args)
    if (value === undefined) throw new Error('Value is undefined')
    return value
  }
}