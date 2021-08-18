import React from 'react'
import dynamic from 'next/dynamic'
import { useQsState } from '@/utils/qsstate'
import callable from '@/utils/callable'
import memo from "@/utils/memo"
import useRouterEx from '@/utils/routerEx'

const Loader = dynamic(() => import('@/components/Loader'))
const EntityCard = dynamic(() => import('@/components/EntityCard'))
const SearchControl = dynamic(() => import('@/components/SearchControl'))

const isitup = memo(async (url) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      const isitup_res = await fetch(url)
      if (isitup_res.status >= 400) {
        throw new Error(isitup_res.statusText)
      }
    }
    return 'yes'
  } catch (e) {
    return e.toString()
  }
})
const entities = { 'gene': true, 'drug': true }

export async function getStaticPaths() {
  const { gene_examples, drug_examples } = await import('@/manifest/examples')
  return {
    paths: [
      ...gene_examples.map((search) => ({ params: { entity: 'gene', search } })),
      ...drug_examples.map((search) => ({ params: { entity: 'drug', search } })),
    ],
    fallback: 'blocking',
  }
}

export async function getStaticProps({ params: { entity, search } }) {
  if (!(entity in entities)) {
    return { notFound: true }
  }
  const manifest = (
    await Promise.all(
      (await import('@/manifest')).default
        .map(async (item) => {
          if (!(entity in item.tags)) return
          try {
            const resolved_item = { ...item }
            delete resolved_item.countapi
            delete resolved_item.clickurl
            resolved_item.clicks = await item.countapi.get()
            resolved_item.resolved_url = await callable(item.clickurl)(search)
            if (typeof resolved_item.resolved_url !== 'string') throw new Error(`${item.name}: url is not a string`)
            resolved_item.status = await isitup(resolved_item.resolved_url)
            if (resolved_item.status !== 'yes') throw new Error(`${item.name}: isitup returned ${resolved_item.status}`)
            return resolved_item
          } catch (e) {
            console.warn(`${item.name} was not resolved: ${e}`)
            return
          }
        })
    )
  ).filter(v => v !== undefined)
  return {
    props: {
      entity,
      search,
      manifest,
    },
    revalidate: false,
  }
}

export default function Search(props) {
  const router = useRouterEx()
  const { entity, search, manifest } = props
  const [CF, setCF] = useQsState('CF', false)
  const [PS, setPS] = useQsState('PS', true)
  const [Ag, setAg] = useQsState('Ag', true)
  return (
    <div>
      <SearchControl
        entity={router.query.entity || entity}
        search={router.query.search || search}
        CF={CF} setCF={setCF}
        PS={PS} setPS={setPS}
        Ag={Ag} setAg={setAg}
        onSubmit={query => {
          router.push({
            pathname: '/[entity]/[search]',
            query,
          })
        }}
      />
      <div className="album py-5 bg-light">
        <div className="container">
          {!manifest || router.loading ? (
            <Loader />
          ) : (
            <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-3 justify-content-center">
              {manifest
                .filter(item => {
                  if (CF === true && !('CF' in item.tags)) return false
                  return (
                    (PS === true && 'PS' in item.tags)
                    || (Ag === true && 'Ag' in item.tags)
                    || (PS === false && Ag === false)
                  )
                })
                .map((item) => (
                  <EntityCard
                    key={item.name}
                    {...item}
                    search={search}
                  />
                ))
              }
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
