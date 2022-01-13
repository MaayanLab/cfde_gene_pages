import React from 'react'
import Head from 'next/head'

export default function Downloads() {
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
                                    <tr>
                                        <th scope="row">Gene Resource Manifest</th>
                                        <td>Gene resource links &amp; descriptions</td>
                                        <td><a href="https://maayanlab-public.s3.amazonaws.com/cfde-gene-pages/gene-manifest.tsv">gene-manifest.tsv</a></td>
                                        <td>2022-01-13</td>
                                    </tr>
                                    <tr>
                                        <th scope="row">Gene Accessibility Matrix</th>
                                        <td>Gene x Resource Matrix (1: available, 0: unavailable)</td>
                                        <td><a href="https://maayanlab-public.s3.amazonaws.com/cfde-gene-pages/genes.tsv">genes.tsv</a></td>
                                        <td>2021-10-18</td>
                                    </tr>
                                    <tr>
                                        <th scope="row">Drug Resource Manifest</th>
                                        <td>Drug resource links &amp; descriptions</td>
                                        <td><a href="https://maayanlab-public.s3.amazonaws.com/cfde-gene-pages/drug-manifest.tsv">drug-manifest.tsv</a></td>
                                        <td>2022-01-13</td>
                                    </tr>
                                    <tr>
                                        <th scope="row">Drug Accessibility Matrix</th>
                                        <td>Drug x Resource Matrix (1: available, 0: unavailable)</td>
                                        <td><a href="https://maayanlab-public.s3.amazonaws.com/cfde-gene-pages/drugs.tsv">drugs.tsv</a></td>
                                        <td>2021-10-18</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}