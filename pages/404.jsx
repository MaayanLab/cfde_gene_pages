import React from "react"

/**
 * This is not the greatest but it works okay
 *  nextjs wants a static 404 handler for staticpages, but only supports
 *  one such global handler; but if your search returns an error, we'd like to
 *  still see the search page but with the error. To acheive this we redirect to
 *  whatever subpage error handler for whatever we were previously viewing (based on the URL).
 * 
 * Though this causes a refresh that the user may see, it will ultimately show something
 *  coherent after the redirect and at the same-time properly return a 404. This works okay
 *  though not perfectly, doing it perfectly would require manipulating nextjs internals;
 *  it's likely nextJS team will address this limitation in the future anyway.
 */
export default function NotFound(props) {
  React.useEffect(() => {
    // Redirect to sub-page-specific handler
    let searchParams = searchParams = new URLSearchParams(window.location.search)
    searchParams.set('path', window.location.pathname)
    searchParams = searchParams.toString()
    window.location.href = `./error?${searchParams}`
  }, [])
  return (
    <div className="text-center">The page you are looking for cannot be found</div>
  )
}