import Head from 'next/head'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'

const SearchControl = dynamic(() => import('@/components/SearchControl'))

export default function Home() {
  const router = useRouter()
  return (
    <>
      <Head>
        <title>Gene and Drug Landing Page Aggregator</title>
      </Head>
      <SearchControl
        onSubmit={query => {
          router.push({
            pathname: '/search',
            query,
          })
        }}
      />
    </>
  )
}
