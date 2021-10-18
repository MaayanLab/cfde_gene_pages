import async_proceed from '@/utils/async_proceed'
import async_zip from '@/utils/async_zip'
import callable from '@/utils/callable'

/**
 * This function takes a long time to execute and produces an availability matrix
 *  showing which sites are available for ewhich gene.
 */
export default async function availability(entity) {
  let entities
  if (entity === 'gene') {
    entities = (await import('@/public/autocomplete_genes.json')).default
  } else if (entity === 'drug') {
    entities = (await import('@/public/drugbank_vocabulary_drugs.json')).default
  } else {
    throw Exception('Not Implemented')
  }
  const { default: manifest } = await import('@/manifest')
  const filteredManifest = manifest
    .filter(rc => (rc.tags[entity] && !rc.tags.searchonly))
  //
  console.log(['', ...filteredManifest.map(({ name }) => name)].join('\t'))
  for await (const row of async_zip(
    (async function *() {
      for (const _entity of entities) {
        yield _entity
      }
    })(),
    ...filteredManifest.map(async function *(rc) {
        for (const _entity of entities) {
          const _rc = { ...rc }
          try {
            _rc.clickurl = await callable(_rc.clickurl)({ self: _rc, search: _entity })
            _rc.status = await callable(_rc.status)({ self: _rc, search: _entity })
          } catch (e) {
            _rc.status = 'no'
          }
          yield _rc.status === 'yes' ? '1' : '0'
          await (new Promise((resolve, _reject) => setTimeout(resolve, (0.5 + Math.random()) * 1000)))
        }
      })
      .map(async_proceed),
  )) {
    console.log(row.join('\t'))
  }
}

availability(...process.argv.slice(2))
