import 'bootstrap/dist/css/bootstrap.min.css'
import './_app.css'
import Head from 'next/head'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFacebookF, faLinkedinIn, faTwitter } from '@fortawesome/free-brands-svg-icons'
import { faEnvelope } from '@fortawesome/free-solid-svg-icons'

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Gene and Drug Landing Page Aggregator" />
        <meta name="author" content="Ma'ayan Lab" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
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
        <div className="navbar navbar-dark bg-dark shadow-sm">
          <div className="container">
            <Link href="/" passHref>
              <a className="navbar-brand d-flex align-items-center">
                <img height="40px" width="30px" style={{ color: 'white' }} src="/logos/new_logo.png" />
                <strong>&nbsp; Gene and Drug Landing Page Aggregator</strong>
              </a>
            </Link>
            <Link href="/gene/" passHref><a className="nav-link" style={{ color: 'grey' }}>Gene Resources</a></Link>
            <Link href="/drug/" passHref><a className="nav-link" style={{ color: 'grey' }}>Drug Resources</a></Link>
          </div>
        </div>
      </header>
      <main className="flex-grow-1">
        <Component {...pageProps} />
      </main>
      <footer className="footer text-muted py-5" style={{ backgroundColor: 'rgba(0, 0, 0, 0.1)' }}>
        <div className="container">
          <p className="float-end mb-1">
            <a
              className="btn btn-primary btn-floating"
              style={{ backgroundColor: '#3b5998' }}
              href="https://www.facebook.com/sharer/sharer.php?u=https://maayanlab.github.io/cfde_gene_pages/index.html"
              role="button"
            ><FontAwesomeIcon icon={faFacebookF} /></a>
            <a
              className="btn btn-primary btn-floating"
              style={{ backgroundColor: '#55acee' }}
              href="https://twitter.com/intent/tweet?url=https://maayanlab.github.io/cfde_gene_pages/index.html&text="
              role="button"
            ><FontAwesomeIcon icon={faTwitter} /></a>
            <a
              className="btn btn-primary btn-floating"
              style={{ backgroundColor: '#0082ca' }}
              href="https://www.linkedin.com/shareArticle?mini=true&url=https://maayanlab.github.io/cfde_gene_pages/index.html"
              role="button"
            ><FontAwesomeIcon icon={faLinkedinIn} /></a>
            <a
              className="btn btn-primary btn-floating"
              style={{ backgroundColor: '#333333' }}
              href="mailto:info@example.com?&subject=&cc=&bcc=&body=https://maayanlab.github.io/cfde_gene_pages/index.html%0A"
              role="button"
            ><FontAwesomeIcon icon={faEnvelope} /></a>
          </p>
          <p className="mb-0">Prototype project developed by the CFDE Gene WG</p>
          <p className="mb-0"><a href="https://github.com/MaayanLab/cfde_gene_pages">Project's GitHub Repo</a></p>
          <p><a href="#">Back to top</a></p>
        </div>
      </footer>
    </>
  )
}