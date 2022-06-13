import React from "react"
import {Tooltip} from "bootstrap"
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {faQuestionCircle} from '@fortawesome/free-solid-svg-icons'

export default function BootstrapTooltip({title}) {
    const ref = React.useRef()
    React.useEffect(() => {
        if (ref.current === null) return
        new Tooltip(ref.current)
    }, [ref])
    return (
        <span
            ref={ref}
            className="d-inline-block"
            tabIndex="0"
            data-bs-toggle="popover"
            data-bs-trigger="hover focus"
            title={title}>
            <sup>
                <FontAwesomeIcon
                    width={16} height={16}
                    icon={faQuestionCircle}
                    transform="up-1 left-1 shrink-4"
                />
            </sup>
    </span>
    )
}
