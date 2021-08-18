import manifest from '@/manifest'
import dynamic from 'next/dynamic'
import { useQsState } from '@/utils/qsstate'
import { useRouter } from 'next/router'

const EntityCard = dynamic(() => import('@/components/EntityCard'))
const SearchControl = dynamic(() => import('@/components/SearchControl'))

let entities = {'gene': true, 'drug': true}

export function getServerSideProps({ query: { entity, search } }) {
  if (!(entity in entities) || search === undefined || search === '') return { notFound: true }
  return { props:  { entity, search } }
}

export default function Search({ entity, search }) {
  const router = useRouter()
  const [CF, _setCF] = useQsState('CF', false)
  const [PS, _setPS] = useQsState('PS', true)
  const [Ag, _setAg] = useQsState('Ag', true)
  return (
    <>
      <SearchControl
        onSubmit={query => {
          router.push({
            pathname: '/[entity]/[search]',
            query,
          })
        }}
      />
      <div className="album py-5 bg-light">
        <div className="container">
          <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-3">
            {manifest
              .filter(props => {
                if (!(entity in props.tags)) return false
                if (CF === true && !('CF' in props.tags)) return false
                return (
                  (PS === true && 'PS' in props.tags)
                  || (Ag === true && 'Ag' in props.tags)
                  || (PS === false && Ag === false)
                )
              })
              .map((props) => (
                <EntityCard
                  key={props.name}
                  {...props}
                  search={search}
                />
              ))}
          </div>
        </div>
      </div>
    </>
  )
}
