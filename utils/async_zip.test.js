import async_zip from './async_zip'

test('async_zip works', async () => {
  const buf = []
  for await (const v of async_zip(
    (async function* g() {
      await (new Promise(resolve => setTimeout(resolve, 10)))
      yield 2
      yield 1
    })(),
    (async function *g() {
      yield 1
      await (new Promise(resolve => setTimeout(resolve, 10)))
      yield 2
    })(),
  )) {
    buf.push(v)
  }
  expect(buf).toEqual([[2,1],[1,2]])
})
