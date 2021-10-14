/**
 * We consume the generator right away
 *  so that work can continue even if the results
 *  have not been awaited.
 */
export default async function* async_proceed(gen) {
  const it = gen[Symbol.asyncIterator]()
  const buffer = [await it.next()]
  if (!buffer[0].done) {
    (async () => {
      for await(const el of gen) {
        buffer.push({ value: el, done: false })
      }
    })().finally(() => buffer.push({ done: true }))

    let current = buffer.pop()
    do {
      yield current.value
      current = buffer.pop()
      if (current === undefined) {
        // backoff, yield is ahead of the buffer
        await (new Promise((resolve, _reject) => setTimeout(resolve, 1000*(0.5+Math.random()))))
      }
    } while (!(current||{}).done)
  }
}
