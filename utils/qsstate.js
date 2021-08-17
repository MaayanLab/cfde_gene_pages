import React from 'react'
import { useRouter } from 'next/router'

export function useQsState(paramName, initialState, Codec) {
  if (Codec === undefined) Codec = JSON
  const initialStateString = Codec.stringify(initialState)
  const router = useRouter()
  const [param, setParam] = React.useState(paramName in router.query ? Codec.parse(router.query[paramName]) : initialState)
  React.useEffect(() => {
    if (paramName in router.query && router.query[paramName] !== Codec.stringify(param)) {
      setParam(Codec.parse(router.query[paramName]))
    }
  }, [router.query])
  React.useEffect(() => {
    let paramString = Codec.stringify(param)
    if (paramString === initialStateString) {
      paramString = undefined
    }
    if (router.query[paramName] !== paramString) {
      const query = {...router.query}
      if (paramString === undefined) {
        delete query[paramName]
        router.replace({
          pathname: router.pathname,
          query,
        }, undefined, { shallow: true })
      } else {
        query[paramName] = paramString
        router.replace({
          pathname: router.pathname,
          query,
        }, undefined, { shallow: true })
      }
    }
  }, [param])
  return [param, setParam]
}
