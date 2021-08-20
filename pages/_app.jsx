import 'bootstrap/dist/css/bootstrap.min.css'
import './_app.css'
import Head from 'next/head'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFacebookF, faLinkedinIn, faTwitter } from '@fortawesome/free-brands-svg-icons'
import { faEnvelope } from '@fortawesome/free-solid-svg-icons'
import dynamic from 'next/dynamic'

const Analytics = dynamic(() => import('@/components/Analytics'))

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Gene and Drug Landing Page Aggregator" />
        <meta name="author" content="Ma'ayan Lab" />
        <link rel="shortcut icon" href="/logos/logo.png" type="image/x-icon" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#ffffff" />
      </Head>
      <header>
        <div className="collapse bg-dark" id="navbarHeader">
          <div className="container">
            <div className="row">
              <div className="col-sm-8 col-md-7 py-4">
                <h4 className="text-white">About</h4>
              </div>
              <div className="col-sm-4 offset-md-1 py-4">
                <h4 className="text-white">More</h4>
              </div>
            </div>
          </div>
        </div>
        <div className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm px-3 py-2">
          <div className="container-fluid">
            <Link href="/" passHref>
              <a className="navbar-brand d-flex align-items-center">
                <img height="40px" width="40px" style={{ color: 'white' }} src="/logos/logo.png" />
                <strong>&nbsp; Gene and Drug Landing Page Aggregator</strong>
              </a>
            </Link>
            <div className="navbar-collapse collapse">
              <div className="navbar-nav">
                <Link href="/gene/" passHref><a className="nav-link" style={{color: 'grey'}}>Gene Resources</a></Link>
                <Link href="/drug/" passHref><a className="nav-link" style={{color: 'grey'}}>Drug Resources</a></Link>
              </div>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-grow-1">
        <Component {...pageProps} />
        <Analytics />
      </main>
      <footer className="footer text-muted py-5" style={{ backgroundColor: 'rgba(0, 0, 0, 0.1)' }}>
        <div className="container">
          <p className="float-end mb-1">
            <a
              className="btn btn-primary px-2 py-1 m-1"
              style={{ backgroundColor: '#3b5998', borderRadius: '20px' }}
              href="https://www.facebook.com/sharer/sharer.php?u=https://maayanlab.github.io/cfde_gene_pages/index.html"
              role="button"
            ><FontAwesomeIcon width={16} height={16} icon={faFacebookF} /></a>
            <a
              className="btn btn-primary px-2 py-1 m-1"
              style={{ backgroundColor: '#55acee', borderRadius: '20px' }}
              href="https://twitter.com/intent/tweet?url=https://maayanlab.github.io/cfde_gene_pages/index.html&text="
              role="button"
            ><FontAwesomeIcon width={16} height={16} icon={faTwitter} /></a>
            <a
              className="btn btn-primary px-2 py-1 m-1"
              style={{ backgroundColor: '#0082ca', borderRadius: '20px' }}
              href="https://www.linkedin.com/shareArticle?mini=true&url=https://maayanlab.github.io/cfde_gene_pages/index.html"
              role="button"
            ><FontAwesomeIcon width={16} height={16} icon={faLinkedinIn} /></a>
            <a
              className="btn btn-primary px-2 py-1 m-1"
              style={{ backgroundColor: '#333333', borderRadius: '20px' }}
              href="mailto:info@example.com?&subject=&cc=&bcc=&body=https://maayanlab.github.io/cfde_gene_pages/index.html%0A"
              role="button"
            ><FontAwesomeIcon width={16} height={16} icon={faEnvelope} /></a>
          </p>
          <p className="mb-0">Prototype project developed by the CFDE Gene WG</p>
          <p className="mb-0"><a href="https://github.com/MaayanLab/cfde_gene_pages">Project's GitHub Repo</a></p>
          <p><a href="#">Back to top</a></p>
        </div>
      </footer>
    </>
  )
}
