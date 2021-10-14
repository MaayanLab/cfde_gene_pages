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
    window.gtag('event', 'page_view', {
      page_title: document.title,
      page_location: location.href,
      page_path: location.pathname,
    })
  }, [basePath])
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${publicRuntimeConfig.gaId}`}
        strategy="lazyOnload"
        onLoad={() => {
          if (window.gtag !== undefined) return
          window.dataLayer = window.dataLayer || []
          window.gtag = (...args) => { window.dataLayer.push(args) }
          window.gtag('js', new Date())
          window.gtag('config', publicRuntimeConfig.gaId, { send_page_view: !!basePath })
        }}
      />
    </>
  )
}
