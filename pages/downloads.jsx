import React from 'react'
import Head from 'next/head'

const storage = 'https://maayanlab-public.s3.amazonaws.com/cfde-gene-pages'

export async function getStaticProps() {
    const req = await fetch(`${storage}/manifest.json`)
    const manifest = await req.json()
    return {
        props: {
            manifest
        },
        revalidate: false
    }
}

export default function Downloads(props) {
    return (
        <>
            <Head>
                <title>Gene and Drug Landing Page Aggregator: Downloads</title>
            </Head>
            <div className="album py-5 bg-light">
                <div className="container">
                    <div className="row">
                        <div className="col">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th scope="col">Name</th>
                                        <th scope="col">Description</th>
                                        <th scope="col">Download Link</th>
                                        <th scope="col">Last Updated</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {props.manifest.map(download => (
                                        <tr key={download.filename}>
                                            <th scope="row">{download.name}</th>
                                            <td>{download.description}</td>
                                            <td><a href={`${storage}/${download.versions[download.latest]}`} download={download.filename}>{download.filename}</a></td>
                                            <td>{download.latest}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}