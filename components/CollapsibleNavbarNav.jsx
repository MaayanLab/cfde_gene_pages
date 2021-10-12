import React from 'react'
import { Collapse } from 'bootstrap'

export default function CollapsibleNavbarNav({ children }) {
  const navbarMenu = React.useRef()
  const [navbarExpanded, setNavbarExpanded] = React.useState(false)
  React.useEffect(() => {
    if (!navbarMenu || !navbarMenu.current) return
    const bsCollapse = new Collapse(navbarMenu.current, { toggle: false })
    if (navbarExpanded) {
      bsCollapse.show()
    } else {
      bsCollapse.hide()
    }
  }, [navbarExpanded, navbarMenu])
  return (
    <>
      <button className="navbar-toggler" type="button" data-bs-toggle="collapse"
              data-bs-target="#navbarNavAltMarkup" aria-controls="navbarNavAltMarkup"
              aria-expanded={navbarExpanded ? 'true': 'false'} aria-label="Toggle navigation"
              onClick={() => setNavbarExpanded(navbarExpanded => !navbarExpanded)}>
        <span className="navbar-toggler-icon"/>
      </button>
      <div ref={navbarMenu} className="collapse navbar-collapse" id="navbarNavAltMarkup">
        <div className="navbar-nav">
          {children}
        </div>
      </div>
    </>
  )
}
