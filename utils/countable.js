import memo from '@/utils/memo'

const countapi = `https://api.countapi.xyz`

const count = memo(async (id) => {
  const res = await fetch(`${countapi}/get/${id}`)
  const { value } = await res.json()
  if (value !== null) return value
  else return 0
})

export default function countable(id) {
  return {
    get: async () => await count(id),
    hit: async () => await fetch(`${countapi}/hit/${id}`),
  }
}
