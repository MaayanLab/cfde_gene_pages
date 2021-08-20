import Head from 'next/head'
import dynamic from 'next/dynamic'
import useRouterEx from '@/utils/routerEx'
import capitalize from '@/utils/capitalize'

const SearchPage = dynamic(() => import('@/components/SearchPage'))

export default function SearchError(props) {
  const router = useRouterEx()
  let entity = router.query.entity || props.entity || ''
  let search = router.query.search || props.search || ''
  if (router.query.path) {
    search = router.query.path.split('/')[2]
  } else {
    search = ''
  }
  return (
    <>
      <Head>
        <title>Gene and Drug Landing Page Aggregator: {search} ({capitalize(entity)})</title>
      </Head>
      <SearchPage router={router} {...{...props, search}}>{({ router }) =>
        !router.loading ? (
          <div className="album py-5 bg-light">
            <div className="container">
              <div className="text-center">No information found for this {entity}</div>
            </div>
          </div>
        ) : null
      }</SearchPage>
    </>
  )
}
