import manifest from '@/manifest'
import dynamic from 'next/dynamic'

const EntityCard = dynamic(() => import('@/components/EntityCard'))

let entities = {'gene': true, 'drug': true}

export function getServerSideProps({ query: { entity } }) {
  if (!(entity in entities)) return { notFound: true }
  return { props: { entity } }
}

export default function Entity({ entity }) {
  return (
    <div className="album py-5 bg-light">
      <div className="container">
        <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-3">
          {manifest.filter(props => entity in props.tags).map((props) => (
            <EntityCard key={props.name} {...props} />
          ))}
        </div>
      </div>
    </div>
  )
}
