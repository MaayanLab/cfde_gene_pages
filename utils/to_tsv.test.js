import to_tsv from './to_tsv'

test('to_tsv works', async () => {
  expect(to_tsv([ {a: 0, b: 1, c: 2}, { a: 2, b: 1, c: 0} ]))
    .toEqual(
       'a	b	c'+'\n'
      +'0	1	2'+'\n'
      +'2	1	0'
    )
})
