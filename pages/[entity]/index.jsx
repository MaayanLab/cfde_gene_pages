import React from 'react'
import full_manifest from '@/manifest'
import dynamic from 'next/dynamic'
import cmp from '@/manifest/cmp'
import callable from '@/utils/callable'
import Head from 'next/head'
import capitalize from '@/utils/capitalize'

const EntityCard = dynamic(() => import('@/components/EntityCard'))

const components = {
    EntityCard,
    [undefined]: EntityCard,
}

export async function getStaticPaths() {
    return {
        paths: [
            {params: {entity: 'gene'}},
            {params: {entity: 'drug'}},
        ],
        fallback: false,
    }
}

export async function getStaticProps({params: {entity}}) {
    if (entity !== 'gene' && entity !== 'drug') return {notFound: true}
    const manifest = (
        await Promise.all(
            full_manifest
                .map(async (item) => {
                    if (!(entity in item.tags) || ('searchonly' in item.tags)) return
                    try {
                        const self = {}
                        for (const k in item) {
                            self[k] = await callable(item[k])({
                                self,
                            })
                        }
                        return self
                    } catch (e) {
                        console.warn(`${item.name} was not resolved for ${entity}\n${e.stack}`)
                        return
                    }
                })
        )
    ).filter(v => v !== undefined)
    manifest.sort(cmp)
    return {props: {entity, manifest}, revalidate: 60*60}
}

export default function Entity(props) {
    return (
        <>
            <Head>
                <title>Gene and Drug Landing Page Aggregator: ({capitalize(props.entity)})</title>
            </Head>
            <div className="album py-5 bg-light">
                <div className="container">
                    <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-3">
                        {props.manifest
                            .map(({ component, ...item }) => ({ Component: components[component], ...item }))
                            .filter(({ Component }) => Component !== undefined)
                            .map(({ Component, ...item }) => {
                                return (
                                    <Component
                                        key={item.name}
                                        {...item}
                                    />
                                )
                            })}
                    </div>
                </div>
            </div>
        </>
    )
}
