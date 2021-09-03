import React from 'react'
import Head from 'next/head'
import dynamic from 'next/dynamic'
import callable from '@/utils/callable'
import memo from "@/utils/memo"
import full_manifest, {gene_id, gene_info, drug_info, expand, predict_regulators} from '@/manifest'
import useRouterEx from '@/utils/routerEx'
import cmp from '@/manifest/cmp'
import sorted from '@/utils/sorted'
import defined from '@/utils/defined'
import capitalize from '@/utils/capitalize'

const EntityCard = dynamic(() => import('@/components/EntityCard'))
const SearchPage = dynamic(() => import('@/components/SearchPage'))
// const GeneInfoCard = dynamic(() => import('@/components/GeneInfoCard'))

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

    // const gene_info_card = {
    //     gene_info: await gene_info(gene_id(search)),
    //     similar_coexpression: await  expand([search], 'coexpression'),
    //     similar_literature: await expand([search], 'generif'),
    //     predicted_tfs: await  predict_regulators([search], 'chea3'),
    //     predicted_kinases: await predict_regulators([search], 'kea3'),
    // }

    const manifest = (
        await Promise.all(
            full_manifest
                .map(async (item) => {
                    if (!(entity in item.tags)) return
                    try {
                        const self = {}
                        for (const k in item) {
                            self[k] = await defined(callable(item[k]))({
                                self,
                                search,
                            })
                        }
                        return self
                    } catch (e) {
                        console.warn(`${item.name} was not resolved: ${e}`)
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
            // gene_info_card
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
                                {/*<GeneInfoCard*/}
                                {/*    search={props.search}*/}
                                {/*    organism={props.gene_info_card.gene_info.organism}*/}
                                {/*    chromosome_location={props.gene_info_card.gene_info.chromosome_location}*/}
                                {/*    ncbi_gene_id={props.gene_info_card.gene_info.ncbi_gene_id}*/}
                                {/*    biological_function={props.gene_info_card.gene_info.ncbi_gene_id.biological_function}*/}
                                {/*    similar_coexpression={props.gene_info_card.similar_coexpression}*/}
                                {/*    similar_literature={props.gene_info_card.similar_literature}*/}
                                {/*    predicted_tfs={props.gene_info_card.predicted_tfs}*/}
                                {/*    predicted_kinases={props.gene_info_card.predicted_kinases}*/}
                                {/*/>*/}
                                {sortedManifest
                                    .filter(item => {
                                        if (CF === true && !('CF' in item.tags)) return false
                                        return (
                                            (PS === true && 'PS' in item.tags)
                                            || (Ag === true && 'Ag' in item.tags)
                                            || (PS === false && Ag === false)
                                        )
                                    })
                                    .map((item) => (
                                        <EntityCard
                                            key={item.name}
                                            {...item}
                                            search={props.search}
                                        />
                                    ))}
                            </div>
                        </div>
                    </div>
                ) : null
            )}</SearchPage>
        </>
    )
}
