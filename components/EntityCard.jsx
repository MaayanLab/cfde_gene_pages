import React from "react"

export default function EntityCard(props) {
    const [clicks, setClicks] = React.useState(props.clicks)
    React.useEffect(async () => {
        if (props.countapi !== undefined) {
            setClicks(await props.countapi.get())
        }
    }, [props.countapi])
    return (
        <div className="card shadow-sm m-3 px-3 pt-2 pb-3" style={{
            backgroundImage: props.tags.CF ? "url('/logos/CF_logo.png')" : undefined,
            backgroundRepeat: "no-repeat",
            backgroundPosition: props.tags.CF ? "right top" : undefined,
            backgroundSize: props.tags.CF ? "60px 48px" : undefined
        }}>
            {/*{props.img1 !== undefined ? (*/}
            {/*  <div className="card-image-wrapper-1">*/}
            {/*    <img className="card-img-top img-fluid" src={props.img1.src} alt={props.img1.alt} width="100%" height="100%" />*/}
            {/*  </div>*/}
            {/*) : null}*/}
            {props.img2 !== undefined ? (
              <div className="card-image-wrapper-2">
                <img className="card-img-top img-fluid" src={props.img2.src} alt={props.img2.alt} width="100%" height="100%" />
              </div>
            ) : null}
            <div className="card-body">

                <div className="row mb-3">
                    {props.img1 !== undefined ? (
                        // <div className="card-image-wrapper-1">
                        <div className="col-sm-4">
                            <img className="img-fluid rounded" src={props.img1.src} alt={props.img1.alt}/>
                        </div>
                        // </div>
                    ) : null}
                    {props.resolved_url !== undefined ? (
                        <div className="col-sm-8">
                            <h5 className="card-title">
            <span><a
                href={props.resolved_url}
                target="_blank"
                onClick={() => props.countapi.hit()}
            >{props.title}</a></span>
                            </h5>
                        </div>
                    ) : null}
                </div>

                <p className="card-text">{props.description}</p>
                <div className="d-flex justify-content-between align-items-center">
                    {/*<div className="btn-group">*/}
                    {/*  <a*/}
                    {/*    className="btn btn-sm btn-outline-primary"*/}
                    {/*    target="_blank"*/}
                    {/*    role="button"*/}
                    {/*    onClick={() => props.countapi.hit()}*/}
                    {/*    href={props.url}*/}
                    {/*  >View on Site</a>*/}
                    {/*</div>*/}
                    {clicks !== undefined ? <p>Clicks: <span>{clicks}</span></p> : null}
                </div>
            </div>
        </div>
    )
}
