import manifest from '@/manifest'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'

const EntityCard = dynamic(() => import('@/components/EntityCard'))
const SearchControl = dynamic(() => import('@/components/SearchControl'))

let entities = {'gene': true, 'drug': true}

export function getServerSideProps({ query: { e: entity, q: search, CF, PS, Ag } }) {
  if (!(entity in entities) || search === undefined || search === '') return { notFound: true }
  if (CF === undefined) CF = false
  if (PS === undefined) PS = true
  if (Ag === undefined) Ag = true
  return { props: { entity, search, CF, PS, Ag } }
}

export default function Search({ entity, search, CF, PS, Ag }) {
  const router = useRouter()
  return (
    <>
      <SearchControl
        onSubmit={query => {
          router.push({
            pathname: '/search',
            query,
          })
        }}
      />
      <div className="album py-5 bg-light">
        <div className="container">
          <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-3">
            {manifest
              .filter(props => {
                // TODO: other filters
                return entity in props.tags
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
