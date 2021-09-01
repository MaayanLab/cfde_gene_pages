export default function GeneInfoCard() {
  return (
    <div className="col-8">
      <div className="card shadow-sm m-3" title="Affiliated with the CFDE">
        <div className="card-header">
          <div className="row mb-3" style={{ height: '50px' }}>
            <div className="col-1 mb-3 mt-2 text-center"><h1>KL</h1></div>
            <div className="col-10 mt-4"><p><span style={{ fontWeight: 500 }}>Organism</span>: Homo sapiens <span
              style={{ fontWeight: 500 }}>Chromosome location</span>: 13q13.1 <span style={{ fontWeight: 500 }}>NCBI Gene ID</span>:
              9365</p></div>
          </div>
        </div>
        <div className="card-body row" style={{ height: '320px' }}>
          <div className="col-10">
            <p className="card-text" style={{ fontSize: '0.8rem' }}><span style={{ fontWeight: 500 }}>Biological function</span>: The Klotho peptide
              generated by cleavage of the membrane-bound isoform may be an anti-aging circulating hormone which
              would extend life span by inhibiting insulin/IGF1 signaling.</p>
            <p className="card-text" style={{ fontSize: '0.8rem' }}><span style={{ fontWeight: 500 }}>Similar genes based on mRNA co-expression</span>: <a
              href="">C1QA</a>, <a href="">C1QB</a>, <a href="">C1QC</a>, <a href="">CD93</a>, <a href="">GIMAP8</a>,
              <a href="">LYVE1</a>, <a href="">MRC1</a>, <a href="">PLVAP</a>, <a href="">TMEM176B</a>, <a
                href="">VSIG4</a></p>
            <p className="card-text" style={{ fontSize: '0.8rem' }}><span style={{ fontWeight: 500 }}>Similar genes based on literature</span>: <a
              href="">COL28A1</a>, <a href="">DPH6</a>, <a href="">MIR99AHG</a>, <a href="">PCNX2</a>, <a
                href="">PTCHD4</a>, <a href="">PUS7L</a>, <a href="">RALGPS1</a>, <a href="">RNF157</a>, <a
                  href="">TMEM117</a>, <a href="">TMEM232</a></p>
            <p className="card-text" style={{ fontSize: '0.8rem' }}><span style={{ fontWeight: 500 }}>Top 10 TF predicted to regulate KL</span>: <a
              href="">ANHX</a>, <a href="">ZGPAT</a>, <a href="">IKZF2</a>, <a href="">ZBTB32</a>, <a href="">POU2F2</a>,
              <a href="">SPI1</a>, <a href="">LYL1</a>, <a href="">PIN1</a>, <a href="">ZNF157</a>, <a href="">ATF6</a>
            </p>
            <p className="card-text" style={{ fontSize: '0.8rem' }}><span style={{ fontWeight: 500 }}>Top 10 kinases predicted to phosphorylate KL</span>:
              <a href="">SRC</a>, <a href="">AKT1</a>, <a href="">GSK3B</a>, <a href="">MAPK1</a>, <a
                href="">FYN</a>, <a href="">CSNK2A1</a>, <a href="">PLK1</a>, <a href="">CDK2</a>, <a
                  href="">EGFR</a>, <a href="">CDK1</a></p>
          </div>
          <div className="col-2">
            <svg className="bd-placeholder-img img-thumbnail" xmlns="http://www.w3.org/2000/svg" role="img"
              preserveAspectRatio="xMidYMid slice" focusable="false" width="170" height="300"><title>A generic
                square placeholder image with a white border around it, making it resemble a photograph taken with
                an old instant camera</title>
              <rect width="100%" height="100%" fill="#868e96"></rect>
              <text x="50%" y="50%" fill="#dee2e6" dy=".3em"></text>
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}