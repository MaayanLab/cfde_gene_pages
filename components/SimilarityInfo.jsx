import dynamic from 'next/dynamic'

const BootstrapTooltip = dynamic(() => import('@/components/BootstrapTooltip'), { ssr: false })

export default function SimilarityInfo({ router, title, entity, items, description }) {
  return (
    <div className="col-12 justify-content-center">
      <p>
        <span style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>
          {title}
          &nbsp;
          <BootstrapTooltip title={description} />
          :&nbsp;
        </span>
        <div className="d-flex flex-wrap">
          {items.map(item => (
            <a
              key={item}
              className="mx-1"
              href="#"
              onClick={evt => {
                router.push({
                  pathname: '/[entity]/[search]',
                  query: { entity: entity, search: item },
                })
              }}
            >{item}</a>
          ))}
        </div>
      </p>
    </div>
  )
}
