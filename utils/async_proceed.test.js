import async_proceed from './async_proceed'
import async_zip from './async_zip'

test('async_proceed works', async () => {
  const buf = []
  for await (const v of async_zip(
    async_proceed((async function* g() {
      await (new Promise(resolve => setTimeout(resolve, 10)))
      yield 2
      yield 1
    })(), { backoff: 5 }),
    async_proceed((async function *g() {
      yield 1
      await (new Promise(resolve => setTimeout(resolve, 10)))
      yield 2
    })(), { backoff: 5 }),
  )) {
    buf.push(v)
  }
  expect(buf).toEqual([[2,1],[1,2]])
})
