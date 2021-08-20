import React from 'react'
import dynamic from 'next/dynamic'
import callable from '@/utils/callable'
import memo from "@/utils/memo"
import full_manifest, { gene_id, drug_info } from '@/manifest'
import useRouterEx from '@/utils/routerEx'
import cmp from '@/manifest/cmp'
import sorted from '@/utils/sorted'
import defined from '@/utils/defined'
import countable from "@/utils/countable"

const EntityCard = dynamic(() => import('@/components/EntityCard'))
const SearchPage = dynamic(() => import('@/components/SearchPage'))

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
  if (search === 'error') {
    return {
      props: { error: true },
      revalidate: false,
    }
  }
  try {
    if (entity === 'gene') {
      if ((await gene_id(search)) === undefined) throw new Error('NotFound')
    } else if (entity === 'drug') {
      if ((await drug_info(search)) === undefined) throw new Error('NotFound')
    } else {
      throw new Error('NotFound')
    }
  } catch (e) {
    return { notFound: true, props: {} }
  }
  const manifest = (
    await Promise.all(
      full_manifest
        .map(async (item) => {
          if (!(entity in item.tags)) return
          try {
            const resolved_item = { ...item }
            resolved_item.clicks = await countable(item.countapi).get()
            resolved_item.clickurl = await defined(callable(item.clickurl))(search)
            resolved_item.status = await isitup(resolved_item.clickurl)
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
  return (
    <SearchPage router={router} {...props}>{({ router, CF, PS, Ag }) => (
      props.manifest && !router.loading ? (
        <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-3 justify-content-center">
          {sorted(props.manifest, cmp)
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
                search={props.search}
              />
            ))}
        </div>
      ) : null
    )}</SearchPage>
  )
}
