
export default function SimilarityInfo({ router, similarities }) {
  return (
    <div className="col-12 justify-content-center">
      {similarities
        .filter((similarity) => similarity.items !== null)
        .map(similarity => (
          <p key={similarity.title}>
            <span style={{ fontWeight: 500 }}>{similarity.title}: </span>
            {similarity.items.map(item => (
              <a
                key={item}
                className="mx-1"
                href="#"
                onClick={evt => {
                  router.push({
                    pathname: '/[entity]/[search]',
                    query: { entity: similarity.entity, search: item },
                  })
                }}
              >{item}</a>
            ))}
          </p>
        ))}
    </div>
  )
}