export default async function fetchEx(url, opts) {
  if (opts === undefined) opts = {}
  let timeout = opts.timeout || 5000
  const controller = new AbortController()
  opts.signal = controller.signal
  setTimeout(() => controller.abort(), timeout)
  return await fetch(url, opts)
}