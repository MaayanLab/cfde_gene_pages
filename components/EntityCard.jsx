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
        <div className="col">
            <div className="card shadow-sm m-3" title={props.tags.CF ? "Affiliated with the CFDE" : undefined}>
                <div className="card-header" style={{
                    backgroundImage: props.tags.CF ? "url('/logos/CFDE_logo.png')" : undefined,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: props.tags.CF ? "97% 15%" : undefined,
                    backgroundSize: props.tags.CF ? "50px 27px" : undefined
                }}>
                    <div className="row mb-3">
                        {props.img1 !== undefined ? (
                            // <div className="card-image-wrapper-1">
                            <div className="col-4"
                                 style={{
                                     height: "50px"
                                 }}>
                                <img
                                    className="img-fluid rounded"
                                    src={props.img1.src}
                                    alt={props.img1.alt}
                                    style={{
                                        height: "100%"
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
                </div>
                {/*{props.img1 !== undefined ? (*/}
                {/*  <div className="card-image-wrapper-1">*/}
                {/*    <img className="card-img-top img-fluid" src={props.img1.src} alt={props.img1.alt} width="100%" height="100%" />*/}
                {/*  </div>*/}
                {/*) : null}*/}
                <div className="card-body">
                    {props.img2 !== undefined ? (
                        <div
                            className="card-image-wrapper-2"
                            style={{
                                height: "150px"
                            }}>
                            <img
                                className="img-fluid"
                                src={props.img2.src}
                                alt={props.img2.alt}
                                style={{
                                    height: "100%"
                                }}/>
                        </div>
                    ) : null}
                    <p className="card-text">{props.description}</p>
                </div>
                <div className="card-footer">
                    <div className="container">
                        {clicks !== undefined ? <small
                            className="card-text text-muted float-end">Clicks: <span>{clicks}</span></small> : null}
                        {props.clickurl !== undefined ? (
                            <p><a
                                href={props.clickurl}
                                target="_blank"
                                onClick={() => countable(props.countapi).hit()}
                            >Explore {props.search} with {props.title}</a></p>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    )
}
