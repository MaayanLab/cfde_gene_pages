import memo from '@/utils/memo'
import fetchEx from '@/utils/fetchEx'

const countapi = `https://countapi.maayanlab.cloud`

const count = memo(async (id) => {
  const req = await fetchEx(`${countapi}/rpc/get?key=${encodeURIComponent(id)}`, { headers: { Accept: 'application/json' } })
  const res = await req.json()
  if (res !== null && res !== undefined) return res
  else return 0
})

export default function countable(id) {
  return {
    get: async () => await count(id),
    hit: async () => await fetchEx(`${countapi}/rpc/hit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: id }) }),
  }
}
