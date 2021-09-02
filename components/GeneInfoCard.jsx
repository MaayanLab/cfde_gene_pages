export default function GeneInfoCard({ search, organism, chromosome_location, ncbi_gene_id, biological_function, similar_coexpression, similar_literature, predicted_tf, predicted_kinases }) {
    return (
        <div className="col-lg-8 col-md-12">
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
                    <div className="col-10">
                        <p className="card-text" style={{ fontSize: '0.8rem' }}><span style={{ fontWeight: 500 }}>Biological function</span>: {biological_function}</p>
                        <p className="card-text" style={{ fontSize: '0.8rem' }}><span style={{ fontWeight: 500 }}>Similar genes based on mRNA co-expression</span>:
                            <div className="d-inline-flex">
                              {similar_coexpression.map(gene =>
                                <a className="mx-1" key={gene} href="">{gene}</a>
                              )}
                            </div>
                        </p>
                        <p className="card-text" style={{ fontSize: '0.8rem' }}><span style={{ fontWeight: 500 }}>Similar genes based on literature</span>:
                            <div className="d-inline-flex">
                              {similar_literature.map(gene =>
                                <a className="mx-1" key={gene} href="">{gene}</a>
                              )}
                            </div>
                        </p>
                        <p className="card-text" style={{ fontSize: '0.8rem' }}><span style={{ fontWeight: 500 }}>Top 10 TF predicted to regulate {search}</span>:
                            <div className="d-inline-flex">
                              {predicted_tfs.map(gene =>
                                <a className="mx-1" key={gene} href="">{gene}</a>
                              )}
                            </div>
                        </p>
                        <p className="card-text" style={{ fontSize: '0.8rem' }}><span style={{ fontWeight: 500 }}>Top 10 kinases predicted to phosphorylate {search}</span>:
                            <div className="d-inline-flex">
                              {predicted_kinases.map(gene =>
                                <a className="mx-1" key={gene} href="">{gene}</a>
                              )}
                            </div>
                        </p>
                    </div>
                    <div className="col-2">
                        <svg className="bd-placeholder-img img-thumbnail" xmlns="http://www.w3.org/2000/svg" role="img"
                            preserveAspectRatio="xMidYMid slice" focusable="false" width="170" height="300">
                            <title>A placeholder image</title>
                            <rect width="100%" height="100%" fill="#868e96"></rect>
                            <text x="50%" y="50%" fill="#dee2e6" dy=".3em"></text>
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    )
}
