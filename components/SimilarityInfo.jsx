
export default function SimilarityInfo({ router, title, entity, items, description }) {
  return (
    <div className="col-12 justify-content-center">
      <p>
        <span style={{ fontWeight: 500 }}>{title}: </span>
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
      </p>
    </div>
  )
}
