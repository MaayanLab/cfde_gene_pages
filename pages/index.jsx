import Head from 'next/head'
import dynamic from 'next/dynamic'
import useRouterEx from '@/utils/routerEx'

const Loader = dynamic(() => import('@/components/Loader'))
const SearchControl = dynamic(() => import('@/components/SearchControl'))

export default function Home() {
  const router = useRouterEx()
  return (
    <>
      <Head>
        <title>Gene and Drug Landing Page Aggregator</title>
      </Head>
      <SearchControl
        onSubmit={query => {
          router.push({
            pathname: '/[entity]/[search]',
            query,
          })
        }}
      />
      {router.loading ? (
        <Loader />
      ) : null}
    </>
  )
}
