import memo from '@/utils/memo'
import defined from '@/utils/defined'
import countable from "@/utils/countable"
import isitup from "@/utils/isitup"
import try_or_else from "@/utils/try_or_else"
import ensure_array from "@/utils/ensure_array"
import argmax from "@/utils/argmax"
import fetchEx from '@/utils/fetchEx'
import FormData from 'form-data'

function if_search(func) {
    return async (props) => {
        if (props.search !== undefined) {
            return await func(props)
        } else {
            return null
        }
    }
}

const gene_query_url = 'https://mygene.info/v3'
const variant_query_url = 'https://myvariant.info/v1'

const species_map = {
    '9606': 'Homo sapiens',
    '6239': 'Caenorhabditis elegans',
    '7955': 'Danio rerio',
    '7227': 'Drosophila melanogaster',
    '10090': 'Mus musculus'
}

export const gene_id = defined(memo(async (gene_search) => {
    let gene_res = await fetchEx(`${gene_query_url}/query?q=symbol:${gene_search}`)
    if (gene_res.ok) {
        let data = await gene_res.json()
        if (Array.isArray(data.hits)) {
            if (data.hits.length > 0) {
                return data.hits[0]._id
            }
        }
    }
}))

const expand_gene = defined(memo(async (gene_search, exp_type = "coexpression", top = 5) => {
    const gene_exp = await fetchEx(`https://maayanlab.cloud/enrichrsearch/gene/expand?search=${gene_search}&top=${top}&type=${exp_type}`)
    if (gene_exp.ok) {
        const { data, success } = await gene_exp.json()
        if ((Array.isArray(data)) && success) {
            if (data.length > 0) {
                return data
            }
        }
    }
}))

const expand_drug = defined(memo(async (drug_search, exp_type = "L1000_coexpression", top = 5) => {
    const gene_exp = await fetchEx(`https://maayanlab.cloud/enrichrsearch/drug/expand?search=${drug_search}&top=${top}&type=${exp_type}`)
    if (gene_exp.ok) {
        const { data, success } = await gene_exp.json()
        if ((Array.isArray(data)) && success) {
            if (data.length > 0) {
                return data
            }
        }
    }
}))

const gene_drug_rif = defined(memo(async (gene) => {
    const lookup = await import('@/public/gene_drug_rif/gene_drug.json')
    return lookup[gene]
}))

const drug_gene_rif = defined(memo(async (drug) => {
    const lookup = await import('@/public/gene_drug_rif/drug_gene.json')
    return lookup[drug.toLowerCase()]
}))


// const predict_regulators = defined(memo(async (genes, type_url, top = 5) => {
//     const results = await fetchEx(`https://maayanlab.cloud/${type_url}/api/enrich/`, {
//         method: 'POST',
//         headers: {
//             "Content-Type": "application/json"
//         },
//         body: JSON.stringify({
//             query_name: "gene_set_query",
//             gene_set: genes
//         }),
//     })
//     if (results.ok) {
//         const response = await results.json()
//         return response['Integrated--meanRank'].slice(0, top).map(d => d.TF)
//     }
// }))

const gene_info = defined(memo(try_or_else(async (gene_search) => {
    const gene_res = await fetchEx(`${gene_query_url}/gene/${await gene_id(gene_search)}`)
    if (!gene_res.ok) throw new Error('gene_info status is not OK')
    return await gene_res.json()
})))


export const variant_to_gene = defined(memo(async (variant) => {
    const myvariant = await fetchEx(`${variant_query_url}/variant/${variant}`);
    if (myvariant.ok) {
        let myvariant_json = await myvariant.json()
        // We don't care about the exact nucleotide-nucleotide variation, so we choose the first one for rsIDs
        if (Array.isArray(myvariant_json)) myvariant_json = myvariant_json[0];
        if ('dbsnp' in myvariant_json) {
            if ('gene' in myvariant_json.dbsnp) {
                let gene = myvariant_json.dbsnp.gene;
                // First gene is usually the one that makes sense both literally and figuratively
                // i.e. we're not interested in antisense RNAs etc
                if (Array.isArray(gene)) gene = gene[0]
                return gene.symbol
            }
        }
    }
}))

const liftover = defined(memo(try_or_else(async (chr_c, conv = "hg38-to-hg19") => {
    const coord = await fetchEx(`https://spliceailookup-api.broadinstitute.org/liftover/?hg=${conv}&format=interval&chrom=${chr_c['chr']}&start=${chr_c['pos']}&end=${chr_c['pos'] + 1}`)
    if (!coord.ok) throw new Error('gene_info status is not OK')
    else return await coord.json();
})))

export const rsid = defined(memo(async (variant) => {
    const myvariant = await fetchEx(`${variant_query_url}/variant/${variant}`);
    if (myvariant.ok) {
        let myvariant_json = await myvariant.json()
        if (Array.isArray(myvariant_json)) myvariant_json = myvariant_json[0];
        return myvariant_json['dbsnp']['rsid']
    }
}))

export const chr_coord = defined(memo(async (variant, fill_template) => {

    let chr, pos, ref_alt, ref, alt;
    let myvariant = await fetchEx(`${variant_query_url}/variant/${variant}`);
    let myvariant_json;

    if (myvariant.ok) {
        myvariant_json = await myvariant.json()
        // Switch from rsid to coordinates
        variant = myvariant_json['_id'];
        chr = variant.split(':')[0];
        pos = parseInt(variant.split(':')[1].split('.')[1].slice(0, -3));
        ref_alt = variant.slice(-3);
        ref = ref_alt.split('>')[0];
        alt = ref_alt.split('>')[1];
    }
    else {
        // Probably hg38. Convert to hg19 to use with MyVariant.info
        chr = variant.split(':')[0];
        pos = parseInt(variant.split(':')[1].split('.')[1].slice(0, -3));
        ref_alt = variant.slice(-3);
        ref = ref_alt.split('>')[0];
        alt = ref_alt.split('>')[1];
        let hg19 = await liftover({ chr: chr, pos: pos });
        variant = `${hg19['output_chrom']}:g.${hg19['output_start']}${ref_alt}`
        let myvariant = await fetchEx(`${variant_query_url}/variant/${variant}`);
        if (myvariant.ok) {
            myvariant_json = await myvariant.json()
        }
    }
    // Choose the recent version
    if (Array.isArray(myvariant_json)) myvariant_json = myvariant_json[0];
    // Convert to hg38 for output
    let hg38 = await liftover({ chr: myvariant_json['chrom'], pos: parseInt(myvariant_json['vcf']['position']) })
    return fill_template({ chr: hg38['output_chrom'], pos: hg38['output_start'], alt: alt, ref: ref })
}))


const appyter = defined(memo(async (appyter_name, args) => {
    const ret = await fetchEx(`https://appyters.maayanlab.cloud/${appyter_name}/`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(args),
    })
    const { session_id } = await ret.json()
    return `https://appyters.maayanlab.cloud/${appyter_name}/${session_id}`
}))

const exrna_library = defined(memo(async (gene_search) => {
    let census_types = ['miRNA', 'piRNA', 'snRNA', 'snoRNA', 'tRNA']
    for (const census_type of census_types) {
        if (await isitup(`https://exrna-atlas.org/exat/api/doc/census/${census_type}s/${gene_search}`)) {
            return census_type
        }
    }
}))

const clean_cut = defined((desc, max_len = 400) => {
    // Cut a description by a sentence end no longer than max_len
    let stump = desc.slice(0, max_len).lastIndexOf('.')
    return desc.slice(0, stump)
})

// const ncbi_gene_id = defined(async (gene_search) => (await gene_info(gene_search))._id)
// const ncbi_gene_url = defined(async (gene_search) => `${(await gene_info(gene_search))._id}`)
// const organism = defined(async (gene_search) => species_map[(await gene_info(gene_search)).taxid])
// const chromosome_location = defined(async (gene_search) => (await gene_info(gene_search)).map_location)
// const biological_function = defined(async (gene_search) => clean_cut((await gene_info(gene_search)).summary))

const ensembl_id = defined(async (gene_search) => (await gene_info(gene_search)).ensembl.gene)
const HGNC = defined(async (gene_search) => (await gene_info(gene_search)).HGNC)
const uniprot_kb = defined(async (gene_search) => (await gene_info(gene_search)).uniprot['Swiss-Prot'])
const MGI = defined(async (gene_search) => (await gene_info(gene_search)).pantherdb.ortholog[0].MGI)
const transcript = defined(async (gene_search) => (await gene_info(gene_search)).exac.transcript)
const entrezgene = defined(async (gene_search) => (await gene_info(gene_search)).entrezgene)
// const pdb = defined(async (gene_search) => ensure_array((await gene_info(gene_search)).pdb)[0])

// const phosphosite = defined(memo(async (gene_search) => {
//     const res = await fetchEx(`https://www.phosphosite.org/simpleSearchSubmitAction.action?searchStr=${gene_search}`)
//     if (res.ok) {
//         let results = await res.json()
//         let id = results['paginationResults'][0]
//         return `https://www.phosphosite.org/proteinAction?id=${id}`
//     }
// }))

const cfde_nid = defined(memo(async (gene_search) => {
    let mapping = await import('@/public/cfde_nid_map.json')
    return `https://app.nih-cfde.org/chaise/record/#1/CFDE:gene/nid=${mapping[gene_search][0]}`
}))

const metabolomicswb = defined(memo(async (gene_search) => {
    const mgp = await fetchEx(`https://www.metabolomicsworkbench.org/rest/protein/uniprot_id/${await uniprot_kb(gene_search)}/mgp_id/`)
    if (mgp.ok) {
        let mgp_resp = await mgp.json()
        if ('Row1' in mgp_resp) {
            mgp_resp = mgp_resp['Row1']
        }
        return mgp_resp['mgp_id']
    }
}))

const STRING = defined(memo(async (gene_search) => {
    const res = await fetchEx(`https://string-db.org/api/json/get_link?identifier=${gene_search}`)
    if (res.ok) {
        const [link] = await res.json()
        return link
    }
}))

const STITCH = defined(memo(async (gene_search) => {
    const formData = new FormData()
    formData.append('identifier', gene_search)
    formData.append('targetmode', 'proteins')
    formData.append('input_query_species', 'auto_detect')
    formData.append('required_score', 400)
    formData.append('have_user_input', 2)
    const res = await fetchEx(`http://stitch.embl.de/cgi/network.pl`, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
        method: 'POST',
        body: formData,
        redirect: 'manual',
    })
    if (res.status === 302) {
        // redirect is success
        return res.headers.get('Location')
    } else {
        // if we get content, we may have identifier options to select, we'll take the first
        const content = await res.text()
        const m = /['"]identifier_([^\'"]+)['"]/g.exec(content)
        const identifier = m[1]
        const formData2 = new FormData()
        formData2.append('identifier', identifier)
        formData2.append('targetmode', 'proteins')
        formData2.append('input_query_species', 'auto_detect')
        formData2.append('required_score', 400)
        formData2.append('have_user_input', 1)
        const res2 = await fetchEx(`http://stitch.embl.de/cgi/network.pl`, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            method: 'POST',
            body: formData2,
            redirect: 'manual',
        })
        if (res2.status === 302) {
            // yay
            return res2.headers.get('Location')
        }
    }
}))

const drug_query_url = 'https://pubchem.ncbi.nlm.nih.gov/rest'

export const drug_info = defined(memo(try_or_else(async (drug_search) => {
    // we first try resolving the compound name
    const compound_res = await fetchEx(`${drug_query_url}/pug/compound/name/${encodeURIComponent(drug_search)}/synonyms/JSON`)
    if (compound_res.ok) {
        const compound_data = await compound_res.json()
        return compound_data.InformationList.Information[0]
    } else {
        // if not found we resolve the substance
        const substance_res = await fetchEx(`${drug_query_url}/pug/substance/name/${encodeURIComponent(drug_search)}/cids/JSON`)
        if (substance_res.ok) {
            const substance_data = await substance_res.json()
            // we find the "most popular" cids among the substance results
            const substance_cids = {}
            for (const info of substance_data.InformationList.Information) {
                for (const cid of ensure_array(info.CID)) {
                    if (!(cid in substance_cids)) {
                        substance_cids[cid] = 0
                    }
                    substance_cids[cid] += 1
                }
            }
            const substance_cid = argmax(substance_cids)
            if (substance_cid) {
                // we then return the compound info
                const substance_compound_res = await fetchEx(`${drug_query_url}/pug/compound/cid/${substance_cid}/synonyms/JSON`)
                if (substance_compound_res.ok) {
                    const substance_compound_data = await substance_compound_res.json()
                    return substance_compound_data.InformationList.Information[0]
                }
            } else {
                // just a substance, no compound info
                const substance_synonyms_res = await fetchEx(`${drug_query_url}/pug/substance/sid/${substance_data.InformationList.Information[0].SID}/synonyms/JSON`)
                return substance_synonyms_res.InformationList.Information[0]
            }
        }
    }
})))

const CID = defined(async (drug_search) => (await drug_info(drug_search)).CID)
const CHEMBL = defined(async (drug_search) => (await drug_info(drug_search)).Synonym.find(item => item.trim().match(/^CHEMBL/)))
const DrugBankNum = defined(async (drug_search) => (await drug_info(drug_search)).Synonym.find(item => item.trim().match(/^DB/)))
const DrugName = defined(memo(async (drug_search) => {
    const info = await drug_info(drug_search.toLowerCase())
    const res = await fetchEx(`${drug_query_url}/pug/compound/cid/${info.CID}/property/Title/JSON`)
    if (!res.ok) throw new Error('DrugName status is not OK')
    const properties = await res.json()
    return properties.PropertyTable.Properties[0].Title.toLowerCase()
}))
const GTPL = defined(async (drug_search) => (await drug_info(drug_search)).Synonym.find(item => item.trim().match(/^GTPL/)).substring(4))

const ldp2_id = defined(memo(async (drug_search) => {
    const url = `http://lincsportal.ccs.miami.edu/sigc-api/small-molecule/fetch-by-name?name=${drug_search}&returnSignatureIDs=false`
    const pert_res = await fetchEx(url)
    if (pert_res.ok) {
        const data = await pert_res.json()
        for (const datum of ensure_array(data['data'])) {
            for (const perturbagen_id of ensure_array(datum['perturbagen_id'])) {
                return perturbagen_id
            }
        }
    }
}))

