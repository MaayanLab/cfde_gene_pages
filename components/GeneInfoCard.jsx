import dynamic from 'next/dynamic'

const PDBeMolstarWidget = dynamic(() => import('@/components/PDBeMolstarWidget'))

export default function GeneInfoCard({ router, search, organism, chromosome_location, ncbi_gene_id, ncbi_gene_url, biological_function, similar_coexpression, similar_literature, predicted_tfs, predicted_kinases, moleculeId }) {
    return (
        <div className="col-xl-4 col-lg-6 col-md-12">
            <div className="card shadow-sm m-3" title="Affiliated with the CFDE">
                <div className="card-header">
                    <div className="d-flex">
                        <div className="mx-3 mt-4 vertical-align text-nowrap text-center"><h1 style={{ whiteSpace: 'nowrap' }}>{search}</h1></div>
                        <div className="d-flex mt-2 flex-grow flex-wrap">
                            <p style={{ fontSize: ".875em" }}><span style={{ fontWeight: 500 }}>Organism</span>: {organism}</p>
                            <p style={{ fontSize: ".875em" }}><span style={{ fontWeight: 500 }}>Chromosome location</span>: {chromosome_location}</p>
                            <p style={{ fontSize: ".875em" }}><span style={{ fontWeight: 500 }}>NCBI Gene ID</span>: {ncbi_gene_id}</p>
                        </div>
                    </div>
                </div>
                <div className="card-body">
                    <div className="row">
                        <div className="col">
                            <PDBeMolstarWidget
                                style={{ width: '100%', height: 300 }}
                                options={{
                                    moleculeId,
                                    hideControls: true,
                                    hideCanvasControls: ['expand', 'selection', 'animation'],
                                    selectInteraction: false,
                                    bgColor: { r: 255, g: 255, b: 255 },
                                }}
                            />
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-12">
                            <p className="card-text" style={{ fontSize: '0.8rem' }}>
                                <span style={{ fontWeight: 500 }}>Biological function</span>: {biological_function} <a href={ncbi_gene_url}>...</a></p>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-8">
                            {similar_coexpression !== null ? (
                                <div className="card-text" style={{ fontSize: '0.8rem' }}><span style={{ fontWeight: 500 }}>Similar genes based on mRNA co-expression</span>:
                                    <p className="d-inline-flex">
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
                                    </p>
                                </div>
                            ) : null}
                            {similar_literature !== null ? (
                                <div className="card-text" style={{ fontSize: '0.8rem' }}><span style={{ fontWeight: 500 }}>Similar genes based on literature</span>:
                                    <p className="d-inline-flex">
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
                                    </p>
                                </div>
                            ) : null}
                            {predicted_tfs !== null ? (
                                <div className="card-text" style={{ fontSize: '0.8rem' }}><span style={{ fontWeight: 500 }}>Top 10 TF predicted to regulate {search}</span>:
                                    <p className="d-inline-flex">
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
                                    </p>
                                </div>
                            ) : null}
                            {predicted_kinases !== null ? (
                                <div className="card-text" style={{ fontSize: '0.8rem' }}><span style={{ fontWeight: 500 }}>Top 10 kinases predicted to phosphorylate {search}</span>:
                                    <p className="d-inline-flex">
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
                                    </p>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
