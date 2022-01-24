
export default function SimilarityInfo({ router, ...item }) {
  return (
    <div className="col-12 justify-content-center">
      {(item.similar_coexpression === undefined) || (item.similar_coexpression === null) ? null : (
        <p>
          <span style={{ fontWeight: 500 }}>Similar genes based on mRNA co-expression: </span>
          {item.similar_coexpression.map(gene =>
            <a
              key={gene}
              className="mx-1"
              href="#"
              onClick={evt => {
                router.push({
                  pathname: '/[entity]/[search]',
                  query: { entity: 'gene', search: gene },
                })
              }}
            >{gene}</a>
          )}
        </p>
      )}
      {(item.similar_literature === undefined) || (item.similar_literature === null) ? null : (
        <p>
          <span style={{ fontWeight: 500 }}>Similar genes based on literature: </span>
          {item.similar_literature.map(gene =>
            <a
              key={gene}
              className="mx-1"
              href="#"
              onClick={evt => {
                router.push({
                  pathname: '/[entity]/[search]',
                  query: { entity: 'gene', search: gene },
                })
              }}
            >{gene}</a>
          )}
        </p>
      )}
    </div>
  )
}