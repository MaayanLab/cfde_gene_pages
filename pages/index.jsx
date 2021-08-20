import Head from 'next/head'
import dynamic from 'next/dynamic'
import useRouterEx from '@/utils/routerEx'

const SearchPage = dynamic(() => import('@/components/SearchPage'))

export default function Home() {
  const router = useRouterEx()
  return (
    <>
      <Head>
        <title>Gene and Drug Landing Page Aggregator</title>
      </Head>
      <SearchPage router={router} />
    </>
  )
}
