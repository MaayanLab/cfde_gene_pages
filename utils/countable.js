import memo from '@/utils/memo'
import fetchEx from '@/utils/fetchEx'

const countapi = `https://api.countapi.xyz`

const count = memo(async (id) => {
  const res = await fetchEx(`${countapi}/get/${id}`)
  const { value } = await res.json()
  if (value !== null) return value
  else return 0
})

export default function countable(id) {
  return {
    get: async () => await count(id),
    hit: async () => await fetchEx(`${countapi}/hit/${id}`),
  }
}
