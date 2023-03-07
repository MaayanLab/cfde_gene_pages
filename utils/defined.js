export default function defined(func, what = 'Value') {
  return async (...args) => {
    const value = await func(...args)
    if (value === undefined) throw new Error(`${what} is undefined`)
    return value
  }
}