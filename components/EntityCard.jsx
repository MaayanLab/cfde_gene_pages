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
        <div className="col-8 col-sm-4">
            <div className="card shadow-sm m-3" title={props.tags.CF ? "Affiliated with the CFDE" : undefined}>
                <div className="card-header" style={{
                    backgroundImage: props.tags.CF ? "url('/logos/CFDE_logo.png')" : undefined,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: props.tags.CF ? "97% 15%" : undefined,
                    backgroundSize: props.tags.CF ? "50px 27px" : undefined
                }}>
                    <div className="row mb-3"
                         style={{
                             height: "50px"
                         }}>
                        {props.img1 !== undefined ? (
                            <div className="col-4">
                                <img
                                    className="img-fluid rounded"
                                    src={props.img1.src}
                                    alt={props.img1.alt}
                                    style={{
                                        maxHeight: "60px"
                                    }}/>
                            </div>
                        ) : null}
                        <div className="col-7 mt-2">
                            <a
                                href={props.url}
                                target="_blank">
                                <h5 className="card-title">
                                    {props.title}
                                </h5></a>
                        </div>
                    </div>
                </div>
                <div className="card-body"
                     style={{
                         height: "400px"
                     }}>
                    {props.img2 !== undefined ? (
                        <div
                            className="pb-3"
                            style={{
                                maxWidth: "350px"
                            }}>
                            <img
                                className="img-fluid min-vw-70"
                                src={props.img2.src}
                                alt={props.img2.alt}
                                style={{
                                    minHeight: "100%"
                                }}/>
                        </div>
                    ) : null}
                    <p className="card-text">{props.description}</p>
                </div>
                <div className="card-footer"
                     style={{
                         height: "80px"
                     }}>
                        <div className="d-flex justify-content-between align-items-center">
                            {props.clickurl !== undefined ? (
                                <p className="mt-2"><a
                                    href={props.clickurl}
                                    target="_blank"
                                    onClick={() => countable(props.countapi).hit()}
                                >Explore {props.search} with {props.title}</a></p>
                            ) : null}
                            {clicks !== undefined ? <small
                                className="card-text text-muted mt-2">Clicks: <span>{clicks}</span></small> : null}
                        </div>
                </div>
            </div>
        </div>
    )
}