/**
 * Each object attribute can be a literal value or an async callable that accepts the parameters:
 *  { self, search }
 *  self: The object itself with parameters currently evaluated (in order)
 *  search: The current search term
 * The whole item is resolved (by executing the functions as necessary) before the page is rendered
 *  with the resolved manifest, note that manifest items are resolved independently and in parallel
 *  so any dependent functions which make requests should be memoized promises for request deduplication.
 */
const manifest = [
    // {
    //     name: 'GeneInfo',
    //     component: 'GeneInfoCard',
    //     tags: {
    //         pinned: true,
    //         searchonly: true,
    //         gene: true,
    //     },
    //     organism: async ({ search }) => await organism(search),
    //     ncbi_gene_id: async ({ search }) => await ncbi_gene_id(search),
    //     chromosome_location: async ({ search }) => await chromosome_location(search),
    //     biological_function: async ({ search }) => await biological_function(search),
    //     ncbi_gene_url: async ({ search }) => await ncbi_gene_url(search),
    //     similar_coexpression: try_or_else(async ({ search }) => await  expand(search, 'coexpression'), null),
    //     similar_literature: try_or_else(async ({ search }) => await expand(search, 'generif'), null),
    //     predicted_tfs: try_or_else(async ({ search }) => await  predict_regulators([search], 'chea3'), null),
    //     predicted_kinases: try_or_else(async ({ search }) => await predict_regulators([search], 'kea3'), null),
    //     moleculeId: async ({ search }) => (await pdb(search)).toLowerCase(),
    // },

    // {
    //     name: 'Signor',
    //     tags: {
    //         CF: false,
    //         PS: true,
    //         gene: true,
    //     },
    //     img1: {
    //         src: '/logos/Signor_logo.png',
    //         alt: 'Signor logo',
    //     },
    //     img2: {
    //         src: '/logos/Signor_site.png',
    //         alt: 'Signor site screenshot',
    //     },
    //     title: '',
    //     description: '',
    //     url: "https://signor.uniroma2.it/",
    //     countapi: 'maayanlab.github.io/Signorclick',
    //     clickurl: if_search(async ({search}) => `https://signor.uniroma2.it/relation_result.php?id=${await uniprot_kb(search)}`),
    // },

    // {
    //     name: 'dataMED',
    //     tags: {
    //         CF: false,
    //         Ag: true,
    //         gene: true,
    //     },
    //     img1: {
    //         src: '/logos/dataMED_logo.png',
    //         alt: 'dataMED logo',
    //     },
    //     img2: {
    //         src: '/logos/dataMED_site.png',
    //         alt: 'dataMED site screenshot',
    //     },
    //     title: 'dataMED',
    //     description: '',
    //     url: "https://datamed.org/",
    //     countapi: 'maayanlab.github.io/dataMEDclick',
    //     clickurl: if_search(async ({ search }) => `https://datamed.org/search.php?query=${search}&searchtype=data`),
    //     example: 'https://datamed.org/search.php?query=${gene-symbol}&searchtype=data',
    // },

    // {
    //     name: 'Oma',
    //     tags: {
    //         CF: false,
    //         PS: false,
    //         gene: true,
    //     },
    //     img1: {
    //         src: '/logos/Oma_logo.png',
    //         alt: 'Oma logo',
    //     },
    //     img2: {
    //         src: '/logos/Oma_site.png',
    //         alt: 'Oma site screenshot',
    //     },
    //     title: 'Oma',
    //     description: '',
    //     url: "https://omabrowser.org/",
    //     countapi: 'maayanlab.github.io/Omaclick',
    //     clickurl: if_search(async ({ search }) => `https://omabrowser.org/oma/search/?type=all&query=${search}`),
    //     example: 'https://omabrowser.org/oma/search/?type=all&query=${gene-symbol}',
    // },

    // {
    //     name: 'alliancegenome',
    //     tags: {
    //         CF: false,
    //         Ag: true,
    //         gene: true,
    //     },
    //     img1: {
    //         src: '/logos/alliancegenome_logo.png',
    //         alt: 'Alliance of Genome Resources logo',
    //     },
    //     img2: {
    //         src: '/logos/alliancegenome_site.png',
    //         alt: 'Alliance of Genome Resources site screenshot',
    //     },
    //     title: 'Alliance of Genome Resources',
    //     description: '',
    //     url: "https://www.alliancegenome.org/",
    //     countapi: 'maayanlab.github.io/alliancegenomeclick',
    //     clickurl: if_search(async ({ search }) => `https://www.alliancegenome.org/gene/HGNC:${await HGNC(search)}`),
    //     example: 'https://www.alliancegenome.org/gene/HGNC:${HGNC}',
    // },

    {
        name: 'GTEx gene',
        tags: {
            CF: true,
            PS: true,
            gene: true,
        },
        output: {
            tissue: true,
        },
        img1: {
            src: '/logos/gtex_logo.png',
            alt: 'GTEx logo',
        },
        img2: {
            src: '/logos/Gtex_site.png',
            alt: 'GTEx site screenshot',
        },
        title: 'GTEx',
        description: 'The Genotype-Tissue Expression (GTEx) Portal provides open access to data including gene expression, QTLs, and histology static.',
        url: "https://www.gtexportal.org/home/",
        countapi: 'maayanlab.github.io/gteclick',
        clickurl: if_search(async ({ search }) => `https://www.gtexportal.org/home/gene/${await ensembl_id(search)}`),
        example: 'https://www.gtexportal.org/home/gene/${ensembl_id}',
    },
    {
        name: 'MetGENE',
        tags: {
            CF: true,
            PS: true,
            gene: true,
        },
        output: {
            tissue: true,
        },
        img1: {
            src: '/logos/MetGENE_logo.png',
            alt: 'MetGENE logo',
        },
        img2: {
            src: '/logos/MetGENE_site.png',
            alt: 'MetGENE site screenshot',
        },
        title: 'MetGENE',
        description: 'The objective of MetGENE is to identify the reactions catalyzed by the given gene(s) RPE and the related metabolites.',
        url: "https://sc-cfdewebdev.sdsc.edu/MetGENE/metGene.php",
        countapi: 'maayanlab.github.io/metgeneclick',
        clickurl: if_search(async ({ search }) => `https://sc-cfdewebdev.sdsc.edu/MetGENE/metGene.php?GeneInfoStr=${search}&GeneIDType=SYMBOL&species=hsa&anatomy=NA&disease=NA&phenotype=NA`),
        example: 'https://sc-cfdewebdev.sdsc.edu/MetGENE/metGene.php?GeneInfoStr=${gene-symbol}&GeneIDType=SYMBOL&species=hsa&anatomy=NA&disease=NA&phenotype=NA',
        // status: if_search(async ({ self }) => await isitup(self.clickurl, 'is not a valid gene ID for the Gene ID type SYMBOL')),
        status: if_search(async ({ self }) => true),
    },
    {
        name: 'Pharos',
        tags: {
            CF: true,
            Ag: true,
            gene: true,
        },
        output: {
            tissue: true,
            drug: true,
            disease: true,
            gene: true,
            function: true,
            publication: true,
        },
        img1: {
            src: '/logos/pharos_logo.png',
            alt: 'Pharos',
        },
        img2: {
            src: '/logos/Pharos_site.png',
            alt: 'Pharos screenshot',
        },
        img3: {
            src: '/logos/IDG_LOGO.png',
            alt: 'IDG',
        },
        title: 'Pharos',
        description: 'The Pharos interface provides facile access to most data types collected by the Knowledge Management Center for the IDG program.',
        url: "https://pharos.nih.gov/",
        countapi: 'maayanlab.github.io/pharclick',
        clickurl: if_search(async ({ search }) => `https://pharos.nih.gov/search?q=${search}`),
        example: 'https://pharos.nih.gov/targets/${swiss-prot}',
    },
    {
        name: 'Harmonziome',
        tags: {
            CF: false,
            Ag: true,
            gene: true,
            MaayanLab: true,
        },
        output: {
            tissue: true,
            drug: true,
            disease: true,
            gene: true,
            function: true,
            publication: true,
        },
        img1: {
            src: '/logos/harmonizome_logo.png',
            alt: 'Harmonizome',
        },
        img2: {
            src: '/logos/Harmonizome_site.png',
            alt: 'Harmonizome screenshot',
        },
        img3: {
            src: '/logos/MaayanLab_logo.png',
            alt: 'MaayanLab',
        },
        title: 'Harmonizome',
        description: 'The Harmonizome is a collection of knowledge about genes and proteins from 114 datasets created by processing 66 online resources to facilitate discovery via data integration.',
        url: "https://maayanlab.cloud/Harmonizome/",
        countapi: 'maayanlab.github.io/harmclick',
        clickurl: if_search(async ({ search }) => `https://maayanlab.cloud/Harmonizome/gene/${search}`),
        example: 'https://maayanlab.cloud/Harmonizome/gene/${gene-symbol}',
    },
    {
        name: 'SigCom LINCS Gene',
        tags: {
            CF: true,
            Ag: true,
            gene: true,
            MaayanLab: true,
        },
        output: {
            tissue: true,
            disease: true,
            drug: true,
        },
        img1: {
            src: '/logos/sigcom_logo.png',
            alt: 'SigCom LINCS',
        },
        img2: {
            src: '/logos/sigcom_site.png',
            alt: 'SigCom LINCS site image',
        },
        img3: {
            src: '/logos/LINCS_logo.gif',
            alt: 'LINCS image',
        },
        title: 'SigCom LINCS',
        description: 'SigCom LINCS data portal serves LINCS datasets and signatures. It provides a signature similarity search to query for mimicker or reverser signatures.',
        url: "https://maayanlab.cloud/sigcom-lincs",
        countapi: 'maayanlab.github.io/SigComLINCSGeneclick',
        // https://maayanlab.cloud/sigcom-lincs/metadata-api/entities?filter={%22skip%22:0,%22limit%22:10,%22where%22:{%22meta.symbol%22:%20%22STAT3%22},%22fields%22:[%22id%22]}
        clickurl: if_search(async ({ search }) => `https://maayanlab.cloud/sigcom-lincs/#/MetadataSearch/Genes?query={%22skip%22:0,%22limit%22:10,%22search%22:[%22${search}%22]}`),
        example: 'https://maayanlab.cloud/sigcom-lincs/#/MetadataSearch/Genes?query={%22skip%22:0,%22limit%22:10,%22search%22:[%22${gene-symbol}%22]}',
    },
    {
        name: 'CFDE Search Portal',
        tags: {
            CF: true,
            Ag: true,
            gene: true,
        },
        output: {
            gene: true,
            tissue: true,
            disease: true,
            function: true,
        },
        img1: {
            src: '/logos/CFDE_logo.png',
            alt: 'CFDE Search Portal',
        },
        img2: {
            src: '/logos/cfdesp_site.png',
            alt: 'CFDE Search Portal site image',
        },
        title: 'CFDE Search Portal',
        description: 'The CFDE Search Portal is a hub for searching the CFDE data across all programs. The main page of the portal (shown below) is meant for high-level decision-making, whereas the repository (or “data browser”) allows users such as clinical researchers, bioinformatics power users, and NIH program officers to search for CFDE data.',
        url: "https://app.nih-cfde.org/",
        countapi: 'maayanlab.github.io/CFDESearchPortal',
        clickurl: if_search(async ({ search }) => await cfde_nid(search)),
        example: 'https://app.nih-cfde.org/chaise/record/#1/CFDE:gene/nid=1',
    },
    {
        name: 'SigCom LINCS Drug',
        tags: {
            CF: true,
            Ag: true,
            drug: true,
            MaayanLab: true,
        },
        img1: {
            src: '/logos/sigcom_logo.png',
            alt: 'SigCom LINCS',
        },
        img2: {
            src: '/logos/sigcom_site.png',
            alt: 'SigCom LINCS site image',
        },
        img3: {
            src: '/logos/LINCS_logo.gif',
            alt: 'LINCS image',
        },
        title: 'SigCom LINCS',
        description: 'SigCom LINCS data portal serves LINCS datasets and signatures. It provides a signature similarity search to query for mimicker or reverser signatures.',
        url: "https://maayanlab.cloud/sigcom-lincs",
        countapi: 'maayanlab.github.io/SigComLINCSDrugclick',
        clickurl: if_search(async ({ search }) => `https://maayanlab.cloud/sigcom-lincs/#/MetadataSearch/Signatures?query={%22skip%22:0,%22limit%22:10,%22search%22:[%22${search}%22]}`),
        example: 'https://maayanlab.cloud/sigcom-lincs/#/MetadataSearch/Signatures?query={%22skip%22:0,%22limit%22:10,%22search%22:[%22${gene-symbol}%22]}',
    },
    {
        name: 'IDG Reactome Portal',
        tags: {
            CF: true,
            PS: true,
            gene: true,
        },
        output: {
            gene: true,
            function: true,
        },
        img1: {
            src: '/logos/Reactome_IDG_logo.png',
            alt: 'LDP 3.0',
        },
        img2: {
            src: '/logos/Reactome_IDG_site.png',
            alt: 'IDG Reactome Portal site image',
        },
        img3: {
            src: '/logos/IDG_LOGO.png',
            alt: 'IDG',
        },
        title: 'IDG Reactome Portal',
        description: 'IDG Reactome Portal provides biologist-friendly way to visualize proteins, complexes, and reactions in high-quality Reactome pathways.',
        url: "https://idg.reactome.org/",
        countapi: 'maayanlab.github.io/IDGReactomeGeneclick',
        clickurl: if_search(async ({ search }) => `https://idg.reactome.org/search/${search}`),
        example: 'https://idg.reactome.org/search/${gene-symbol}',
    },
    {
        name: 'PrismEXP',
        tags: {
            CF: false,
            PS: true,
            gene: true,
            MaayanLab: true
        },
        output: {
            function: true,
        },
        img1: {
            src: '/logos/prismexp_logo.png',
            alt: 'PrismEXP logo',
        },
        img2: {
            src: '/logos/prismexp_site.png',
            alt: 'PrismEXP Appyter site image',
        },
        img3: {
            src: '/logos/MaayanLab_logo.png',
            alt: 'MaayanLab',
        },
        title: 'PrismEXP',
        description: 'Automated Vector Quantization of Massive Co-expression RNA-seq Data Improves Gene Function Prediction (PrismEXP) is a new statistical approach for accurate gene function prediction.',
        url: 'https://appyters.maayanlab.cloud/#/PrismEXP',
        countapi: 'maayanlab.github.io/PrismEXPclick',
        clickurl: if_search(async ({ search }) => `${await appyter('PrismEXP', {
            'gene_symbol': search,
            'gmt_select': 'GO_Biological_Process_2018'
        })}`)
    },
    {
        name: 'RGCSRS',
        tags: {
            CF: false,
            PS: true,
            gene: true,
            MaayanLab: true
        },
        output: {
            drug: true,
        },
        img1: {
            src: '/logos/appyters_logo.png',
            alt: 'RGCSRS Appyter',
        },
        img2: {
            src: '/logos/RGCSRS_site.png',
            alt: 'RGCSRS Appyter site image',
        },
        img3: {
            src: '/logos/MaayanLab_logo.png',
            alt: 'MaayanLab',
        },
        title: 'RGCSRS',
        description: 'This Appyter provides visualizations of the RNA-seq signatures induced by CRISPR knockouts and chemical perturbagens. Signatures are computed from transformed data profiles from the LINCS L1000 data.',
        url: 'https://appyters.maayanlab.cloud/#/L1000_RNAseq_Gene_Search',
        countapi: 'maayanlab.github.io/RGCSRSclick',
        clickurl: if_search(async ({ search }) => `${await appyter('L1000_RNAseq_Gene_Search', { 'gene': search })}`),
    },
    {
        name: 'metabolomics',
        tags: {
            CF: true,
            PS: true,
            gene: true,
        },
        output: {},
        img1: {
            src: '/logos/Metabolomics_logo.jpeg',
            alt: 'Metabolomics image',
        },
        img2: {
            src: '/logos/Metabolomics_site.png',
            alt: 'Metabolomics site image',
        },
        title: 'Metabolomics Workbench',
        description: 'The Metabolomics Workbench serves as a repository for metabolomics data and metadata and provides analysis tools.',
        url: 'https://www.metabolomicsworkbench.org/',
        clickurl: if_search(async ({ search }) => `https://www.metabolomicsworkbench.org/databases/proteome/MGP_detail.php?MGP_ID=${await metabolomicswb(search)}`),
        example: 'https://www.metabolomicsworkbench.org/databases/proteome/MGP_detail.php?MGP_ID=${mgp_id}',
        countapi: 'maayanlab.github.io/metabclick',
    },
    {
        name: 'Wikipedia',
        tags: {
            Ag: true,
            gene: true,
            drug: true,
        },
        output: {
            publication: true,
        },
        img1: {
            src: '/logos/wiki_logo.png',
            alt: 'Wikipedia image',
        },
        img2: {
            src: '/logos/wiki_site.png',
            alt: 'Wikipedia site image',
        },
        title: 'Wikipedia',
        description: 'Wikipedia is a free content, multilingual online encyclopedia written and maintained by a community of volunteers through a model of open collaboration, using a wiki-based editing system',
        url: 'https://en.wikipedia.org/',
        clickurl: if_search(async ({ search }) => `https://en.wikipedia.org/wiki/${search}`),
        example: 'https://en.wikipedia.org/wiki/${gene-symbol}',
        countapi: 'maayanlab.github.io/wikipediaclick',
    },
    {
        name: 'PubMed',
        tags: {
            Ag: true,
            gene: true,
            drug: true,
        },
        output: {
            publication: true,
        },
        img1: {
            src: '/logos/pubmed_logo.png',
            alt: 'PubMed image',
        },
        img2: {
            src: '/logos/pubmed_site.png',
            alt: 'PubMed site image',
        },
        title: 'PubMed',
        description: 'PubMed comprises more than 33 million citations for biomedical literature from MEDLINE, life science journals, and online books.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/',
        clickurl: if_search(async ({ search }) => `https://pubmed.ncbi.nlm.nih.gov/?term=${search}`),
        example: 'https://pubmed.ncbi.nlm.nih.gov/?term=${gene-symbol}',
        countapi: 'maayanlab.github.io/pubmedclick',
    },
    {
        name: 'GlyGen',
        tags: {
            CF: true,
            PS: true,
            gene: true,
        },
        output: {
            tissue: true,
            disease: true,
            function: true,
            publication: true,
        },
        img1: {
            src: "/logos/Glygen_logo.png",
            alt: "GlyGen image",
        },
        img2: {
            src: '/logos/Glygen_site.png',
            alt: 'GlyGen site image',
        },
        title: 'GlyGen',
        description: 'GlyGen provides computational and informatics resources and tools for glycosciences research using information from many data sources.',
        url: "https://www.glygen.org/protein-search/",
        countapi: 'maayanlab.github.io/glygclick',
        clickurl: if_search(async ({ search }) => `https://www.glygen.org/protein/${await uniprot_kb(search)}`),
        example: 'https://www.glygen.org/protein/${swiss-prot}',
    },
    {
        name: 'komp',
        tags: {
            CF: true,
            PS: true,
            gene: true,
        },
        output: {
            disease: true,
            function: true,
            publication: true,
        },
        img1: {
            src: '/logos/komp_logo.png',
            alt: 'KOMP image',
        },
        img2: {
            src: '/logos/Impc_site.png',
            alt: 'IMPC site image',
        },
        title: 'KOMP-IMPC',
        description: 'The Knockout Mouse Programme - International Mouse Phenotyping Consortium (KOMP-IMPC) has information about the functions of protein-coding genes in the mouse genome.',
        url: "https://www.mousephenotype.org",
        countapi: 'maayanlab.github.io/kompclick',
        clickurl: if_search(async ({ search }) => {
            try {
                return `https://www.mousephenotype.org/data/genes/MGI:${await MGI(search)}`
            } catch (e) {
                return `https://www.mousephenotype.org/data/search?term=${search}&type=gene`
            }
        }),
        status: if_search(async ({ self }) => await isitup(self.clickurl, 'No results found for gene')),
        example: 'https://www.mousephenotype.org/data/genes/MGI:${MGI_id}',
    },
    {
        name: 'UDN',
        tags: {
            CF: true,
            PS: true,
            gene: true,
        },
        output: {
            function: true,
        },
        img1: {
            src: '/logos/UDN_logo.png',
            alt: 'UDN image',
        },
        img2: {
            src: '/logos/Udn_site.png',
            alt: 'UDN site image',
        },
        title: 'UDN',
        description: 'This page contains information about genetic changes that were identified in a UDN participant.',
        url: "https://undiagnosed.hms.harvard.edu/genes/",
        countapi: 'maayanlab.github.io/udnclick',
        clickurl: if_search(async ({ search }) => `https://undiagnosed.hms.harvard.edu/genes/${search}/`),
        status: if_search(async ({ self }) => await isitup(self.clickurl, '404 Error Page')),
        example: 'https://undiagnosed.hms.harvard.edu/genes/${gene-symbol}/',
    },
    {
        name: 'ARCHS4',
        tags: {
            CF: false,
            PS: true,
            gene: true,
            MaayanLab: true,
        },
        output: {
            tissue: true,
            gene: true,
            function: true,
        },
        img1: {
            src: '/logos/archs_logo.png',
            alt: 'ARCHS4',
        },
        img2: {
            src: '/logos/ARCHS4_site.png',
            alt: 'ARCHS4 site image',
        },
        img3: {
            src: '/logos/MaayanLab_logo.png',
            alt: 'MaayanLab',
        },
        title: 'ARCHS4',
        description: 'ARCHS4 provides access to gene counts from HiSeq 2000, HiSeq 2500 and NextSeq 500 platforms for human and mouse experiments from GEO and SRA.',
        url: "https://maayanlab.cloud/archs4/",
        countapi: 'maayanlab.github.io/ARCHS4click',
        clickurl: if_search(async ({ search }) => `https://maayanlab.cloud/archs4/gene/${search}`),
        example: 'https://maayanlab.cloud/archs4/gene/${gene-symbol}',
    },
    {
        name: 'variant-to-gene-conversion',
        component: 'VariantInfo',
        title: '',
        description: 'dbSNP contains human single nucleotide variations, microsatellites, and small-scale insertions and deletions along with publication, population frequency, molecular consequence, and genomic and RefSeq mapping information for both common variations and clinical mutations.',
        tags: {
            gene: true,
            pinned: true,
        },
        gene: if_search(async ({ entities }) => entities.gene),
        variant: if_search(async ({ entities }) => entities.variant),
        entity: 'gene',
        status: ({ entities }) => entities.variant !== undefined && entities.gene !== undefined,
    },
    {
        name: 'gene-mrna-coexpr-similarity',
        component: 'SimilarityInfo',
        countable: false,
        tags: {
            gene: true,
            pinned: true,
        },
        output: {
            gene: true,
        },
        title: 'Gene-gene interactions (GGIs) from mRNA co-expression',
        description: 'GGIs are computed from thousands of randomly selected RNA-seq samples processed uniformly with the ARCHS4 pipeline. The top 10 genes are those with the highest Pearson Correlation Coefficient with the queried gene.',
        entity: 'gene',
        items: if_search(async ({ search }) => await expand_gene(search, 'coexpression', 10)),
        status: true,
    },
    {
        name: 'gene-gene-literature-similarity',
        component: 'SimilarityInfo',
        countable: false,
        tags: {
            gene: true,
            pinned: true,
        },
        output: {
            gene: true,
        },
        title: 'Gene-gene interactions (GGIs) from literature',
        description: 'GGIs are computed from based on the most co-mentions genes with the queried gene in published abstracts based on a PubMed search.',
        entity: 'gene',
        items: if_search(async ({ search }) => await expand_gene(search, 'generif', 10)),
        status: true,
    },
    {
        name: 'gene-drug-literature-similarity',
        component: 'SimilarityInfo',
        countable: false,
        tags: {
            gene: true,
            pinned: true,
        },
        output: {
            drug: true,
        },
        title: 'Gene-drug interactions (GDIs) from literature',
        description: 'GDIs are computed from based on the most co-mentions genes with the queried drug in published abstracts based on a PubMed search.',
        entity: 'drug',
        items: if_search(async ({ search }) => await gene_drug_rif(search)),
        status: true,
    },
    {
        name: 'drug-l1000-coexpr-similarity',
        component: 'SimilarityInfo',
        countable: false,
        tags: {
            drug: true,
            pinned: true,
        },
        output: {
            drug: true,
        },
        title: 'Drug-drug interactions (DDIs) based on the LINCS L1000 signatures',
        description: 'DDIs are computed from the LINCS L1000 signatures. For each drug, the strongest signature is selected and then signatures are compared with the cosine distance. Signatures are computed using the Characteristic Direction method as described in Bioinformatics, 32, 15, 2338-2345 (2016).',
        entity: 'drug',
        items: if_search(async ({ search }) => await expand_drug(search, 'L1000_coexpression', 10)),
        status: true,
    },
    {
        name: 'drug-drug-literature-similarity',
        component: 'SimilarityInfo',
        countable: false,
        tags: {
            drug: true,
            pinned: true,
        },
        output: {
            drug: true,
        },
        title: 'Drug-drug interactions (DDIs) from literature',
        description: 'DDIs are computed from based on the most co-mentions drugs with the queried drug in published abstracts based on a PubMed search.',
        entity: 'drug',
        items: if_search(async ({ search }) => await expand_drug(search, 'drugrif_cooccur', 10)),
        status: true,
    },
    {
        name: 'drug-gene-literature-similarity',
        component: 'SimilarityInfo',
        countable: false,
        tags: {
            drug: true,
            pinned: true,
        },
        output: {
            gene: true,
        },
        title: 'Drug-gene interactions (DGIs) from literature',
        description: 'DGIs are computed from based on the most co-mentions drugs with the queried gene in published abstracts based on a PubMed search.',
        entity: 'gene',
        items: if_search(async ({ search }) => await drug_gene_rif(search)),
        status: true,
    },
    {
        name: 'NCBI',
        tags: {
            gene: true,
            Ag: true,
        },
        output: {
            tissue: true,
            gene: true,
            function: true,
            publication: true,
        },
        img1: {
            src: '/logos/NCBI_logo.png',
            alt: 'NCBI image',
        },
        img2: {
            src: '/logos/Ncbi_site.png',
            alt: 'NCBI site image',
        },
        title: 'NCBI Gene Database',
        description: 'The NCBI Gene Database page provides information about nomenclature, RefSeqs, maps, pathways, variations, phenotypes, and links to genome-, phenotype-, and locus-specific resources.',
        url: "https://www.ncbi.nlm.nih.gov/gene/",
        countapi: 'maayanlab.github.io/NCBIclick',
        clickurl: if_search(async ({ search }) => `https://www.ncbi.nlm.nih.gov/gene/${await gene_id(search)}`),
        example: 'https://www.ncbi.nlm.nih.gov/gene/${ncbi_gene_id}',
    },
    {
        name: 'WikiPathways',
        tags: {
            gene: true,
            Ag: true,
        },
        output: {
            gene: true,
            function: true,
        },
        img1: {
            src: '/logos/wikipathways_logo.png',
            alt: 'WikiPathways logo',
        },
        img2: {
            src: '/logos/wikipathways_site.png',
            alt: 'WikiPathways site image',
        },
        title: 'WikiPathways',
        description: 'WikiPathways was established to facilitate the contribution and maintenance of pathway information by the biology community.',
        url: "https://www.wikipathways.org/",
        countapi: 'maayanlab.github.io/WikiPathwaysclick',
        clickurl: if_search(async ({ search }) => `https://www.wikipathways.org//index.php?query=${search}&title=Special%3ASearchPathways&doSearch=1&sa=Search`),
        example: 'https://www.wikipathways.org//index.php?query=${gene-symbol}&title=Special%3ASearchPathways&doSearch=1&sa=Search',
    },
    {
        name: 'Protein Capture Reagents Program',
        tags: {
            gene: true,
            Ag: true,
            CF: true,
        },
        output: {
            gene: true,
        },
        img1: {
            src: '/logos/pcrp_logo.png',
            alt: 'Protein Capture Reagents Program logo',
        },
        img2: {
            src: '/logos/pcrp_site.png',
            alt: 'Protein Capture Reagents Program site image',
        },
        title: 'Protein Capture Reagents Program',
        description: 'The goal of the Common Fund\'s Protein Capture Reagents Program is to develop a community resource of renewable, high-quality protein capture reagents, such as antibodies, with a focus on the creation of transcription factor reagents and testing next generation capture technologies.',
        url: 'https://proteincapture.org/',
        countapi: 'maayanlab.github.io/ProteinCaptureReagentsProgramclick',
        clickurl: if_search(async ({ search }) => `https://proteincapture.org/reagent_portal/?hgnc_name_value=${search}#proteins`),
        example: 'https://proteincapture.org/reagent_portal/?hgnc_name_value=${gene-symbol}#proteins',
    },
    {
        name: 'GeneCards',
        tags: {
            gene: true,
            Ag: true,
        },
        output: {
            drug: true,
            disease: true,
            tissue: true,
            function: true,
            gene: true,
            publication: true,
        },
        img1: {
            src: '/logos/gc_logo.png',
            alt: 'Gene Cards image',
        },
        img2: {
            src: '/logos/Genecards_site.png',
            alt: 'Gene Cards site image',
        },
        title: 'GeneCards',
        description: 'GeneCards is a searchable, integrative database that provides comprehensive, user-friendly information on all annotated and predicted human genes.',
        url: 'https://www.genecards.org/',
        countapi: 'maayanlab.github.io/genecardclick',
        clickurl: if_search(async ({ search }) => `https://www.genecards.org/cgi-bin/carddisp.pl?gene=${search}`),
        example: 'https://www.genecards.org/cgi-bin/carddisp.pl?gene=${gene-symbol}',
    },
    {
        name: 'Enrichr',
        tags: {
            gene: true,
            CF: false,
            Ag: true,
            MaayanLab: true,
        },
        output: {
            drug: true,
            disease: true,
            tissue: true,
            function: true,
            gene: true,
        },
        img1: {
            src: '/logos/enrichr_logo.png',
            alt: 'Enrichr',
        },
        img2: {
            src: '/logos/Enrichr_site.png',
            alt: 'Enrichr site image',
        },
        img3: {
            src: '/logos/MaayanLab_logo.png',
            alt: 'MaayanLab',
        },
        title: 'Enrichr',
        description: 'Enrichr is an enrichment analysis tool that provides various types of visualization summaries of collective functions of gene sets.',
        url: "https://maayanlab.cloud/Enrichr/#find",
        countapi: 'maayanlab.github.io/enrichrclick',
        clickurl: if_search(async ({ search }) => `https://maayanlab.cloud/Enrichr/#find!gene=${search}`),
        example: 'https://maayanlab.cloud/Enrichr/#find!gene=${gene-symbol}',
    },
    {
        name: 'ENCODE',
        tags: {
            gene: true,
            PS: true,
        },
        output: {},
        img1: {
            src: '/logos/ENCODE_logo.png',
            alt: 'ENCODE image',
        },
        img2: {
            src: '/logos/Encode_site.png',
            alt: 'ENCODE site image',
        },
        title: 'ENCODE',
        description: 'The ENCODE Consortium not only produces high-quality data, but also analyzes the data in an integrative fashion.',
        url: "https://www.encodeproject.org/",
        countapi: 'maayanlab.github.io/ENCODEclick',
        clickurl: if_search(async ({ search }) => `https://www.encodeproject.org/genes/${await gene_id(search)}`),
        example: 'https://www.encodeproject.org/genes/{ncbi_gene_id}',
    },
    {
        name: 'uniprot',
        tags: {
            gene: true,
            Ag: true,
        },
        output: {
            function: true,
            gene: true,
        },
        img1: {
            src: '/logos/uniprot_logo.png',
            alt: 'Uniprot image',
        },
        img2: {
            src: '/logos/Uniprot_site.png',
            alt: 'UniProt site image',
        },
        title: 'UniProt',
        description: 'The mission of UniProt is to provide the scientific community with a comprehensive, high-quality and freely accessible resource of protein sequence and functional information.',
        url: "https://www.uniprot.org/",
        countapi: 'maayanlab.github.io/uniprotclick',
        clickurl: if_search(async ({ search }) => `https://www.uniprot.org/uniprot/${await uniprot_kb(search)}`),
        example: 'https://www.uniprot.org/uniprot/${swiss-prot}',
    },
    {
        name: 'alphafold',
        tags: {
            gene: true,
            PS: true,
        },
        img1: {
            src: '/logos/alphafold_logo.png',
            alt: 'AlphaFold logo',
        },
        img2: {
            src: '/logos/alphafold_site.png',
            alt: 'AlphaFold site image',
        },
        title: 'AlphaFold DB',
        description: 'AlphaFold DB provides open access to protein structure predictions for the human proteome and 20 other key organisms to accelerate scientific research.',
        url: "https://alphafold.ebi.ac.uk/",
        countapi: 'maayanlab.github.io/alphafoldclick',
        clickurl: if_search(async ({ search }) => `https://alphafold.ebi.ac.uk/entry/${await uniprot_kb(search)}`),
        example: 'https://alphafold.ebi.ac.uk/entry/{swiss-prot}',
    },
    {
        name: 'MARRVEL',
        tags: {
            gene: true,
            Ag: true,
        },
        output: {
            drug: true,
            disease: true,
            tissue: true,
            function: true,
        },
        img1: {
            src: '/logos/marrvel_logo.png',
            alt: 'MARRVEL image',
        },
        img2: {
            src: '/logos/Marrvel_site.png',
            alt: 'MARRVEL site image',
        },
        title: 'MARRVEL',
        description: 'MARRVEL enables users to search multiple public variant databases simultaneously and provides a unified interface to facilitate the search process.',
        url: "http://marrvel.org/",
        countapi: 'maayanlab.github.io/MARRVELclick',
        clickurl: if_search(async ({ search }) => `http://marrvel.org/human/gene/${await gene_id(search)}`),
        example: 'http://marrvel.org/human/gene/${ncbi_gene_id}',
    },
    {
        name: 'biogps',
        tags: {
            gene: true,
            PS: true,
        },
        output: {
            tissue: true,
            function: true,
        },
        img1: {
            src: '/logos/biogps_logo.png',
            alt: 'BioGPS image',
        },
        img2: {
            src: '/logos/BioGPS_site.png',
            alt: 'BioGPS site image',
        },
        title: 'BioGPS',
        description: 'BioGPS is a free extensible and customizable gene annotation portal, a complete resource for learning about gene and protein function.',
        url: "http://biogps.org",
        countapi: 'maayanlab.github.io/BIOGPSclick',
        clickurl: if_search(async ({ search }) => `http://biogps.org/#goto=genereport&id=${await gene_id(search)}`),
        example: 'http://biogps.org/#goto=genereport&id={ncbi_gene_id}',
    },
    {
        name: 'hgnc',
        tags: {
            gene: true,
            Ag: true,
        },
        output: {
            publication: true,
        },
        img1: {
            src: '/logos/hgnc_logo.png',
            alt: 'HGNC image',
        },
        img2: {
            src: '/logos/hgnc_site.png',
            alt: 'HGNC site image',
        },
        title: 'HGNC',
        description: 'The HGNC database is a curated online repository of approved gene nomenclature, gene groups and associated resources including links to genomic, proteomic and phenotypic information.',
        url: "https://www.genenames.org/",
        countapi: 'maayanlab.github.io/HGNCclick',
        clickurl: if_search(async ({ search }) => `https://www.genenames.org/data/gene-symbol-report/#!/symbol/${search}`),
        example: 'https://www.genenames.org/data/gene-symbol-report/#!/symbol/${gene-symbol}',
    },
    {
        name: 'exRNAAtlas',
        tags: {
            gene: true,
            PS: true,
            CF: true
        },
        output: {},
        img1: {
            src: '/logos/exrna_logo.png',
            alt: 'exRNA Atlas logo'
        },
        img2: {
            src: '/logos/exrna_site.png',
            alt: 'exRNA Atlas site'
        },
        title: 'exRNA Atlas',
        description: 'The exRNA Atlas is the data repository of the Extracellular RNA Communication Consortium (ERCC). The repository includes small RNA sequencing and qPCR-derived exRNA profiles from human and mouse biofluids.',
        url: 'https://exrna-atlas.org/',
        countapi: 'maayanlab.github.io/exRNAAtlasclick',
        clickurl: if_search(async ({ search }) => `https://exrna-atlas.org/exat/censusResults?identifiers=${search}&library=${await exrna_library(search)}`),
        status: if_search(async ({ self }) => await isitup(self.clickurl, '<b>Problematic</b> identifiers can be found below')),
        example: 'https://exrna-atlas.org/exat/censusResults?identifiers=${gene-symbol}&library=${exrna_library}',
    },
    {
        name: 'ensembl gene',
        tags: {
            gene: true,
            PS: true,
        },
        output: {
            tissue: true,
            function: true,
        },
        img1: {
            src: '/logos/Ensembl_logo.png',
            alt: 'Ensembl image',
        },
        img2: {
            src: '/logos/Ensembl_site.png',
            alt: 'Ensembl site image',
        },
        title: 'Ensembl',
        description: 'Ensembl is a genome browser for vertebrate genomes that supports research in comparative genomics, evolution, sequence variation and transcriptional regulation.',
        url: "https://useast.ensembl.org/index.html",
        countapi: 'maayanlab.github.io/ENSEMBLclick',
        clickurl: if_search(async ({ search }) => `https://useast.ensembl.org/Homo_sapiens/Gene/Summary?db=core;g=${await ensembl_id(search)}`),
        example: 'https://useast.ensembl.org/Homo_sapiens/Gene/Summary?db=core;g=${ensembl}',
    },
    {
        name: 'bgee',
        tags: {
            gene: true,
            Ag: true,
        },
        img1: {
            src: '/logos/Bgee_logo.png',
            alt: 'Bgee image',
        },
        img2: {
            src: '/logos/Bgee_site.png',
            alt: 'Bgee site image',
        },
        title: 'Bgee',
        description: 'Bgee is a database for retrieval and comparison of gene expression patterns across multiple animal species.',
        url: "https://bgee.org/",
        countapi: 'maayanlab.github.io/bgeeclick',
        clickurl: if_search(async ({ search }) => `https://bgee.org/?page=gene&gene_id=${await ensembl_id(search)}`),
        example: 'https://bgee.org/?page=gene&gene_id=${gene-symbol}',
    },
    {
        name: 'cosmic',
        tags: {
            gene: true,
            PS: true,
        },
        output: {
            drug: true,
            tissue: true,
            publication: true,
        },
        img1: {
            src: '/logos/COSMIC_logo.png',
            alt: 'COSMIC image',
        },
        img2: {
            src: '/logos/COSMIC_site.png',
            alt: 'COSMIC site image',
        },
        title: 'COSMIC',
        description: "COSMIC, the Catalogue Of Somatic Mutations In Cancer, is the world's largest and most comprehensive resource for exploring the impact of somatic mutations in human cancer.",
        url: "https://cancer.sanger.ac.uk/cosmic",
        countapi: 'maayanlab.github.io/COSMICclick',
        clickurl: if_search(async ({ search }) => `https://cancer.sanger.ac.uk/cosmic/gene/analysis?ln=${search}`),
        example: 'https://cancer.sanger.ac.uk/cosmic/gene/analysis?ln=${gene-symbol}',
    },
    {
        name: 'ClinGen',
        tags: {
            gene: true,
            PS: true,
        },
        output: {
            disease: true,
        },
        img1: {
            src: '/logos/ClinGen_logo.png',
            alt: 'ClinGen image',
        },
        img2: {
            src: '/logos/ClinGen_site.png',
            alt: 'ClinGen site image',
        },
        title: 'ClinGen',
        description: 'ClinGen is a NIH funded resource dedicated to building a central resource that defines the clinical relevance of genes and variants for use in precision medicine and research.',
        url: 'https://www.clinicalgenome.org/',
        countapi: 'maayanlab.github.io/CLINGENclick',
        clickurl: if_search(async ({ search }) => `https://search.clinicalgenome.org/kb/genes/HGNC:${await HGNC(search)}`),
        status: if_search(async ({ self }) => await isitup(self.clickurl, 'ClinGen has not yet published curations for')),
        example: 'https://search.clinicalgenome.org/kb/genes/HGNC:${HGNC}',
    },
    {
        name: 'gwas gene',
        tags: {
            gene: true,
            PS: true,
        },
        output: {
            disease: true,
            publication: true,
        },
        img1: {
            src: '/logos/GWAS_logo.png',
            alt: 'GWAS image',
        },
        img2: {
            src: '/logos/GWAS_site.png',
            alt: 'GWAS site image',
        },
        title: 'GWAS Catalog',
        description: 'The GWAS Catalog provides a consistent, searchable, visualisable and freely available database of SNP-trait associations, which can be easily integrated with other resources.',
        url: "https://www.ebi.ac.uk/gwas/home",
        countapi: 'maayanlab.github.io/GWASclick',
        clickurl: if_search(async ({ search }) => `https://www.ebi.ac.uk/gwas/genes/${search}`),
        status: if_search(async ({ self }) => await isitup(self.clickurl, 'cannot be found in the GWAS Catalog database')),
        example: 'https://www.ebi.ac.uk/gwas/genes/${gene-symbol}',
    },
    {
        name: 'PDBe',
        tags: {
            gene: true,
            PS: true,
        },
        output: {
            drug: true,
            gene: true,
            publication: true,
        },
        img1: {
            src: '/logos/PDBe_logo.png',
            alt: 'PDBe image',
        },
        img2: {
            src: '/logos/PDBe_site.png',
            alt: 'PDBe site image',
        },
        title: 'PDBe Knowledge Base',
        description: 'PDBe Knowledge Base is a community-driven resource managed by the PDBe team, collating functional annotations and predictions for structure data in the PDB archive.',
        url: "https://www.ebi.ac.uk/pdbe/pdbe-kb",
        countapi: 'maayanlab.github.io/PDBeclick',
        clickurl: if_search(async ({ search }) => `https://www.ebi.ac.uk/pdbe/pdbe-kb/proteins/${await uniprot_kb(search)}`),
        example: 'https://www.ebi.ac.uk/pdbe/pdbe-kb/proteins/${swiss-prot}',
    },
    {
        name: 'pdb',
        tags: {
            gene: true,
            PS: true,
        },
        img1: {
            src: '/logos/PDB_logo.png',
            alt: 'PDB image',
        },
        img2: {
            src: '/logos/PDB_site.png',
            alt: 'PDB site image',
        },
        output: {
            publication: true,
        },
        title: 'PDB',
        description: 'PDB has information about the 3D shapes of proteins, nucleic acids, and complex assemblies that contribute to understanding everything from protein synthesis to health and disease.',
        url: "https://www.rcsb.org/",
        countapi: 'maayanlab.github.io/PDBclick',
        clickurl: if_search(async ({ search }) => `https://www.rcsb.org/search?request=%7B%22query%22%3A%7B%22parameters%22%3A%7B%22attribute%22%3A%22rcsb_entity_source_organism.rcsb_gene_name.value%22%2C%22operator%22%3A%22in%22%2C%22value%22%3A%5B%22${search}%22%5D%7D%2C%22service%22%3A%22text%22%2C%22type%22%3A%22terminal%22%2C%22node_id%22%3A0%7D%2C%22return_type%22%3A%22entry%22%2C%22request_options%22%3A%7B%22pager%22%3A%7B%22start%22%3A0%2C%22rows%22%3A25%7D%2C%22scoring_strategy%22%3A%22combined%22%2C%22sort%22%3A%5B%7B%22sort_by%22%3A%22score%22%2C%22direction%22%3A%22desc%22%7D%5D%7D%2C%22request_info%22%3A%7B%22src%22%3A%22ui%22%2C%22query_id%22%3A%220b67dad6ca2a8ccaca6d67d2399f1ac3%22%7D%7D`),
        example: 'https://www.rcsb.org/search?request=%7B%22query%22%3A%7B%22parameters%22%3A%7B%22attribute%22%3A%22rcsb_entity_source_organism.rcsb_gene_name.value%22%2C%22operator%22%3A%22in%22%2C%22value%22%3A%5B%22${gene-symbol}%22%5D%7D%2C%22service%22%3A%22text%22%2C%22type%22%3A%22terminal%22%2C%22node_id%22%3A0%7D%2C%22return_type%22%3A%22entry%22%2C%22request_options%22%3A%7B%22pager%22%3A%7B%22start%22%3A0%2C%22rows%22%3A25%7D%2C%22scoring_strategy%22%3A%22combined%22%2C%22sort%22%3A%5B%7B%22sort_by%22%3A%22score%22%2C%22direction%22%3A%22desc%22%7D%5D%7D%2C%22request_info%22%3A%7B%22src%22%3A%22ui%22%2C%22query_id%22%3A%220b67dad6ca2a8ccaca6d67d2399f1ac3%22%7D%7D',
    },
    {
        name: 'geneva',
        tags: {
            CF: true,
            gene: true,
            Ag: true,
        },
        output: {
            publication: true,
        },
        img1: {
            src: '/logos/GENEVA_logo.png',
            alt: 'GENEVA image',
        },
        img2: {
            src: '/logos/GENEVA_site.png',
            alt: 'GENEVA site image',
        },
        img3: {
            src: '/logos/IDG_LOGO.png',
            alt: 'IDG',
        },
        title: 'GENEVA',
        description: 'GENEVA allows you to identify RNA-sequencing datasets from the Gene Expression Omnibus (GEO) that contains conditions modulating a gene or a gene signature.',
        url: "https://genevatool.org/",
        countapi: 'maayanlab.github.io/GENEVAclick',
        clickurl: if_search(async ({ search }) => `https://genevatool.org/gene_table?gene_name=${search}`),
        example: 'https://genevatool.org/gene_table?gene_name=${gene-symbol}',
    },
    {
        name: 'mgi',
        tags: {
            gene: true,
            PS: true,
        },
        output: {
            disease: true,
            function: true,
            tissue: true,
            gene: true,
            publication: true,
        },
        img1: {
            src: '/logos/MGI_logo.png',
            alt: 'MGI image',
        },
        img2: {
            src: '/logos/MGI_site.png',
            alt: 'MGI site image',
        },
        title: 'MGI',
        description: 'MGI is the international database resource for the laboratory mouse, providing integrated genetic, genomic, and biological data to facilitate the study of human health and disease.',
        url: "http://www.informatics.jax.org/",
        countapi: 'maayanlab.github.io/MGIclick',
        clickurl: if_search(async ({ search }) => `http://www.informatics.jax.org/marker/MGI:${await MGI(search)}`),
        example: 'http://www.informatics.jax.org/marker/MGI:${MGI_id}',
    },
    {
        name: 'omim',
        tags: {
            gene: true,
            PS: true,
        },
        output: {
            function: true,
            publication: true,
        },
        img1: {
            src: '/logos/OMIM_logo.png',
            alt: 'OMIM image',
        },
        img2: {
            src: '/logos/OMIM_site.png',
            alt: 'OMIM site image',
        },
        title: 'OMIM',
        description: 'OMIM is a comprehensive, authoritative compendium of human genes and genetic phenotypes that is freely available and updated daily.',
        url: "https://omim.org/",
        countapi: 'maayanlab.github.io/OMIMclick',
        clickurl: if_search(async ({ search }) => `https://www.omim.org/search?index=entry&start=1&limit=10&sort=score+desc%2C+prefix_sort+desc&search=approved_gene_symbol%3A${search}`),
        example: 'https://www.omim.org/search?index=entry&start=1&limit=10&sort=score+desc%2C+prefix_sort+desc&search=approved_gene_symbol%3A${gene-symbol}',
    },
    {
        name: 'GEO_search',
        tags: {
            gene: true,
            PS: true,
            MaayanLab: true,
        },
        output: {
            function: true,
            publication: true,
        },
        img1: {
            src: '/logos/appyters_logo.png',
            alt: 'Gene Centric GEO Reverse Search Appyter',
        },
        img2: {
            src: '/logos/GEO_search_site.png',
            alt: 'Appyter screenshot',
        },
        img3: {
            src: '/logos/MaayanLab_logo.png',
            alt: 'MaayanLab',
        },
        title: 'Gene Centric GEO Reverse Search Appyter',
        description: 'Gene Centric GEO Reverse Search Appyter enables users to query for a gene in a species of interest; it returns an interactive volcano plot of signatures in which the gene is up- or down-regulated.',
        url: "https://appyters.maayanlab.cloud/#/Gene_Centric_GEO_Reverse_Search",
        countapi: 'maayanlab.github.io/GEOsearchclick',
        clickurl: if_search(async ({ search }) => await appyter('Gene_Centric_GEO_Reverse_Search', {
            species_input: "Human",
            human_gene: search,
            mouse_gene: search
        })),
    },
    {
        name: 'CFDE_GP',
        tags: {
            gene: true,
            PS: false,
            Ag: true,
            CF: true,
            MaayanLab: true,
        },
        output: {
            function: true,
            tissue: true,
            disease: true,
            drug: true,
        },
        img1: {
            src: '/logos/appyters_logo.png',
            alt: 'CFDE Gene Partnership Appyter',
        },
        img2: {
            src: '/logos/CFDE_Gene_Partnership_search_site.png',
            alt: 'Appyter screenshot',
        },
        img3: {
            src: '/logos/MaayanLab_logo.png',
            alt: 'MaayanLab',
        },
        title: 'CFDE Gene Partnership',
        description: 'CFDE Gene Partnership uses FAIR APIs from different DCCs to find and present gene-centric knowledge.',
        url: "https://appyters.maayanlab.cloud/#/CFDE-Gene-Partnership",
        countapi: 'maayanlab.github.io/CFDE_GP_click',
        clickurl: if_search(async ({ search }) => await appyter('CFDE-Gene-Partnership', { gene: search })),
    },
    {
        name: 'go',
        tags: {
            gene: true,
            PS: true,
        },
        output: {
            function: true,
        },
        img1: {
            src: '/logos/GO_logo.png',
            alt: 'Gene Ontology image',
        },
        img2: {
            src: '/logos/GO_site.png',
            alt: 'Gene Ontology site image',
        },
        title: 'Gene Ontology',
        description: 'The Gene Ontology (GO) knowledgebase is the world’s largest source of information on the functions of genes.',
        url: "http://geneontology.org/",
        countapi: 'maayanlab.github.io/GOclick',
        clickurl: if_search(async ({ search }) => `http://amigo.geneontology.org/amigo/gene_product/UniProtKB:${await uniprot_kb(search)}`),
        example: 'http://amigo.geneontology.org/amigo/gene_product/UniProtKB:${swiss-prot}',
    },
    {
        name: 'reactome',
        tags: {
            gene: true,
            CF: true,
            PS: true,
        },
        output: {
            function: true,
            gene: true,
        },
        img1: {
            src: '/logos/Reactome_logo.png',
            alt: 'Reactome image',
        },
        img2: {
            src: '/logos/Reactome_site.png',
            alt: 'Reactome site image',
        },
        title: 'Reactome',
        description: 'Reactome is a free, open-source, curated and peer-reviewed pathway database that provides intuitive bioinformatics tools for the visualization, interpretation and analysis of pathway knowledge.',
        url: "https://reactome.org/",
        countapi: 'maayanlab.github.io/Reactomeclick',
        clickurl: if_search(async ({ search }) => `https://reactome.org/content/query?q=${search}&species=Homo+sapiens&species=Entries+without+species&cluster=true`),
        example: 'https://reactome.org/content/query?q=${gene-symbol}&species=Homo+sapiens&species=Entries+without+species&cluster=true',
    },
    {
        name: 'kegg',
        tags: {
            gene: true,
            PS: true,
        },
        output: {
            function: true,
        },
        img1: {
            src: '/logos/KEGG_logo.png',
            alt: 'KEGG image',
        },
        img2: {
            src: '/logos/KEGG_site.png',
            alt: 'KEGG site image',
        },
        title: 'KEGG',
        description: 'KEGG is a database resource for understanding high-level functions and utilities of the biological system from molecular-level information.',
        url: "https://www.genome.jp/kegg/",
        countapi: 'maayanlab.github.io/KEGGclick',
        clickurl: if_search(async ({ search }) => `https://www.genome.jp/entry/hsa:${await entrezgene(search)}`),
        example: 'https://www.genome.jp/entry/hsa:${entrez}',
    },
    {
        name: 'monarch',
        tags: {
            gene: true,
            PS: true,
        },
        output: {
            gene: true,
            tissue: true,
            function: true,
            publication: true,
        },
        img1: {
            src: '/logos/Monarch_logo.png',
            alt: 'Monarch Initiative image',
        },
        img2: {
            src: '/logos/Monarch_site.png',
            alt: 'Monarch Initiative site image',
        },
        title: 'Monarch Initiative',
        description: 'The Monarch Initiative is an integrative data and analytic platform connecting phenotypes to genotypes across species, bridging basic and applied research with semantics-based analysis.',
        url: "https://monarchinitiative.org/",
        countapi: 'maayanlab.github.io/monarchclick',
        clickurl: if_search(async ({ search }) => `https://monarchinitiative.org/gene/HGNC:${await HGNC(search)}`),
        example: 'https://monarchinitiative.org/gene/HGNC:${HGNC}',
    },
    {
        name: 'hgb',
        tags: {
            gene: true,
            PS: true,
        },
        output: {
            tissue: true,
            drug: true,
            function: true,
        },
        img1: {
            src: '/logos/HGB_logo.png',
            alt: 'Human Genome Browser image',
        },
        img2: {
            src: '/logos/HGB_site.png',
            alt: 'Human Genome Browser site image',
        },
        title: 'Human Genome Browser',
        description: 'The Human Genome Browser includes a broad collection of vertebrate and model organism assemblies and annotations, along with a large suite of tools for viewing, analyzing and downloading data.',
        url: "https://genome.ucsc.edu/cgi-bin/hgGateway",
        countapi: 'maayanlab.github.io/HGBclick',
        clickurl: if_search(async ({ search }) => `https://genome.ucsc.edu/cgi-bin/hgGene?hgg_gene=${await transcript(search)}&hgg_type=knownGene`),
        example: 'https://genome.ucsc.edu/cgi-bin/hgGene?hgg_gene=${hgGene}&hgg_type=knownGene',
    },
    {
        name: 'OpenTargets gene',
        tags: {
            gene: true,
            Ag: true,
        },
        output: {
            tissue: true,
            function: true,
            drug: true,
            publication: true,
        },
        img1: {
            src: '/logos/OpenTargets_logo.png',
            alt: 'Open Targets image',
        },
        img2: {
            src: '/logos/OpenTargets_site.png',
            alt: 'Open Targets site image',
        },
        title: 'Open Targets',
        description: 'The Open Targets Platform is a comprehensive tool that supports systematic identification and prioritisation of potential therapeutic drug targets by integrating publicly available datasets including data generated by the Open Targets consortium.',
        url: "https://platform.opentargets.org/",
        countapi: 'maayanlab.github.io/OpenTargetsclick',
        clickurl: if_search(async ({ search }) => `https://platform.opentargets.org/target/${await ensembl_id(search)}`),
        example: 'https://platform.opentargets.org/target/${ensembl}',
        status: if_search(async ({ search }) => {
            const res = await fetchEx(`https://api.platform.opentargets.org/api/v4/graphql`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    operationName:"TargetPageQuery",
                    variables: {
                        "ensgId": await ensembl_id(search),
                    },
                    query: `query TargetPageQuery($chemblId: String!) { target(ensemblId: $ensgId) { id } }`
                }),
            })
            if (!res.ok) {
                return false
            }
            const data = await res.json()
            return data.data.target !== null
        }),
    },
    {
        name: 'OpenTargetsGenetics',
        tags: {
            gene: true,
            Ag: true,
        },
        output: {
            tissue: true,
            function: true,
            drug: true,
            publication: true,
        },
        img1: {
            src: '/logos/OpenTargets_logo.png',
            alt: 'Open Targets image',
        },
        img2: {
            src: '/logos/OpenTargetsGenetics_site.png',
            alt: 'Open Targets Genetics site image',
        },
        title: 'Open Targets Genetics',
        description: 'The Open Targets Genetics Portal is a tool highlighting variant-centric statistical evidence to allow both prioritisation of candidate causal variants at trait-associated loci and identification of potential drug targets.',
        url: "https://genetics.opentargets.org/",
        countapi: 'maayanlab.github.io/OpenTargetsGeneticsclick',
        clickurl: if_search(async ({ search }) => `https://genetics.opentargets.org/gene/${await ensembl_id(search)}`),
        example: 'https://genetics.opentargets.org/gene/${ensembl}',
        status: if_search(async ({ search }) => {
            const res = await fetchEx(`https://api.genetics.opentargets.org/api/v4/graphql`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    operationName:"GenePageQuery",
                    variables: {
                        "geneId": await ensembl_id(search),
                    },
                    query: `query GenePageQuery($chemblId: String!) { geneInfo(geneId: $geneId) { id } }`
                }),
            })
            if (!res.ok) {
                return false
            }
            const data = await res.json()
            return data.data.geneInfo !== null
        }),
    },
    {
        name: 'genemania',
        tags: {
            gene: true,
            Ag: true,
        },
        output: {
            gene: true,
            function: true,
            publication: true,
        },
        img1: {
            src: '/logos/GeneMANIA_logo.png',
            alt: 'GeneMANIA site logo',
        },
        img2: {
            src: '/logos/GeneMANIA_site.png',
            alt: 'GeneMANIA site image',
        },
        title: 'GeneMANIA',
        description: 'GeneMANIA builds subnetworks around an input gene using functional association data.',
        url: "http://genemania.org",
        countapi: 'maayanlab.github.io/GeneMANIAclick',
        clickurl: if_search(async ({ search }) => `https://genemania.org/search/homo-sapiens/${search}`),
        example: 'https://genemania.org/search/homo-sapiens/${gene-symbol}',
    },
    {
        name: 'humanproteinatlas',
        tags: {
            gene: true,
            PS: true,
        },
        output: {
            tissue: true,
            function: true,
        },
        img1: {
            src: '/logos/HPA_logo.png',
            alt: 'Human Protein Atlas site logo',
        },
        img2: {
            src: '/logos/HPA_site.png',
            alt: 'Human Protein Atlas site image',
        },
        title: 'Human Protein Atlas',
        description: 'The Human Protein Atlas aims to map all human proteins in cells, tissues and organs using the integration of various omics technologies.',
        url: "https://www.proteinatlas.org",
        countapi: 'maayanlab.github.io/HumanProteinAtlasclick',
        clickurl: if_search(async ({ search }) => `https://www.proteinatlas.org/${await ensembl_id(search)}-${search}`),
        example: 'https://www.proteinatlas.org/{search}-${gene-symbol}',
    },
    {
        name: 'OpenTargets drug',
        tags: {
            drug: true,
            Ag: true,
            CF: false,
            PS: false,
        },
        output: {
            MOA: true,
            publication: true,
        },
        img1: {
            src: '/logos/OpenTargets_logo.png',
            alt: 'Open Targets image',
        },
        img2: {
            src: '/logos/OpenTargets_site.png',
            alt: 'Open Targets site image',
        },
        title: 'Open Targets',
        description: 'The Open Targets Platform is a comprehensive tool that supports systematic identification and prioritisation of potential therapeutic drug targets by integrating publicly available datasets including data generated by the Open Targets consortium.',
        url: "https://platform.opentargets.org/",
        countapi: 'maayanlab.github.io/OpenTargetsclick',
        clickurl: if_search(async ({ search }) => `https://platform.opentargets.org/drug/${await CHEMBL(search)}`),
        example: 'https://platform.opentargets.org/drug/${chembl}',
        status: if_search(async ({ search }) => {
            const res = await fetchEx(`https://api.platform.opentargets.org/api/v4/graphql`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    operationName:"DrugPageQuery",
                    variables: {
                        "chemblId": await CHEMBL(search),
                    },
                    query: `query DrugPageQuery($chemblId: String!) { drug(chemblId: $chemblId) { id } }`
                }),
            })
            if (!res.ok) {
                return false
            }
            const data = await res.json()
            return data.data.drug !== null
        }),
    },
    {
        name: 'MedChemExpress',
        tags: {
            drug: true,
            Ag: true,
        },
        output: {
            publication: true,
        },
        img1: {
            src: '/logos/medchemexpress_logo.png',
            alt: 'MedChemExpress logo',
        },
        img2: {
            src: '/logos/medchemexpress_site.png',
            alt: 'MedChemExpress site image',
        },
        title: 'MedChemExpress',
        description: 'MedChemExpress (MCE) offers a wide range of high-quality research chemicals and biochemicals (novel life-science reagents, reference compounds and natural compounds) for scientific use.',
        url: "https://www.medchemexpress.com/",
        countapi: 'maayanlab.github.io/MedChemExpressclick',
        clickurl: if_search(async ({ search }) => `https://www.medchemexpress.com/search.html?q=${search}&ft=&fa=&fp=`),
        example: 'https://www.medchemexpress.com/${gene-symbol}.html',
    },
    {
        name: 'pubchem',
        tags: {
            drug: true,
            CF: false,
            PS: false,
            Ag: true,
        },
        output: {
            drug: true,
            gene: true,
            disease: true,
            publication: true,
        },
        img1: {
            src: '/logos/PubChem_logo.png',
            alt: 'PubChem image',
        },
        img2: {
            src: '/logos/PubChem_site.png',
            alt: 'PubChem site image',
        },
        title: 'PubChem',
        description: 'PubChem, an open chemistry database at the NIH, mostly contains small molecules, but also larger molecules such as nucleotides, carbohydrates, lipids, peptides, and chemically-modified macromolecules.',
        url: "https://pubchem.ncbi.nlm.nih.gov/",
        countapi: 'maayanlab.github.io/PubChemclick',
        clickurl: if_search(async ({ search }) => `https://pubchem.ncbi.nlm.nih.gov/compound/${await CID(search)}`),
        example: 'https://pubchem.ncbi.nlm.nih.gov/compound/${PubChemCID}',
    },
    {
        name: 'chembl',
        tags: {
            drug: true,
            CF: false,
            PS: false,
            Ag: true,
        },
        output: {
            MOA: true,
            drug: true,
            gene: true,
            disease: true,
            publication: true,
        },
        img1: {
            src: '/logos/chEMBL_logo.png',
            alt: 'ChEMBL image',
        },
        img2: {
            src: '/logos/ChEMBL_site.png',
            alt: 'ChEMBL site image',
        },
        title: 'ChEMBL',
        description: 'ChEMBL is a manually curated database of bioactive molecules with drug-like properties. It brings together chemical, bioactivity and genomic data to aid the translation of genomic information into effective new drugs.',
        url: "https://www.ebi.ac.uk/chembl/",
        countapi: 'maayanlab.github.io/ChEMBLclick',
        clickurl: if_search(async ({ search }) => `https://www.ebi.ac.uk/chembl/compound_report_card/${await CHEMBL(search)}/`),
        example: 'https://www.ebi.ac.uk/chembl/compound_report_card/${CHEMBL}/',
    },
    {
        name: 'guide',
        tags: {
            drug: true,
            CF: false,
            PS: false,
            Ag: true,
        },
        output: {
            MOA: true,
            drug: true,
            gene: true,
            disease: true,
        },
        img1: {
            src: '/logos/Guide_logo.png',
            alt: 'Guide to Pharmacology image',
        },
        img2: {
            src: '/logos/Guide_site.png',
            alt: 'Guide to Pharmacology site image',
        },
        title: 'Guide to Pharmacology',
        description: 'The Guide to Pharmacology is a searchable database of drug targets and the prescription medicines and experimental drugs that act on them.',
        url: "https://www.guidetopharmacology.org/",
        countapi: 'maayanlab.github.io/guideclick',
        clickurl: if_search(async ({ search }) => `https://www.guidetopharmacology.org/GRAC/LigandDisplayForward?ligandId=${await GTPL(search)}`),
        example: 'https://www.guidetopharmacology.org/GRAC/LigandDisplayForward?ligandId=${GTPL}',
    },
    {
        name: 'drugbank',
        tags: {
            drug: true,
            CF: false,
            PS: false,
            Ag: true,
        },
        output: {
            MOA: true,
            drug: true,
            gene: true,
            disease: true,
        },
        img1: {
            src: '/logos/DrugBank_logo.png',
            alt: 'DrugBank image',
        },
        img2: {
            src: '/logos/DrugBank_site.png',
            alt: 'DrugBank site image',
        },
        title: 'DrugBank',
        description: 'DrugBank Online is a comprehensive, free-to-access, online database containing information on drugs and drug targets.',
        url: "https://go.drugbank.com/",
        countapi: 'maayanlab.github.io/drugbankclick',
        clickurl: if_search(async ({ search }) => `https://go.drugbank.com/drugs/${await DrugBankNum(search)}`),
        example: 'https://go.drugbank.com/drugs/${DrugBankID}',
    },
    {
        name: 'drugmonizome',
        tags: {
            CF: true,
            drug: true,
            PS: false,
            Ag: true,
            MaayanLab: true,
        },
        output: {
            MOA: true,
            drug: true,
            gene: true,
            disease: true,
        },
        img1: {
            src: '/logos/drugmonizome_logo.png',
            alt: 'Drugmonizome',
        },
        img2: {
            src: '/logos/Drugmonizome_site.png',
            alt: 'Drugmonizome site image',
        },
        img3: {
            src: '/logos/MaayanLab_logo.png',
            alt: 'MaayanLab',
        },
        title: 'Drugmonizome',
        description: 'Drugmonizome is a web portal for querying sets of known drugs and computing significant biomedical terms that drugs in the set share.',
        url: "https://maayanlab.cloud/drugmonizome/#/TermSearch/Drug%20sets",
        countapi: 'maayanlab.github.io/drugmonizomeclick',
        clickurl: if_search(async ({ search }) => `https://maayanlab.cloud/drugmonizome/#/TermSearch/Small%20molecules?query=%7B%22limit%22:10,%22search%22:[%22${search}%22]%7D`),
        example: 'https://maayanlab.cloud/drugmonizome/#/TermSearch/Small%20molecules?query=%7B%22limit%22:10,%22search%22:[%22${drug-name}%22]%7D',
        status: if_search(async ({ search }) => {
            const res = await fetch(`https://maayanlab.cloud/drugmonizome/metadata-api/entities/find`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    filter:{
                        limit:1,
                        where:{
                            meta: {
                                fullTextSearch: search,
                            }
                        }
                    },
                }),
            })
            if (!res.ok) return false
            const data = await res.json()
            return data.length > 0
        }),
    },
    {
        name: 'drugenrichr',
        tags: {
            CF: false,
            drug: true,
            PS: false,
            Ag: true,
            MaayanLab: true,
        },
        output: {
            MOA: true,
            drug: true,
            gene: true,
            disease: true,
        },
        img1: {
            src: '/logos/DrugEnrichr_logo.png',
            alt: 'DrugEnrichr',
        },
        img2: {
            src: '/logos/DrugEnrichr_site.png',
            alt: 'DrugEnrichr site image',
        },
        img3: {
            src: '/logos/MaayanLab_logo.png',
            alt: 'MaayanLab',
        },
        title: 'DrugEnrichr',
        description: 'DrugEnrichr is a new drug set enrichment analysis tool. DrugEnrichr has the familiar Enrichr interface but instead of serving gene sets for search it is serving drug sets.',
        url: "https://maayanlab.cloud/DrugEnrichr/",
        countapi: 'maayanlab.github.io/drugenrichrclick',
        clickurl: if_search(async ({ search }) => `https://maayanlab.cloud/DrugEnrichr/#find!drug=${search}`),
        example: 'https://maayanlab.cloud/DrugEnrichr/#find!drug=${drug-name}',
        status: if_search(async ({ search }) => {
            const res = await fetch(`https://maayanlab.cloud/DrugEnrichr/drugmap?drug=${encodeURIComponent(search)}&json=true`)
            if (!res.ok) return false
            const data = await res.json()
            return Object.keys(data.drug).length !== 0
        }),
    },
    {
        name: 'drugscom',
        tags: {
            drug: true,
            CF: false,
            PS: false,
            Ag: true,
        },
        output: {},
        img1: {
            src: '/logos/Drugscom_logo.png',
            alt: 'Drugs.com image',
        },
        img2: {
            src: '/logos/Drugscom_site.png',
            alt: 'Drugs.com site image',
        },
        title: 'Drugs.com',
        description: 'Drugs.com is the largest, most widely visited, independent medicine information website available on the Internet. Drug.com\'s aim is to be the Internet\'s most trusted resource for drug and related health information.',
        url: "https://www.drugs.com/",
        countapi: 'maayanlab.github.io/drugscomclick',
        clickurl: if_search(async ({ search }) => `https://www.drugs.com/${await DrugName(search)}.html`),
        status: if_search(async ({ self }) => await isitup(self.clickurl, 'Page Not Found')),
        example: 'https://www.drugs.com/${drug-name}.html',
    },
    {
        name: 'drugcentral',
        tags: {
            CF: true,
            drug: true,
            hidden: true,
            PS: false,
            Ag: true,
        },
        output: {
            MOA: true,
            disease: true,
        },
        img1: {
            src: '/logos/drugcentral_logo.png',
            alt: 'DrugCentral',
        },
        img2: {
            src: '/logos/DrugCentral_site.png',
            alt: 'Drug Central site image',
        },
        img3: {
            src: '/logos/IDG_LOGO.png',
            alt: 'IDG',
        },
        title: 'DrugCentral',
        description: 'DrugCentral provides information on active ingredients chemical entities, pharmaceutical products, drug mode of action, indications, pharmacologic action.',
        url: "https://drugcentral.org/",
        countapi: 'maayanlab.github.io/drugcentral',
        clickurl: if_search(async ({ search }) => `https://drugcentral.org/?q=${await DrugName(search)}`),
        status: if_search(async ({ self }) => await isitup(self.clickurl, 'Results: 0')),
        example: 'https://drugcentral.org/?q=${drug-name}',
    },
    {
        name: 'zinc15',
        tags: {
            drug: true,
            CF: true,
            PS: true,
            Ag: false,
        },
        output: {},
        img1: {
            src: '/logos/zinc15_logo.png',
            alt: 'ZINC15 image',
        },
        img2: {
            src: '/logos/ZINC15_site.png',
            alt: 'ZINC15 site image',
        },
        img3: {
            src: '/logos/IDG_LOGO.png',
            alt: 'IDG',
        },
        title: 'ZINC15',
        description: 'ZINC15 is a free database of commercially-available compounds for virtual screening. ZINC contains over 230 million purchasable compounds in ready-to-dock, 3D formats. ZINC also contains over 750 million purchasable compounds you can search for analogs.',
        url: "https://zinc15.docking.org/",
        countapi: 'maayanlab.github.io/ZINC15click',
        clickurl: if_search(async ({ search }) => `https://zinc15.docking.org/substances/search/?q=${await DrugName(search)}`),
        example: 'https://zinc15.docking.org/substances/search/?q=${drug-name}',
        status: if_search(async ({ search }) => {
            const res = await fetch(`https://zinc15.docking.org/substances/search/?q=${encodeURIComponent(search)}`)
            const html = await res.text()
            return html.includes('More about ZINC') // this won't be here in 404s
        }),
    },
    {
        name: 'ldp2',
        tags: {
            CF: true,
            drug: true,
            PS: true,
            Ag: false
        },
        output: {
            gene: true,
            disease: true,
        },
        img1: {
            src: '/logos/ldp2_logo.png',
            alt: 'LINCS Data Portal 2.0',
        },
        img2: {
            src: '/logos/LINCS2_site.png',
            alt: 'LINCS Data Portal 2.0 site image',
        },
        img3: {
            src: '/logos/LINCS_logo.gif',
            alt: 'LINCS',
        },
        title: 'LDP 2.0',
        description: 'LDP 2.0 includes data about over 20,000 small molecules, including approved drugs, compounds in clinical trials, and tool-compounds. Chemical structures are searchable by substructure.',
        url: "http://lincsportal.ccs.miami.edu/signatures/home",
        countapi: 'maayanlab.github.io/LINCS2click',
        clickurl: if_search(async ({ search }) => `http://lincsportal.ccs.miami.edu/signatures/perturbations/${await ldp2_id(search)}`),
        example: 'http://lincsportal.ccs.miami.edu/signatures/perturbations/${ldp2-id}',
    },
    {
        name: 'pharmgkb',
        tags: {
            drug: true,
            CF: false,
            PS: false,
            Ag: true,
        },
        img1: {
            src: '/logos/PharmGKB_logo.png',
            alt: 'PharmGKB image',
        },
        img2: {
            src: '/logos/PharmGKB_site.png',
            alt: 'PharmGKB site image',
        },
        title: 'PharmGKB',
        description: 'PharmGKB is a comprehensive resource that curates knowledge about the impact of genetic variation on drug response for clinicians and researchers.',
        url: "https://www.pharmgkb.org/",
        countapi: 'maayanlab.github.io/PharmGKBclick',
    },
    {
        name: 'drugsfda',
        tags: {
            drug: true,
            CF: false,
            PS: true,
            Ag: false,
        },
        img1: {
            src: '/logos/DrugsFDA_logo.png',
            alt: 'Drugs@FDA image',
        },
        img2: {
            src: '/logos/DrugsFDA_site.png',
            alt: 'Drugs@FDA site image',
        },
        title: 'Drugs@FDA',
        description: 'Drugs@FDA drug cards provide the most recent information from approved drug labels, including regulatory, safety and effectiveness information.',
        url: "https://www.accessdata.fda.gov/scripts/cder/daf/",
        countapi: 'maayanlab.github.io/DrugsFDAclick',
    },
    {
        name: 'STRING',
        tags: {
            gene: true,
            CF: false,
            PS: false,
            Ag: true,
        },
        output: {
            gene: true,
        },
        img1: {
            src: '/logos/STRING_logo.png',
            alt: 'STRING image',
        },
        img2: {
            src: '/logos/STRING_site.png',
            alt: 'STRING site image',
        },
        title: 'STRING',
        description: 'STRING is a database of known and predicted protein-protein interactions and a functional enrichment tool covering more than 5000 genomes.',
        clickurl: if_search(async ({ search }) => await STRING(search)),
        url: "https://string-db.org/",
        countapi: 'maayanlab.github.io/STRINGclick',
    },
    {
        name: 'STITCH',
        tags: {
            gene: true,
            drug: true,
            CF: false,
            PS: false,
            Ag: true,
        },
        output: {
            gene: true,
            drug: true,
        },
        img1: {
            src: '/logos/STITCH_logo.png',
            alt: 'STITCH image',
        },
        img2: {
            src: '/logos/STITCH_site.png',
            alt: 'STITCH site image',
        },
        title: 'STITCH',
        description: 'STITCH is a database of known and predicted interactions between chemicals and proteins and a functional enrichment tool.',
        clickurl: if_search(async ({ search }) => await STITCH(search)),
        url: "http://stitch.embl.de/",
        countapi: 'maayanlab.github.io/STITCHclick',
    },
    {
        name: 'TTD gene',
        tags: {
            gene: true,
            CF: false,
            PS: false,
            Ag: true,
        },
        output: {
            drug: true,
            disease: true,
        },
        img1: {
            src: '/logos/TTD_logo.png',
            alt: 'TTD image',
        },
        img2: {
            src: '/logos/TTD_site.png',
            alt: 'TTD site image',
        },
        title: 'Therapeutic Target Database',
        description: 'Therapeutic Target Database (TTD) is a database to provide information about the known and explored therapeutic protein and nucleic acid targets, the targeted disease, pathway information and the corresponding drugs directed at each of these targets.',
        clickurl: if_search(async ({ search }) => `http://idrblab.net/ttd/search/ttd/target?search_api_fulltext=${search}`),
        status: if_search(async ({ self }) => await isitup(self.clickurl, 'Sorry! Nothing is found.')),
        example: "http://idrblab.net/ttd/search/ttd/target?search_api_fulltext=${gene}",
        url: "http://db.idrblab.net/ttd/",
        countapi: 'maayanlab.github.io/TTDclick',
    },
    {
        name: 'TTD drug',
        tags: {
            drug: true,
            CF: false,
            PS: false,
            Ag: true,
        },
        output: {
            gene: true,
            disease: true,
        },
        img1: {
            src: '/logos/TTD_logo.png',
            alt: 'TTD image',
        },
        img2: {
            src: '/logos/TTD_site.png',
            alt: 'TTD site image',
        },
        title: 'Therapeutic Target Database',
        description: 'Therapeutic Target Database (TTD) is a database to provide information about the known and explored therapeutic protein and nucleic acid targets, the targeted disease, pathway information and the corresponding drugs directed at each of these targets.',
        clickurl: if_search(async ({ search }) => `http://idrblab.net/ttd/search/ttd/drug?search_api_fulltext=${search}`),
        status: if_search(async ({ self }) => await isitup(self.clickurl, 'Sorry! Nothing is found.')),
        example: "http://idrblab.net/ttd/search/ttd/drug?search_api_fulltext=${drug}",
        url: "http://db.idrblab.net/ttd/",
        countapi: 'maayanlab.github.io/TTDclick',
    },
    {
        name: 'CADD',
        tags: {
            PS: true,
            Ag: false,
            variant: true,
        },
        output: {
            gene: true,
        },
        img1: {
            src: '/logos/CADD_logo.png',
            alt: 'CADD logo',
        },
        img2: {
            src: '/logos/CADD_site.png',
            alt: 'CADD site screenshot',
        },
        title: 'CADD',
        description: 'CADD is a tool for scoring the deleteriousness of single nucleotide variants as well as insertion/deletions variants in the human genome.',
        url: 'https://cadd.gs.washington.edu/',
        countapi: 'maayanlab.github.io/CADDclick',
        clickurl: if_search(async ({ search }) => `https://cadd.gs.washington.edu/snv/GRCh37-v1.6/${await chr_coord(search, (vars) => `${vars.chr}:${vars.pos}_${vars.ref}_${vars.alt}`)}`),
        example: '',
    },
    {
        name: 'gnomAD',
        tags: {
            PS: true,
            Ag: false,
            variant: true,
        },
        output: {
            gene: true,
        },
        img1: {
            src: '/logos/gnomAD_logo.png',
            alt: 'gnomAD logo',
        },
        img2: {
            src: '/logos/gnomAD_site.png',
            alt: 'gnomAD site screenshot',
        },
        title: 'gnomAD',
        description: 'The Genome Aggregation Database (gnomAD) is a resource developed by an international coalition of investigators, with the goal of aggregating and harmonizing both exome and genome sequencing data from a wide variety of large-scale sequencing projects, and making summary data available for the wider scientific community.',
        url: 'https://gnomad.broadinstitute.org/',
        countapi: 'maayanlab.github.io/gnomADclick',
        clickurl: if_search(async ({ search }) => `https://gnomad.broadinstitute.org/variant/${await chr_coord(search, (vars) => `${vars.chr}-${vars.pos}-${vars.ref}-${vars.alt}`)}?dataset=gnomad_r2_1`),
        example: '',
    },
    {
        name: 'dbSNP',
        tags: {
            PS: true,
            Ag: false,
            variant: true,
        },
        output: {
            gene: true,
        },
        img1: {
            src: '/logos/dbSNP_logo.png',
            alt: 'dbSNP logo',
        },
        img2: {
            src: '/logos/dbSNP_site.png',
            alt: 'dbSNP site screenshot',
        },
        title: 'dbSNP',
        description: 'dbSNP contains human single nucleotide variations, microsatellites, and small-scale insertions and deletions along with publication, population frequency, molecular consequence, and genomic and RefSeq mapping information for both common variations and clinical mutations.',
        url: 'https://www.ncbi.nlm.nih.gov/snp/',
        countapi: 'maayanlab.github.io/dbSNPclick',
        clickurl: if_search(async ({ search }) => `https://www.ncbi.nlm.nih.gov/snp/?term=${await rsid(search)}`),
        example: '',
    },
    {
        name: 'ClinVar',
        tags: {
            PS: true,
            Ag: false,
            variant: true,
        },
        output: {
            gene: true,
        },
        img1: {
            src: '/logos/ClinVar_logo.png',
            alt: 'ClinVar logo',
        },
        img2: {
            src: '/logos/ClinVar_site.png',
            alt: 'ClinVar site screenshot',
        },
        title: 'ClinVar',
        description: 'ClinVar aggregates information about genomic variation and its relationship to human health.',
        url: 'https://www.ncbi.nlm.nih.gov/clinvar/',
        countapi: 'maayanlab.github.io/ClinVarclick',
        clickurl: if_search(async ({ search }) => `https://www.ncbi.nlm.nih.gov/clinvar/?term=${await rsid(search)}`),
        example: '',
    },
    {
        name: 'SNPedia',
        tags: {
            PS: true,
            Ag: false,
            variant: true,
        },
        output: {
            gene: true,
        },
        img1: {
            src: '/logos/SNPedia_logo.png',
            alt: 'SNPedia logo',
        },
        img2: {
            src: '/logos/SNPedia_site.png',
            alt: 'SNPedia site screenshot',
        },
        title: 'SNPedia',
        description: 'SNPedia is a wiki investigating human genetics. It shares information about the effects of variations in DNA, citing peer-reviewed scientific publications.',
        url: 'https://www.snpedia.com/',
        countapi: 'maayanlab.github.io/SNPediaclick',
        clickurl: if_search(async ({ search }) => `https://www.snpedia.com/index.php/${await rsid(search)}`),
        example: '',
    },
    // {
    //     name: 'GRASP',
    //     tags: {
    //         PS: true,
    //         Ag: false,
    //         variant: true,
    //     },
    //     output: {
    //         gene: true,
    //     },
    //     img1: {
    //         src: '/logos/GRASP_logo.png',
    //         alt: 'GRASP logo',
    //     },
    //     img2: {
    //         src: '/logos/GRASP_site.png',
    //         alt: 'GRASP site screenshot',
    //     },
    //     title: 'GRASP',
    //     description: 'Genome-Wide Repository of Associations Between SNPs and Phenotypes (GRASP) includes all available genetic association results from papers, their supplements and web-based content.',
    //     url: 'https://grasp.nhlbi.nih.gov/',
    //     countapi: 'maayanlab.github.io/GRASPclick',
    //     clickurl: if_search(async ({search}) => ``),
    //     example: '',
    // },
    // {
    //     name: 'dbNSFP',
    //     tags: {
    //         PS: true,
    //         Ag: false,
    //         variant: true,
    //     },
    //     output: {
    //         gene: true,
    //     },
    //     img1: {
    //         src: '/logos/dbNSFP_logo.png',
    //         alt: 'dbNSFP logo',
    //     },
    //     img2: {
    //         src: '/logos/dbNSFP_site.png',
    //         alt: 'dbNSFP site screenshot',
    //     },
    //     title: 'dbNSFP',
    //     description: 'dbNSFP is a database developed for functional prediction and annotation of all potential non-synonymous single-nucleotide variants (nsSNVs) in the human genome.',
    //     url: 'https://database.liulab.science/dbNSFP',
    //     countapi: 'maayanlab.github.io/dbNSFPclick',
    //     clickurl: if_search(async ({search}) => ``),
    //     example: '',
    // },
    {
        name: 'gwas variant',
        tags: {
            PS: true,
            Ag: false,
            variant: true,
        },
        output: {
            gene: true,
        },
        img1: {
            src: '/logos/GWAS_logo.png',
            alt: 'GWAS Catalog logo',
        },
        img2: {
            src: '/logos/GWAS_site.png',
            alt: 'GWAS Catalog site screenshot',
        },
        title: 'GWAS Catalog',
        description: 'The GWAS Catalog provides a consistent, searchable, visualisable and freely available database of SNP-trait associations, which can be easily integrated with other resources.',
        url: "https://www.ebi.ac.uk/gwas/home",
        countapi: 'maayanlab.github.io/GWASclick',
        clickurl: if_search(async ({ search }) => `https://www.ebi.ac.uk/gwas/search?query=${await rsid(search)}`),
        example: '',
    },
    {
        name: 'OpenTargets variant',
        tags: {
            PS: true,
            Ag: false,
            variant: true,
        },
        output: {
            gene: true,
        },
        img1: {
            src: '/logos/OpenTargets_logo.png',
            alt: 'OpenTargets logo',
        },
        img2: {
            src: '/logos/OpenTargets_site.png',
            alt: 'OpenTargets site screenshot',
        },
        title: 'OpenTargets',
        description: 'The OpenTargets Genetics Portal is a tool highlighting variant-centric statistical evidence to allow both prioritisation of candidate causal variants at trait-associated loci and identification of potential drug targets.',
        url: "https://genetics.opentargets.org/",
        countapi: 'maayanlab.github.io/OpenTargetsclick',
        clickurl: if_search(async ({ search }) => `https://genetics.opentargets.org/variant/${await chr_coord(search, (vars) => `${vars.chr}_${vars.pos}_${vars.ref}_${vars.alt}`)}`),
        example: '',
        status: if_search(async ({ search }) => {
            const res = await fetchEx(`https://api.genetics.opentargets.org/api/v4/graphql`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    operationName:"VariantPageQuery",
                    variables: {
                        "variantId": await chr_coord(search, (vars) => `${vars.chr}_${vars.pos}_${vars.ref}_${vars.alt}`),
                    },
                    query: `query VariantPageQuery($variantId: String!) { variantInfo(variantId: $variantId) { id } }`
                }),
            })
            if (!res.ok) {
                return false
            }
            const data = await res.json()
            return data.data.variantInfo !== null
        }),
    },
    // {
    //     name: 'GeneShot',
    //     tags: {
    //         PS: true,
    //         Ag: false,
    //         variant: true,
    //     },
    //     output: {
    //         gene: true,
    //     },
    //     img1: {
    //         src: '/logos/GeneShot_logo.png',
    //         alt: 'GeneShot logo',
    //     },
    //     img2: {
    //         src: '/logos/GeneShot_site.png',
    //         alt: 'GeneShot site screenshot',
    //     },
    //     title: 'GeneShot',
    //     description: 'Geneshot is a search engine that accepts any search term to return a list of genes that are mostly associated with the search terms. ',
    //     url: 'https://maayanlab.cloud/geneshot/',
    //     countapi: 'maayanlab.github.io/GeneShotclick',
    //     clickurl: if_search(async ({search}) => ``),
    //     example: '',
    // },
    {
        name: 'PharmGKB',
        tags: {
            PS: true,
            Ag: false,
            variant: true,
        },
        output: {
            gene: true,
        },
        img1: {
            src: '/logos/PharmGKB_logo.png',
            alt: 'PharmGKB logo',
        },
        img2: {
            src: '/logos/PharmGKB_site.png',
            alt: 'PharmGKB site screenshot',
        },
        title: 'PharmGKB',
        description: 'PharmGKB is a comprehensive resource that curates knowledge about the impact of genetic variation on drug response for clinicians and researchers.',
        url: 'https://www.pharmgkb.org',
        countapi: 'maayanlab.github.io/PharmGKBclick',
        clickurl: if_search(async ({ search }) => `https://www.pharmgkb.org/search?query=${await rsid(search)}`),
        example: '',
    },
    {
        name: 'Human Genome Browser',
        tags: {
            PS: true,
            Ag: false,
            variant: true,
        },
        output: {
            gene: true,
        },
        img1: {
            src: '/logos/HGB_logo.png',
            alt: 'UCSC_Genome_Browser logo',
        },
        img2: {
            src: '/logos/HGB_site.png',
            alt: 'UCSC_Genome_Browser site screenshot',
        },
        title: 'Human Genome Browser',
        description: 'The Human Genome Browser includes a broad collection of vertebrate and model organism assemblies and annotations, along with a large suite of tools for viewing, analyzing and downloading data.',
        url: "https://genome.ucsc.edu/cgi-bin/hgGateway",
        countapi: 'maayanlab.github.io/HGBclick',
        clickurl: if_search(async ({ search }) => `https://genome.ucsc.edu/cgi-bin/hgTracks?db=hg38&position=${await chr_coord(search, (vars) => `${vars.chr}:${vars.pos}-${vars.pos}`)}`),
        // What if it's not a single nucleotide variation?
        example: '',
    },
    {
        name: 'GWAS_Central',
        tags: {
            PS: true,
            Ag: false,
            variant: true,
        },
        output: {
            gene: true,
        },
        img1: {
            src: '/logos/GWAS_Central_logo.png',
            alt: 'GWAS_Central logo',
        },
        img2: {
            src: '/logos/GWAS_Central_site.png',
            alt: 'GWAS_Central site screenshot',
        },
        title: 'GWAS Central',
        description: 'GWAS Central provides a centralized compilation of summary level findings from genetic association studies, both large and small.',
        url: 'https://www.gwascentral.org',
        countapi: 'maayanlab.github.io/GWAS_Centralclick',
        clickurl: if_search(async ({ search }) => `https://www.gwascentral.org/search?q=${await rsid(search)}`),
        example: '',
    },
    {
        name: 'ensembl variant',
        tags: {
            PS: true,
            Ag: false,
            variant: true,
        },
        output: {
            gene: true,
        },
        img1: {
            src: '/logos/Ensembl_logo.png',
            alt: 'Ensembl image',
        },
        img2: {
            src: '/logos/Ensembl_site.png',
            alt: 'Ensembl site image',
        },
        title: 'Ensembl',
        description: 'Ensembl is a genome browser for vertebrate genomes that supports research in comparative genomics, evolution, sequence variation and transcriptional regulation.',
        url: "https://useast.ensembl.org/index.html",
        countapi: 'maayanlab.github.io/ENSEMBLclick',
        clickurl: if_search(async ({ search }) => `https://useast.ensembl.org/homo_sapiens/Variation/Summary?v=${await rsid(search)}`),
        example: '',
    },
    // {
    //     name: 'HaploReg',
    //         tags: {
    //     PS: true,
    //         Ag: false,
    //         variant: true,
    // },
    //     output: {
    //         gene: true,
    //     },
    //     img1: {
    //         src: '/logos/HaploReg_logo.png',
    //         alt: 'HaploReg logo',
    //     },
    //     img2: {
    //         src: '/logos/HaploReg_site.png',
    //         alt: 'HaploReg site screenshot',
    //     },
    //     title: 'HaploReg',
    //     description: 'HaploReg is a tool for exploring annotations of the noncoding genome at variants on haplotype blocks, such as candidate regulatory SNPs at disease-associated loci.',
    //     url: 'https://pubs.broadinstitute.org/mammals/haploreg/haploreg_v4.php',
    //     countapi: 'maayanlab.github.io/HaploRegclick',
    //     clickurl: if_search(async ({search}) => ``),
    //     example: '',
    // },
    {
        name: 'DisGeNET',
        tags: {
            PS: true,
            Ag: false,
            variant: true,
        },
        output: {
            gene: true,
        },
        img1: {
            src: '/logos/DisGeNET_logo.png',
            alt: 'DisGeNET logo',
        },
        img2: {
            src: '/logos/DisGeNET_site.png',
            alt: 'DisGeNET site screenshot',
        },
        title: 'DisGeNET',
        description: 'DisGeNET is a discovery platform containing one of the largest publicly available collections of genes and variants associated to human diseases.',
        url: 'https://www.disgenet.org/',
        countapi: 'maayanlab.github.io/DisGeNETclick',
        clickurl: if_search(async ({ search }) => `https://www.disgenet.org/search/2/${await rsid(search)}/`),
        example: '',
    },
    {
        name: 'PheWeb',
        tags: {
            PS: true,
            Ag: false,
            variant: true,
        },
        output: {
            gene: true,
        },
        img1: {
            src: '/logos/PheWeb_logo.png',
            alt: 'PheWeb logo',
        },
        img2: {
            src: '/logos/PheWeb_site.png',
            alt: 'PheWeb site screenshot',
        },
        title: 'PheWeb',
        description: 'PheWeb is an easy-to-use open-source web-based tool for visualizing, navigating, and sharing GWAS and PheWAS results.',
        url: 'https://pheweb.sph.umich.edu/',
        countapi: 'maayanlab.github.io/PheWebclick',
        clickurl: if_search(async ({ search }) => `https://pheweb.org/UKB-TOPMed/variant/${await chr_coord(search, (vars) => `${vars.chr}:${vars.pos}-${vars.ref}-${vars.alt}`)}`),
        example: '',
    },
    {
        name: 'GTEx variant',
        tags: {
            PS: true,
            Ag: false,
            variant: true,
        },
        output: {
            gene: true,
        },
        img1: {
            src: '/logos/gtex_logo.png',
            alt: 'GTEx logo',
        },
        img2: {
            src: '/logos/Gtex_site.png',
            alt: 'GTEx site screenshot',
        },
        title: 'GTEx',
        description: 'The Genotype-Tissue Expression (GTEx) Portal provides open access to data including gene expression, QTLs, and histology static.',
        url: 'https://gtexportal.org/',
        countapi: 'maayanlab.github.io/gteclick',
        clickurl: if_search(async ({ search }) => `https://gtexportal.org/home/snp/${await rsid(search)}`),
        example: '',
    },
    // {
    //     name: 'ClinGen',
    //         tags: {
    //     PS: true,
    //         Ag: false,
    //         variant: true,
    // },
    //     output: {
    //         gene: true,
    //     },
    //     img1: {
    //         src: '/logos/ClinGen_logo.png',
    //         alt: 'ClinGen logo',
    //     },
    //     img2: {
    //         src: '/logos/ClinGen_site.png',
    //         alt: 'ClinGen site screenshot',
    //     },
    //     title: 'ClinGen',
    //     description: 'ClinGen is a NIH funded resource dedicated to building a central resource that defines the clinical relevance of genes and variants for use in precision medicine and research.',
    //     url: 'https://www.clinicalgenome.org/',
    //     countapi: 'maayanlab.github.io/CLINGENclick',
    //     clickurl: if_search(async ({search}) => ``),
    //     example: '',
    // },
    {
        name: 'SpliceAI',
        tags: {
            PS: true,
            Ag: false,
            variant: true,
        },
        output: {
            gene: true,
        },
        img1: {
            src: '/logos/SpliceAI_logo.png',
            alt: 'SpliceAI logo',
        },
        img2: {
            src: '/logos/SpliceAI_site.png',
            alt: 'SpliceAI site screenshot',
        },
        title: 'SpliceAI',
        description: 'SpliceAI is a deep neural network that accurately predicts splice junctions from an arbitrary pre-mRNA transcript sequence, enabling precise prediction of noncoding genetic variants that cause cryptic splicing.',
        url: 'https://spliceailookup.broadinstitute.org/',
        countapi: 'maayanlab.github.io/SpliceAIclick',
        clickurl: if_search(async ({ search }) => `https://spliceailookup.broadinstitute.org/#variant=${await chr_coord(search, (vars) => `${vars.chr}-${vars.pos}-${vars.ref}-${vars.alt}`)}&hg=38`),
        example: '',
    },
    {
        name: 'Bravo',
        tags: {
            PS: true,
            Ag: false,
            variant: true,
        },
        output: {
            gene: true,
        },
        img1: {
            src: '/logos/Bravo_logo.png',
            alt: 'Bravo logo',
        },
        img2: {
            src: '/logos/Bravo_site.png',
            alt: 'Bravo site screenshot',
        },
        title: 'BRAVO',
        description: 'BRAVO variant browser shows chromosome locations (on GRCh38 human genome assembly), alleles, functional annotations, and allele frequencies for 705 million variants observed in 132,345 deeply sequenced (>38X) genomes from the TOPMed (Trans-Omics for Precision Medicine) data freeze 8.',
        url: 'https://bravo.sph.umich.edu/freeze8/hg38/',
        countapi: 'maayanlab.github.io/Bravoclick',
        clickurl: if_search(async ({ search }) => `https://bravo.sph.umich.edu/freeze8/hg38/variant/snv/${await rsid(search)}`),
        example: '',
    },
    {
        name: 'LitVar',
        tags: {
            PS: true,
            Ag: false,
            variant: true,
        },
        output: {
            gene: true,
        },
        img1: {
            src: '/logos/LitVar_logo.png',
            alt: 'LitVar logo',
        },
        img2: {
            src: '/logos/LitVar_site.png',
            alt: 'LitVar site screenshot',
        },
        title: 'LitVar',
        description: 'LitVar allows the search and retrieval of variant relevant information from the biomedical literature and shows key biological relations between a variant and its close related entities (e.g. genes, diseases, and drugs).',
        url: 'https://www.ncbi.nlm.nih.gov/CBBresearch/Lu/Demo/LitVar/',
        countapi: 'maayanlab.github.io/LitVarclick',
        clickurl: if_search(async ({ search }) => `https://www.ncbi.nlm.nih.gov/CBBresearch/Lu/Demo/LitVar/#!?query=${await rsid(search)}`),
        example: '',
    },
    {
        name: 'EVA',
        tags: {
            PS: true,
            Ag: false,
            variant: true,
        },
        output: {
            gene: true,
        },
        img1: {
            src: '/logos/EVA_logo.png',
            alt: 'EVA logo',
        },
        img2: {
            src: '/logos/EVA_site.png',
            alt: 'EVA site screenshot',
        },
        title: 'European Variation Archive',
        description: 'The European Variation Archive is an open-access database of all types of genetic variation data from all species.',
        url: 'https://www.ebi.ac.uk/eva/',
        countapi: 'maayanlab.github.io/EVAclick',
        clickurl: if_search(async ({ search }) => `https://www.ebi.ac.uk/eva/?Variant-Browser&species=hsapiens_grch38&selectFilter=snp&snp=${await rsid(search)}&studies=PRJEB43233%2CPRJEB51718%2CPRJEB42044%2CPRJEB42835%2CPRJEB39630%2CPRJEB40782%2CPRJEB49407%2CPRJEB41091%2CPRJEB44734%2CPRJEB36187%2CPRJEB39939%2CPRJEB32182%2CPRJEB39694%2CPRJEB51000%2CPRJEB41688%2CPRJEB33276%2CPRJEB46486%2CPRJEB42411%2CPRJEB15384%2CPRJEB40694%2CPRJEB43053%2CPRJEB50808%2CPRJEB46209%2CPRJEB51003%2CPRJEB41367%2CPRJEB48128%2CPRJEB50889%2CPRJEB41290%2CPRJEB41691%2CPRJEB15197%2CPRJEB46068%2CPRJEB32114%2CPRJEB51961%2CPRJEB30460%2CPRJEB31735%2CPRJEB48356&id=${await rsid(search)}&annot-vep-version=86&annot-vep-cache-version=86`),
        example: '',
    },
]

