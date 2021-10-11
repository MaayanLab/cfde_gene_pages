import 'bootstrap/dist/css/bootstrap.min.css'
import './_app.css'
import Head from 'next/head'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import getConfig from 'next/config'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFacebookF, faLinkedinIn, faTwitter } from '@fortawesome/free-brands-svg-icons'
import { faEnvelope } from '@fortawesome/free-solid-svg-icons'

const Analytics = dynamic(() => import('@/components/Analytics'))
const PDBeMolstarPluginContext = dynamic(() => import('@/components/PDBeMolstarWidget').then(({ PDBeMolstarPluginContext }) => PDBeMolstarPluginContext))
const CollapsibleNavbarNav = dynamic(() => import('@/components/CollapsibleNavbarNav'), { ssr: false })

export default function App({ Component, pageProps }) {
  const { publicRuntimeConfig } = getConfig()
  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="Gene and Drug Landing Page Aggregator" />
        <meta property="og:description"
              name="description"
              content={`${pageProps.search !== undefined ? ("Find knowledge about " + pageProps.search + " with the Gene and Drug Landing Page Aggregator") : ("Find knowledge about genes and drugs with the Gene and Drug Landing Page Aggregator")}`} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={`${publicRuntimeConfig.origin}/logos/thumbnail.png`} />
        <meta property="og:url" content={publicRuntimeConfig.origin} />
        <meta name="author" content="Ma'ayan Lab" />
        <link rel="shortcut icon" href="/logos/logo.png" type="image/x-icon" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#ffffff" />
        <title>Gene and Drug Landing Page Aggregator</title>
      </Head>

      <header>
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm px-3 py-2">
          <div className="container-fluid">

            <Link href="/" passHref>
              <a className="navbar-brand">
                <img height="40px" width="40px" style={{color: "white"}}  alt="CFDE Gene and Drug Landing Page Aggregator logo" src="/logos/logo.png"/>
                <strong>&nbsp; Gene and Drug Landing Page Aggregator</strong>
              </a>
            </Link>

            <CollapsibleNavbarNav>
              <Link href="/gene/" passHref><a className="nav-link" style={{color: "grey"}}>Gene Resources</a></Link>
              <Link href="/drug/" passHref><a className="nav-link" style={{color: "grey"}}>Drug Resources</a></Link>
            </CollapsibleNavbarNav>
          </div>
        </nav>
      </header>

      <main>
        <PDBeMolstarPluginContext>
          <Component {...pageProps} />
        </PDBeMolstarPluginContext>
        <Analytics />
      </main>
      <footer className="footer mt-auto text-muted pt-4 pb-3" style={{ backgroundColor: 'rgba(0, 0, 0, 0.1)' }}>
        <div className="container">
          <p className="float-end mb-1">
            <a
                className="btn btn-primary px-2 py-1 m-1"
                style={{ backgroundColor: '#3b5998', borderRadius: '20px' }}
                href="https://www.facebook.com/sharer/sharer.php?u=https://cfde-gene-pages.maayanlab.cloud/"
                role="button"
            ><FontAwesomeIcon width={16} height={16} icon={faFacebookF} /></a>
            <a
                className="btn btn-primary px-2 py-1 m-1"
                style={{ backgroundColor: '#55acee', borderRadius: '20px' }}
                href="https://twitter.com/intent/tweet?url=https://cfde-gene-pages.maayanlab.cloud/"
                role="button"
            ><FontAwesomeIcon width={16} height={16} icon={faTwitter} /></a>
            <a
                className="btn btn-primary px-2 py-1 m-1"
                style={{ backgroundColor: '#0082ca', borderRadius: '20px' }}
                href="https://www.linkedin.com/shareArticle?mini=true&url=https://cfde-gene-pages.maayanlab.cloud/"
                role="button"
            ><FontAwesomeIcon width={16} height={16} icon={faLinkedinIn} /></a>
            <a
                className="btn btn-primary px-2 py-1 m-1"
                style={{ backgroundColor: '#333333', borderRadius: '20px' }}
                href="mailto:info@example.com?&subject=&cc=&bcc=&body=https://cfde-gene-pages.maayanlab.cloud/"
                role="button"
            ><FontAwesomeIcon width={16} height={16} icon={faEnvelope} /></a>
          </p>
          <p className="mb-0">Prototype project developed by the CFDE Gene WG</p>
          <p className="mb-0"><a href="https://github.com/MaayanLab/cfde_gene_pages">Project's GitHub Repo</a></p>
          <p className="mb-0"><a href="https://docs.google.com/forms/d/1ifK44AvAay6JyUVXkKTzkHdX2QoWLRfZZ4T3sEFFR1U/">Suggest a new resource</a></p>
          <p><a href="#">Back to top</a></p>  </div>
      </footer>
    </>
  )
}
