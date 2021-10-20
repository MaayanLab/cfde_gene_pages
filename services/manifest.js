import to_tsv from '@/utils/to_tsv'
import ensure_array from '@/utils/ensure_array'
import { getStaticProps } from '@/pages/[entity]'

/**
 * This function exports the manifest as a table.
 */
export default async function manifest(entity) {
  const { notFound, props } = await getStaticProps({ params: { entity } })
  console.log(to_tsv(ensure_array(((props || {}).manifest) || { notFound })))
}

manifest(...process.argv.slice(2))
