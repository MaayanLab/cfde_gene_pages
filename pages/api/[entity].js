import cacheData from 'memory-cache'
import { getStaticProps } from '@/pages/[entity]'
import ensure_array from '@/utils/ensure_array'
import to_tsv from '@/utils/to_tsv'

function serveContentType(req, res, value) {
  if (req.headers.accept == 'application/json') {
    res.setHeader('Content-Type', 'application/json')
    res.write(JSON.stringify(value))
    res.end()
  } else {//if (req.headers.accept == 'text/tsv') {
    res.setHeader('Content-Type', 'text/tsv')
    res.write(to_tsv(ensure_array(value), ['title','description','url','tags.CF','tags.PS','tags.Ag']))
    res.end()
  }
}

export default async function EntityRoute(req, res) {
  const { entity } = req.query
  if (req.method === 'HEAD') {
    if (entity !== 'gene' && entity !== 'drug') {
      res.status(404)
      serveContentType(req, res, { notFound: true })
    } else {
      res.status(200)
      res.end()
    }
  } else if (req.method === 'GET') {
    const value = cacheData.get(`/api/${entity}`)
    if (value) {
      res.status(200)
      serveContentType(req, res, value)
    } else {
      const { notFound, props, revalidate } = await getStaticProps({ params: { entity } })
      if (notFound) {
        res.status(404)
        serveContentType(req, res, { notFound: true })
      } else {
        cacheData.put(`/api/${entity}`, props.manifest, revalidate * 1000)
        res.status(200)
        serveContentType(req, res, props.manifest)
      }
    }
  } else {
    res.status(404)
    res.end()
  }
}
