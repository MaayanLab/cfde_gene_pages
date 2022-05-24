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
        <div className="col-xl-4 col-lg-6 col-md-12">
            <div className="card shadow-sm m-3" title={props.tags.CF ? "Affiliated with the CFDE" : undefined}>
                <div className="card-header" style={{
                    backgroundImage: props.tags.CF ? "url('/logos/CFDE_logo.png')" : undefined,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: props.tags.CF ? "97% 15%" : undefined,
                    backgroundSize: props.tags.CF ? "50px 27px" : undefined
                }}>
                    <div className="row mt-2"
                         style={{
                             height: "50px"
                         }}>
                        {(props.img3 !== undefined) && (props.img1 !== undefined) ? (
                            <>
                                <div className="col-4 text-center">
                                    <a
                                        href={props.url}
                                        target="_blank">
                                        <img
                                            className="img-fluid rounded"
                                            src={props.img3.src}
                                            alt={props.img3.alt}
                                            style={{
                                                maxHeight: "50px",
                                                maxWidth: "120px"
                                            }}/></a>
                                </div>
                                <div className="col-6">
                                    <a
                                        href={props.url}
                                        target="_blank">
                                        <img
                                            className="img-fluid rounded"
                                            src={props.img1.src}
                                            alt={props.img1.alt}
                                            style={{
                                                maxHeight: "50px",
                                                maxWidth: "120px",
                                            }}/></a>
                                </div>
                            </>
                        ) : null}
                        {(props.img3 === undefined) && (props.img1 !== undefined) ? (
                            <div className="col-6 col-sm-12 text-center">
                                <a
                                    href={props.url}
                                    target="_blank">
                                    <img
                                        className="img-fluid rounded"
                                        src={props.img1.src}
                                        alt={props.img1.alt}
                                        style={{
                                            maxHeight: "50px",
                                            maxWidth: "200px",
                                        }}/></a>
                            </div>
                        ) : null}
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
                    <p className="card-text">
                        <span>{props.description.split(props.title)[0]}</span>
                        <a href={props.url}>{props.title}</a>
                        <span>{props.description.split(props.title)[1]}</span></p>
                </div>
                <div className="card-footer"
                     style={{
                         height: "100px"
                     }}>
                    <div className="row mt-2">
                        {props.clickurl !== undefined && props.search !== undefined ? (
                            <div className="col-9">
                            <p>
                                <a
                                    href={props.clickurl}
                                    target="_blank"
                                    onClick={() => countable(props.countapi).hit()}
                                >Explore {props.search} with {props.title}</a></p></div>
                            ) : [(props.search === undefined) && (props.tags.gene) ? (
                            <div className="col-9">
                                <p>
                                    <a
                                        href={props.url}
                                        target="_blank"
                                        onClick={() => countable(props.countapi).hit()}
                                    >Explore genes and proteins with {props.title}</a></p></div>
                                ) : [(props.search === undefined) && (props.tags.drug) ? (
                            <div className="col-9">
                                    <p>
                                        <a
                                            href={props.url}
                                            target="_blank"
                                            onClick={() => countable(props.countapi).hit()}
                                        >Explore drugs and small molecules with {props.title}</a></p></div>
                                ) : [(props.search === undefined) && (props.tags.variant) ? (
                            <div className="col-9">
                                <p>
                                    <a
                                        href={props.url}
                                        target="_blank"
                                        onClick={() => countable(props.countapi).hit()}
                                    >Explore variants with {props.title}</a></p></div>
                        ) : null]]
                            ]
                        }
                        {clicks !== undefined ?
                        <div className="col-3">
                            <small
                            className="card-text text-muted text-end d-block"><span>{clicks}</span><img src="/images/click.png" className="mx-1 mb-2" width={18} height={18}/></small>
                        </div> : null}
                    </div>
                </div>
            </div>
        </div>
    )
}