// Remove `false` entries so the key does not appear with `in` operator
// Also compute tag counts
// Also insert common attributes by tag
export const manifest_tag_counts = {}

let duplicates = false
const names = {}
for (const item of manifest) {
    if (item.name in names) {
        names[item.name] += 1
        duplicates = true
    } else {
        names[item.name] = 1
    }
    if (!('tags' in item)) {
        item.tags = {}
    }
    for (const tag in item.tags) {

        if (item.tags[tag] === false) delete item.tags[tag]
        else if (item.countable !== false) {
            if (manifest_tag_counts[tag]) {
                manifest_tag_counts[tag] += 1
            } else {
                manifest_tag_counts[tag] = 1
            }
        }
    }
    // console.debug(manifest_tag_counts)
    if (!('output' in item)) {
        item.output = {}
    }
    for (const tag in item.output) {
        if (item.output[tag] === false) delete item.output[tag]
    }
    if ('countapi' in item) {
        item.clicks = async ({ self }) => await countable(self.countapi).get()
    }
    if ('clickurl' in item && !('status' in item)) {
        item.status = if_search(async ({ self }) => await isitup(self.clickurl))
    }
}

if (duplicates) {
    throw new Error(`Duplicate names in manifest: ${Object.keys(names).filter(name => names[name] > 1).join(', ')}`)
}

export default manifest
