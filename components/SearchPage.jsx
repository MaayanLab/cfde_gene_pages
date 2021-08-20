import dynamic from 'next/dynamic'
import { useQsState } from '@/utils/qsstate'

const Loader = dynamic(() => import('@/components/Loader'))
const SearchControl = dynamic(() => import('@/components/SearchControl'))

export default function SearchPage({ router, ...props }) {
  const [CF, setCF] = useQsState('CF', false)
  const [PS, setPS] = useQsState('PS', true)
  const [Ag, setAg] = useQsState('Ag', true)
  return (
    <div>
      <SearchControl
        entity={router.query.entity || props.entity}
        search={router.query.search || props.search}
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
      {router.loading ? <Loader /> : null}
      {props.children ? props.children({ router, CF, PS, Ag }) : null}
    </div>
  )
}
