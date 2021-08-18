import React from "react"

export default function EntityCard(props) {
  const [clicks, setClicks] = React.useState(props.clicks)
  React.useEffect(async () => {
    if (props.countapi !== undefined) {
      setClicks(await props.countapi.get())
    }
  }, [props.countapi])
  return (
    <div className="card shadow-sm" style={{ backgroundColor: props.tags.CF ? 'rgba(0, 0, 0, 0.2)' : undefined }}>
      {props.img1 !== undefined ? (
        <div className="card-image-wrapper-1">
          <img className="card-img-top img-fluid" src={props.img1.src} alt={props.img1.alt} width="100%" height="100%" />
        </div>
      ) : null}
      {props.img2 !== undefined ? (
        <div className="card-image-wrapper-2">
          <img className="card-img-top img-fluid" src={props.img2.src} alt={props.img2.alt} width="100%" height="100%" />
        </div>
      ) : null}
      <div className="card-body">
        <h4 className="card-title">
          {props.title}
          {props.resolved_url !== undefined ? (
            <span>: <a href={props.resolved_url}>{props.search}</a></span>
          ) : null}
        </h4>
        <p className="card-text">{props.description}</p>
        <div className="d-flex justify-content-between align-items-center">
          <div className="btn-group">
            <a
              className="btn btn-sm btn-outline-primary"
              target="_blank"
              role="button"
              onClick={() => props.countapi.hit()}
              href={props.url}
            >View on Site</a>
          </div>
          {clicks !== undefined ? <p>Clicks: <span>{clicks}</span></p> : null}
        </div>
      </div>
    </div>
  )
}
