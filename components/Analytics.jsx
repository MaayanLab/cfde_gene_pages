import React from 'react'
import Script from 'next/script'
import getConfig from 'next/config'
import useRouterEx from '@/utils/routerEx'

export default function Analytics() {
  const router = useRouterEx()
  const { publicRuntimeConfig } = getConfig()
  const [basePath, setBasePath] = React.useState()
  React.useEffect(() => {
    if (!router.asPath) return
    const [_basePath, _1] = router.asPath.split('?', 1)
    if (basePath !== _basePath) {
      if (/[\[\]]/g.exec(_basePath) === null) {
        setBasePath(_basePath)
      }
    }
  }, [router.asPath, basePath])
  React.useEffect(() => {
    if (!window.gtag || !basePath) return
    window.gtag('js', new Date())
    window.gtag('config', publicRuntimeConfig.gaId)
  }, [basePath])
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${publicRuntimeConfig.gaId}`}
        strategy="lazyOnload"
        onLoad={() => {
          window.dataLayter = window.dataLayer || []
          window.gtag = (...args) => { dataLayer.push(args) }
          if (basePath) {
            window.gtag('js', new Date())
            window.gtag('config', publicRuntimeConfig.gaId)
          }
        }}
      />
    </>
  )
}
