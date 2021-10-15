/**
 * We consume the generator right away
 *  so that work can continue even if the results
 *  have not been awaited.
 */
export default async function* async_proceed(gen, { backoff }) {
  if (backoff === undefined) {
    backoff = 1000
  }
  const buffer = []
  ;(async () => {
    for await (const value of gen) {
      buffer.push({ done: false, value })
    }
  })().finally(() => buffer.push({ done: true }))

  let current
  while (true) {
    while (current === undefined) {
      // backoff, yield is ahead of the buffer
      await (new Promise((resolve, _reject) => setTimeout(resolve, backoff * (0.5 + Math.random()))))
      current = buffer.shift()
    }
    if (current.done) {
      break
    } else {
      yield current.value
    }
    current = buffer.shift()
  }
}
