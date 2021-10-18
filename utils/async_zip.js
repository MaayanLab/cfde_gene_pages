export default async function* async_zip(...generators) {
  const generators_it = generators.map(generator => generator[Symbol.asyncIterator]())
  while (true) {
    const { done, value } = (await Promise.all(generators_it.map(it => it.next())))
      .reduce(
        (agg, e) => ({
          done: agg.done || e.done,
          value: [...agg.value, e.value],
        }),
        { done: false, value: [] },
      )
    if (done) break
    yield value
  }
}