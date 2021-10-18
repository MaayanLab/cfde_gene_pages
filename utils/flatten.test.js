import flatten from './flatten'

test('flatten works', () => {
  expect(flatten({
    'a': {
      'b': 1,
      'c': ['d', 'e']
    },
    'f': 2,
  })).toEqual({
    'a.b': 1,
    'a.c.0': 'd',
    'a.c.1': 'e',
    'f': 2,
  })
})
