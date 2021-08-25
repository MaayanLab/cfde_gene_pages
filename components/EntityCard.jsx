import React from "react"
import countable from "@/utils/countable"

export default function EntityCard(props) {
    const [clicks, setClicks] = React.useState(props.clicks)
    React.useEffect(async () => {
        if (props.countapi !== undefined) {
            setClicks(await countable(props.countapi).get())
        }
    }, [props.countapi])
    return (
        <div className="card shadow-sm m-3 px-3 pt-2 pb-3" title={ props.tags.CF ? "Affiliated with the CFDE" : undefined } style={{
            backgroundImage: props.tags.CF ? "url('/logos/CFDE_logo.png')" : undefined,
            backgroundRepeat: "no-repeat",
            backgroundPosition: props.tags.CF ? "97% 2%" : undefined,
            backgroundSize: props.tags.CF ? "50px 27px" : undefined
        }}>
            {/*{props.img1 !== undefined ? (*/}
            {/*  <div className="card-image-wrapper-1">*/}
            {/*    <img className="card-img-top img-fluid" src={props.img1.src} alt={props.img1.alt} width="100%" height="100%" />*/}
            {/*  </div>*/}
            {/*) : null}*/}
            <div className="card-body">
                <div className="row mb-3">
                    {props.img1 !== undefined ? (
                        // <div className="card-image-wrapper-1">
                        <div className="col-4">
                            <img
                                className="img-fluid rounded"
                                src={props.img1.src}
                                alt={props.img1.alt}
                                style={{
                                    maxHeight: "50px",
                                    maxWidth: "100px"
                                }}/>
                        </div>
                        // </div>
                    ) : null}
                    {props.clickurl !== undefined ? (
                        <div className="col-7">
                            <a
                                href={props.url}
                                target="_blank">
                            <h5 className="card-title">
                                {props.title}
                            </h5></a>
                        </div>
                    ) : null}
                </div>
                {props.img2 !== undefined ? (
                    <div className="card-image-wrapper-2">
                        <img
                            className="card-img-top img-fluid"
                            src={props.img2.src}
                            alt={props.img2.alt}
                            style={{
                                height: "170px"
                            }}/>
                    </div>
                ) : null}
                {props.clickurl !== undefined ? (
                    <p><a
                        href={props.clickurl}
                        target="_blank"
                        onClick={() => countable(props.countapi).hit()}
                    >Explore {props.search} with {props.title}</a></p>
                ) : null}
                <p className="card-text">{props.description}</p>
                <div style={{
                    position: "absolute",
                    bottom: "15px"
                }}>
                    {clicks !== undefined ? <small className="card-text text-muted">Clicks: <span>{clicks}</span></small> : null}
                </div>
            </div>
        </div>
    )
}
