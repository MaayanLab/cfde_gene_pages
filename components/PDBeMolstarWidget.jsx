import React from 'react'
import Head from 'next/head'
import Script from 'next/script'

const PDBeMolstarPluginContext_ = React.createContext()

export function PDBeMolstarPluginContext({ children }) {
  const [instance, setInstance] = React.useState()
  return (
    <>
      <Head>
        <link rel="stylesheet" type="text/css" href="https://www.ebi.ac.uk/pdbe/pdb-component-library/css/pdbe-molstar-1.1.0.css" />
      </Head>
      <Script
        src="https://www.ebi.ac.uk/pdbe/pdb-component-library/js/pdbe-molstar-plugin-1.1.0.js"
        onLoad={() => setInstance(new PDBeMolstarPlugin())}
      />
      <PDBeMolstarPluginContext_.Provider value={instance}>
        {children}
      </PDBeMolstarPluginContext_.Provider>
    </>
  )
}

export default function PDBeMolstarWidget({ options, style, ...props }) {
  const ref = React.useRef()
  const instance = React.useContext(PDBeMolstarPluginContext_)
  React.useEffect(() => {
    if (!ref || !ref.current || !instance || !options) return
    instance.render(ref.current, options)
  }, [ref, instance, options])
  return (
    <div
      ref={ref}
      style={{
        position: 'relative',
        flex: '1 0 auto',
        ...(style||{}),
      }}
      {...props}
    />
  )
}
