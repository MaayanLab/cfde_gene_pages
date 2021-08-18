/**
 * Some modifications to classic next/router for convenience
 * 
 * `.loading`: boolean tells you when between routes
 * `.query`: works consistently in specific circumstances
 * `.query`/`.loading` updated *before* a `push`
 */
import { useRouter } from 'next/router'
import React from 'react'

function *re_findall(pattern, string) {
  let m = pattern.exec(string)
  while (m !== null) {
    yield m
    m = pattern.exec(string)
  }
}

function fixup(pattern, path, query) {
  if (pattern === path) return query
  // get all variables in pattern
  let variables = [...re_findall(/\[([^\]]+)\]/g, pattern)].map(m => m[1])
  for (const variable of variables) {
    if (!(variable in query)) { // if a variable is missing from the query, a fixup is required
      // convert the pattern into a regex
      let pattern_re = pattern
      for (const variable of variables) {
        pattern_re = pattern_re.replace(`[${variable}]`, '([^/]+)')
      }
      pattern_re = new RegExp(`^${pattern_re.replaceAll(/\//g, '\\/')}(\\?(.+))$`)
      // match the path with the pattern regex
      const m = pattern_re.exec(path)
      if (m === null) throw new Error(`Could not parse ${path} with ${pattern}`)
      // grab the pattern variables
      let i = 1
      for (const variable of variables) {
        query[variable] = m[i++]
      }
      // grab the querystring variables
      const qs = new URLSearchParams(m[i+1])
      for (const [k, v] of qs) { query[k] = v }
      break // done
    }
  }
  // if all variables are accounted for, we'll use the original query
  return query
}

export default function useRouterEx() {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)
  const [query, setQuery] = React.useState(fixup(router.pathname, router.asPath, router.query))
  React.useEffect(() => {
    setQuery(fixup(router.pathname, router.asPath, router.query))
  }, [router.asPath])
  React.useEffect(() => {
    const start = () => setLoading(true)
    const stop = () => setLoading(false)
    router.events.on('routeChangeStart', start)
    router.events.on('routeChangeComplete', stop)
    router.events.on('routeChangeError', stop)
    return () => {
      router.events.off('routeChangeStart', start)
      router.events.off('routeChangeComplete', stop)
      router.events.off('routeChangeError', stop)
    }
  }, [])
  return {
    ...router,
    query,
    loading,
    push: ({ query, ...args }, as, opts) => {
      setQuery(query)
      if (!(opts||{}).shallow) {
        setLoading(true)
      }
      router.push({ query, ...args }, as, opts)
    },
  }
}
