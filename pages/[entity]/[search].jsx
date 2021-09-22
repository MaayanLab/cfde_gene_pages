import React from 'react'
import Head from 'next/head'
import dynamic from 'next/dynamic'
import callable from '@/utils/callable'
import memo from "@/utils/memo"
import full_manifest, {gene_id, gene_info, drug_info, expand, predict_regulators} from '@/manifest'
import useRouterEx from '@/utils/routerEx'
import cmp from '@/manifest/cmp'
import sorted from '@/utils/sorted'
import capitalize from '@/utils/capitalize'

const EntityCard = dynamic(() => import('@/components/EntityCard'))
const SearchPage = dynamic(() => import('@/components/SearchPage'))
const GeneInfoCard = dynamic(() => import('@/components/GeneInfoCard'))

const components = {
    GeneInfoCard,
    EntityCard,
    [undefined]: EntityCard,
}

export async function getStaticPaths() {
    const {gene_examples, drug_examples} = await import('@/manifest/examples')
    return {
        paths: [
            ...gene_examples.map((search) => ({params: {entity: 'gene', search}})),
            ...drug_examples.map((search) => ({params: {entity: 'drug', search}})),
        ],
        fallback: 'blocking',
    }
}

export async function getStaticProps({params: {entity, search}}) {
    if (search === 'error') {
        return {
            props: {error: true},
            revalidate: false,
        }
    }
    try {
        if (entity === 'gene') {
            if ((await gene_id(search)) === undefined) throw new Error('NotFound')
        } else if (entity === 'drug') {
            if ((await drug_info(search)) === undefined) throw new Error('NotFound')
        } else {
            throw new Error('NotFound')
        }
    } catch (e) {
        return {notFound: true, props: {}}
    }

    const manifest = (
        await Promise.all(
            full_manifest
                .map(async (item) => {
                    if (!(entity in item.tags)) return
                    try {
                        const self = {}
                        for (const k in item) {
                            self[k] = await callable(item[k])({
                                self,
                                search,
                            })
                        }
                        return self
                    } catch (e) {
                        console.warn(`${item.name} was not resolved\n${e.stack}`)
                        return
                    }
                })
        )
    ).filter(v => v !== undefined)
    return {
        props: {
            entity,
            search,
            manifest,
        },
        revalidate: false,
    }
}

export default function Search(props) {
    const router = useRouterEx()
    const sortedManifest = React.useMemo(() => sorted(props.manifest, cmp), [props.manifest])
    return (
        <>
            <Head>
                <title>Gene and Drug Landing Page Aggregator: {props.search} ({capitalize(props.entity)})</title>
            </Head>
            <SearchPage router={router} {...props}>{({router, CF, PS, Ag}) => (
                props.manifest && !router.loading ? (
                    <div className="album pb-5">
                        <div className="container">
                            <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-3 justify-content-center">
                                {sortedManifest
                                    .filter(item => {
                                        if ('pinned' in item.tags) return true
                                        if (CF === true && !('CF' in item.tags)) return false
                                        return (
                                            (PS === true && 'PS' in item.tags)
                                            || (Ag === true && 'Ag' in item.tags)
                                            || (PS === false && Ag === false)
                                        )
                                    })
                                    .map(({component, ...item}) => {
                                        const Component = components[component]
                                        return (
                                            <Component
                                                key={item.name}
                                                router={router}
                                                {...item}
                                                search={props.search}
                                            />
                                        )
                                    })}
                            </div>

                            {sortedManifest
                                .filter(item => {
                                    if (item.name === 'ARCHS4') return true
                                }).map(({component, ...item}) => {
                                    return (
                                        <div className="row justify-content-center mt-5">
                                            <div className="col-12">
                                                <p>
                                                    {(item.similar_coexpression === undefined) || (item.similar_coexpression === null)
                                                        ? ''
                                                        :<span style={{fontWeight: 500}}>Similar genes based on mRNA co-expression: </span>}
                                                    {(item.similar_coexpression === undefined) || (item.similar_coexpression === null)
                                                    ? ''
                                                    : item.similar_coexpression.map(gene =>
                                                        <a
                                                            key={gene}
                                                            className="mx-1"
                                                            href="#"
                                                            onClick={evt => {
                                                                router.push({
                                                                    pathname: '/[entity]/[search]',
                                                                    query: {entity: 'gene', search: gene},
                                                                })
                                                            }}
                                                        >{gene}</a>
                                                    )}
                                                </p>
                                                <p>
                                                    {(item.similar_literature === undefined) || (item.similar_literature === null)
                                                        ? ''
                                                        : <span style={{fontWeight: 500}}>Similar genes based on literature: </span>}
                                                    {(item.similar_literature === undefined) || (item.similar_literature === null)
                                                    ? ''
                                                    : item.similar_literature.map(gene =>
                                                        <a
                                                            key={gene}
                                                            className="mx-1"
                                                            href="#"
                                                            onClick={evt => {
                                                                router.push({
                                                                    pathname: '/[entity]/[search]',
                                                                    query: {entity: 'gene', search: gene},
                                                                })
                                                            }}
                                                        >{gene}</a>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                })
                            }
                        </div>
                    </div>
                ) : null
            )}</SearchPage>
        </>
    )
}
