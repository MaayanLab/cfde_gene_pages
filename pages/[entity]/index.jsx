import full_manifest from '@/manifest'
import dynamic from 'next/dynamic'
import cmp from '@/manifest/cmp'
import sorted from '@/utils/sorted'
import countable from '@/utils/countable'
import Head from 'next/head'
import capitalize from '@/utils/capitalize'

const EntityCard = dynamic(() => import('@/components/EntityCard'))

export async function getStaticPaths() {
  return {
    paths: [
      { params: { entity: 'gene' } },
      { params: { entity: 'drug' } },
    ],
    fallback: false,
  }
}

export async function getStaticProps({ params: { entity } }) {
  if (entity !== 'gene' && entity !== 'drug') return { notFound: true }
  const manifest = (
    await Promise.all(
      full_manifest
        .map(async (item) => {
          if (!(entity in item.tags)) return
          const resolved_item = { ...item }
          delete resolved_item.clickurl
          try {
            resolved_item.clicks = await countable(item.countapi).get()
          } catch (e) {
            console.warn(`${item.name} was not resolved: ${e}`)
          }
          return resolved_item
        })
    )
  ).filter(v => v !== undefined)
  return { props: { entity, manifest }, revalidate: 60 }
}

export default function Entity(props) {
  return (
    <>
      <Head>
        <title>Gene and Drug Landing Page Aggregator: ({capitalize(props.entity)})</title>
      </Head>
      <div className="album py-5 bg-light">
        <div className="container">
          <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-3 justify-content-center">
            {sorted(props.manifest, cmp)
              .filter(item => props.entity in item.tags)
              .map(item => (
                <EntityCard key={item.name} {...item} />
              ))}
          </div>
        </div>
      </div>
    </>
  )
}
