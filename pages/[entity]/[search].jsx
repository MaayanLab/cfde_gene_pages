import React from 'react'
import Head from 'next/head'
import dynamic from 'next/dynamic'
import callable from '@/utils/callable'
import full_manifest, {gene_id, drug_info, variant_to_gene} from '@/manifest'
import useRouterEx from '@/utils/routerEx'
import cmp from '@/manifest/cmp'
import capitalize from '@/utils/capitalize'
import is_variant from '@/utils/is_variant'

const EntityCard = dynamic(() => import('@/components/EntityCard'))
const SearchPage = dynamic(() => import('@/components/SearchPage'))
const GeneInfoCard = dynamic(() => import('@/components/GeneInfoCard'))
const SimilarityInfo = dynamic(() => import('@/components/SimilarityInfo'))
const VariantInfo = dynamic(() => import('@/components/VariantInfo'))

const components = {
    GeneInfoCard,
    EntityCard,
    SimilarityInfo,
    VariantInfo,
    [undefined]: EntityCard,
}

export async function getStaticPaths() {
    // const {gene_examples, drug_examples} = await import('@/manifest/examples')
    return {
        paths: [
            // ...gene_examples.map((search) => ({params: {entity: 'gene', search}})),
            // ...drug_examples.map((search) => ({params: {entity: 'drug', search}})),
        ],
        fallback: 'blocking',
    }
}

export async function getStaticProps({params: {entity, search}}) {
    const entities = { [entity]: search }
    if (search === 'error') {
        return {
            props: {error: true},
            revalidate: false,
        }
    }
    try {
        if (entity === 'gene') {
            if (is_variant(search)) {
                let variant_gene = await variant_to_gene(search)
                if (variant_gene === undefined) {
                    throw new Error('NotFound')
                }
                entities.variant = search
                entities.gene = variant_gene
                search = variant_gene
            } else if ((await gene_id(search)) === undefined) {
                throw new Error('NotFound')
            }
        } else if (entity === 'drug') {
            if ((await drug_info(search)) === undefined) throw new Error('NotFound')
        } else if (entity === 'variant') {
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
                    const entities_filtered = Object.keys(entities).filter(entity => entity in item.tags)
                    if (entities_filtered.length === 0) return
                    const entity = entities_filtered[0]
                    try {
                        const self = {}
                        for (const k in item) {
                            self[k] = await callable(item[k])({
                                self,
                                entity,
                                entities,
                                search,
                            })
                        }
                        if (!self.status) throw new Error('Bad status')
                        return self
                    } catch (e) {
                        console.warn(`${item.name} was not resolved for ${entity}: ${search}\n${e.stack}`)
                        return
                    }
                })
        )
    ).filter(v => v !== undefined)

    if (manifest.length === 0) {
        console.warn(`No items found for ${JSON.stringify({ entity, search })}`)
        return { notFound: true, props: {} }
    }

    manifest.sort(cmp)
    return {
        props: {
            entity,
            search,
            manifest,
        },
        revalidate: 60*60,
    }
}

export default function Search(props) {
    const router = useRouterEx()
    return (
        <>
            <Head>
                <title>Gene and Drug Landing Page Aggregator: {props.search} ({capitalize(props.entity)})</title>
            </Head>
            <SearchPage router={router} {...props}>{({router, CF, PS, Ag, gene, drug, variant}) => (
                props.manifest && !router.loading ? (
                    <div className="album pb-3">
                        <div className="container">
                            <div className="row">
                                {props.manifest
                                    .filter(item => {
                                        if (gene === true && !('gene' in item.output)) return false
                                        if (variant === true && !('gene' in item.output)) return false
                                        if (drug === true && !('drug' in item.output)) return false
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
                        </div>
                    </div>
                ) : null
            )}</SearchPage>
        </>
    )
}
