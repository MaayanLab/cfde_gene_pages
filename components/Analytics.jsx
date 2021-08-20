import React from 'react'
import getConfig from 'next/config'
import ReactGA from 'react-ga'
import useRouterEx from '@/utils/routerEx'

export default function Analytics() {
  const router = useRouterEx()
  const [basePath, setBasePath] = React.useState()
  React.useEffect(() => {
    if (!window.GA_INITIALIZED) {
      const { publicRuntimeConfig } = getConfig()
      ReactGA.initialize(publicRuntimeConfig.gaId)
      window.GA_INITIALIZED = true
    }
  }, [])
  React.useEffect(() => {
    if (!router.asPath) return
    const [_basePath, _1] = router.asPath.split('?', 1)
    if (basePath !== _basePath) {
      if (/[\[\]]/g.exec(_basePath) === null) {
        setBasePath(_basePath)
      }
    }
  }, [router.asPath])
  React.useEffect(() => {
    if (!basePath) return
    ReactGA.pageview(basePath)
  }, [basePath])
  return null
}
