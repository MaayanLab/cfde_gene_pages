export default function GeneInfoCard({ router, search, organism, chromosome_location, ncbi_gene_id, biological_function, similar_coexpression, similar_literature, predicted_tfs, predicted_kinases, protein3d }) {
    return (
        <div className="col-lg-4 col-md-6 col-sm-12">
            <div className="card shadow-sm m-3" title="Affiliated with the CFDE">
                <div className="card-header">
                    <div className="d-flex mt-2 mb-3">
                        <div className="m-3 vertical-align text-nowrap text-center"><h1 style={{ whiteSpace: 'nowrap' }}>{search}</h1></div>
                        <div className="d-flex mt-2 flex-grow flex-wrap">
                            <div className="mx-2 text-nowrap"><span style={{ fontWeight: 500 }}>Organism</span>: {organism}</div>
                            <div className="mx-2 text-nowrap"><span style={{ fontWeight: 500 }}>Chromosome location</span>: {chromosome_location}</div>
                            <div className="mx-2 text-nowrap"><span style={{ fontWeight: 500 }}>NCBI Gene ID</span>: {ncbi_gene_id}</div>
                        </div>
                    </div>
                </div>
                <div className="card-body row">
                    <div className="row">
                        <div className="col-12">
                            <p className="card-text" style={{ fontSize: '0.8rem' }}><span style={{ fontWeight: 500 }}>Biological function</span>: {biological_function}</p>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-8">
                            {similar_coexpression !== null ? (
                                <p className="card-text" style={{ fontSize: '0.8rem' }}><span style={{ fontWeight: 500 }}>Similar genes based on mRNA co-expression</span>:
                                    <div className="d-inline-flex">
                                        {similar_coexpression.map(gene =>
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
                                    </div>
                                </p>
                            ) : null}
                            {similar_literature !== null ? (
                                <p className="card-text" style={{ fontSize: '0.8rem' }}><span style={{ fontWeight: 500 }}>Similar genes based on literature</span>:
                                    <div className="d-inline-flex">
                                        {similar_literature.map(gene =>
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
                                    </div>
                                </p>
                            ) : null}
                            {predicted_tfs !== null ? (
                                <p className="card-text" style={{ fontSize: '0.8rem' }}><span style={{ fontWeight: 500 }}>Top 10 TF predicted to regulate {search}</span>:
                                    <div className="d-inline-flex">
                                        {predicted_tfs.map(gene =>
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
                                    </div>
                                </p>
                            ) : null}
                            {predicted_kinases !== null ? (
                                <p className="card-text" style={{ fontSize: '0.8rem' }}><span style={{ fontWeight: 500 }}>Top 10 kinases predicted to phosphorylate {search}</span>:
                                    <div className="d-inline-flex">
                                        {predicted_kinases.map(gene =>
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
                                    </div>
                                </p>
                            ) : null}
                        </div>
                        <div className="col-4">
                            <iframe className="img-fluid"
                                    src={protein3d}
                                    style={{ border: "none" }}/>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
