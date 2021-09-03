import memo from '@/utils/memo'
import defined from '@/utils/defined'
import countable from "@/utils/countable"
import isitup from "@/utils/isitup"
import try_or_else from "@/utils/try_or_else"

function if_search(func) {
    return async (props) => {
        if (props.search !== undefined) {
            return await func(props)
        } else {
            return null
        }
    }
}

export const gene_query_url = 'https://mygene.info/v3'

export const species_map = {
    '9606': 'Homo sapiens',
    '6239': 'Caenorhabditis elegans',
    '7955': 'Danio rerio',
    '7227': 'Drosophila melanogaster',
    '10090': 'Mus musculus'
}

export const gene_id = defined(async (gene_search) => {
    let gene_res = await fetch(`${gene_query_url}/query?q=symbol:${gene_search}`)
    if (gene_res.ok) {
        let data = await gene_res.json()
        if (Array.isArray(data.hits)) {
            if (data.hits.length > 0) {
                return data.hits[0]._id
            }
        }
    }
})

export const expand = defined(memo(async (gene_search, exp_type = "coexpression", top = 10) => {
    const gene_exp = await fetch(`https://maayanlab.cloud/enrichrsearch/gene/expand?search=${gene_search}&top=${top}&type=${exp_type}`)
    if (gene_exp.ok) {
        const { data, success } = await gene_exp.json()
        if ((Array.isArray(data)) && success) {
            if (data.length > 0) {
                return data
            }
        }
    }
}))

export const  predict_regulators = defined(memo(async (genes, type_url) => {
    const results = await fetch(`https://maayanlab.cloud/${type_url}/api/enrich/`, {
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            query_name: "gene_set_query",
            gene_set: genes
        }),
    })
    if (results.ok) {
        const response = await results.json()
        return response['Integrated--meanRank'].slice(0, 10).map(d => d.TF)
    }
}))

const gene_info = defined(memo(async (gene_search) => {
    const gene_res = await fetch(`${gene_query_url}/gene/${await gene_id(gene_search)}`)
    if (gene_res.ok) {
        return await gene_res.json()
    }
}))
const ncbi_gene_id = defined(async (gene_search) => (await gene_info(gene_search))._id)
const organism = defined(async (gene_search) => species_map[(await gene_info(gene_search)).taxid])
const chromosome_location = defined(async (gene_search) => (await gene_info(gene_search)).map_location)
const biological_function = defined(async (gene_search) => (await gene_info(gene_search)).summary)
const ensembl_id = defined(async (gene_search) => (await gene_info(gene_search)).ensembl.gene)
const HGNC = defined(async (gene_search) => (await gene_info(gene_search)).HGNC)
const uniprot_kb = defined(async (gene_search) => (await gene_info(gene_search)).pantherdb.uniprot_kb)
const MGI = defined(async (gene_search) => (await gene_info(gene_search)).pantherdb.ortholog[0].MGI)
const transcript = defined(async (gene_search) => (await gene_info(gene_search)).exac.transcript)
const entrezgene = defined(async (gene_search) => (await gene_info(gene_search)).entrezgene)
const pdb = defined(async (gene_search) => (await gene_info(gene_search)).pdb[0])

export const drug_info = defined(memo(async (drug_search) => {
    const drug_query_url = 'https://pubchem.ncbi.nlm.nih.gov/rest'
    const drug_res = await fetch(`${drug_query_url}/pug/compound/name/${drug_search}/synonyms/JSON`)
    if (drug_res.ok) {
        const data = await drug_res.json()
        return data.InformationList.Information[0]
    }
}))

export const rx_1st_alias = defined(memo(async (drug_search) => {
    const rx_suggestion = await fetch(`https://www.rxlist.com/rxl/api/search/${drug_search}`)
    if (rx_suggestion.ok) {
        const data = await rx_suggestion.json()
        return data[0].Name
    }
}))

const CID = defined(async (drug_search) => (await drug_info(drug_search)).CID)
const CHEMBL = defined(async (drug_search) => (await drug_info(drug_search)).Synonym.find(item => item.trim().match(/^CHEMBL/)))
const DrugBankNum = defined(async (drug_search) => (await drug_info(drug_search)).Synonym.find(item => item.trim().match(/^DB/)))
const DrugName = defined(async (drug_search) => {
    const info = (await drug_info(drug_search.toLowerCase()))
    if (drug_search.toLowerCase() === info.Synonym[0]) {
        return info.Synonym[1]
    } else {
        return info.Synonym[0]
    }
})
const GTPL = defined(async (drug_search) => (await drug_info(drug_search)).Synonym.find(item => item.trim().match(/^GTPL/)).substring(4))
const RxList = defined(async (drug_search) => (await rx_1st_alias(drug_search)))

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
    {
        name: 'GeneInfo',
        component: 'GeneInfoCard',
        tags: {
            pinned: true,
            searchonly: true,
            gene: true,
        },
        organism: async ({ search }) => await organism(search),
        ncbi_gene_id: async ({ search }) => await ncbi_gene_id(search),
        chromosome_location: async ({ search }) => await chromosome_location(search),
        biological_function: async ({ search }) => await biological_function(search),
        similar_coexpression: try_or_else(async ({ search }) => await  expand(search, 'coexpression'), null),
        similar_literature: try_or_else(async ({ search }) => await expand(search, 'generif'), null),
        predicted_tfs: try_or_else(async ({ search }) => await  predict_regulators([search], 'chea3'), null),
        predicted_kinases: try_or_else(async ({ search }) => await predict_regulators([search], 'kea3'), null),
        protein3d: async ({ search }) => `https://www.ncbi.nlm.nih.gov/Structure/icn3d/full.html?mmdbid=${await pdb(search)}&width=300&height=300&showcommand=0&mobilemenu=1&showtitle=1&command=set background white`,
    },
    {
        name: 'GTEx',
        tags: {
            CF: true,
            PS: true,
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
        description: 'The Genotype-Tissue Expression (GTEx) Portal provides open access to data including gene expression, QTLs, and histology images.',
        url: "https://www.gtexportal.org/home/",
        countapi: 'maayanlab.github.io/gteclick',
        clickurl: if_search(async ({ search }) => `https://www.gtexportal.org/home/gene/${await ensembl_id(search)}`),
    },
    {
        name: 'Pharos',
        tags: {
            CF: true,
            Ag: true,
            gene: true,
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
        clickurl: if_search(async ({ search }) => `https://pharos.nih.gov/targets/${await uniprot_kb(search)}`),
    },
    {
        name: 'Harmonziome',
        tags: {
            CF: false,
            Ag: true,
            gene: true,
            MaayanLab: true,
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
    },
    // {
    //     name: 'LINCS',
    //     tags: {
    //         CF: true,
    //         PS: true,
    //         gene: true,
    //     },
    //     img1: {
    //         src: '/logos/ldp3_logo.png',
    //         alt: 'LDP 3.0',
    //     },
    //     img2: {
    //         src: '/logos/Lincs_site.png',
    //         alt: 'LINCS site image',
    //     },
    //     img3: {
    //         src: '/logos/LINCS_logo.gif',
    //         alt: 'LINCS image',
    //     },
    //     title: 'LDP 3.0',
    //     description: 'The LINCS Data Portal 3.0 (LDP 3.0) serves LINCS datasets and signatures. It provides a signature similarity search to query for mimicker or reverser signatures.',
    //     url: "https://ldp3.cloud/",
    //     countapi: 'maayanlab.github.io/lincsclick',
    //     clickurl: if_search(async ({ search }) => `https://ldp3.cloud/#/MetadataSearch/Signatures?query={%22skip%22:0,%22limit%22:10,%22search%22:[%22${search}%22]}`),
    // },
    {
        name: 'metabolomics',
        tags: {
            CF: true,
            PS: true,
            gene: true,
        },
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
        url: 'https://www.metabolomicsworkbench.org/databases/proteome/MGP.php',
        countapi: 'maayanlab.github.io/metabclick',
    },
    {
        name: 'GlyGen',
        tags: {
            CF: true,
            PS: true,
            gene: true,
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
    },
    {
        name: 'komp',
        tags: {
            CF: true,
            PS: true,
            gene: true,
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
        clickurl: if_search(async ({ search }) => `https://www.mousephenotype.org/data/genes/MGI:${await MGI(search)}`),
    },
    {
        name: 'UDN',
        tags: {
            CF: true,
            PS: true,
            gene: true,
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
    },
    {
        name: 'ARCHS4',
        tags: {
            CF: false,
            PS: true,
            gene: true,
            MaayanLab: true,
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
    },
    {
        name: 'NCBI',
        tags: {
            gene: true,
            Ag: true,
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
    },
    {
        name: 'GeneCards',
        tags: {
            gene: true,
            Ag: true,
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
    },
    {
        name: 'Enrichr',
        tags: {
            gene: true,
            CF: false,
            Ag: true,
            MaayanLab: true,
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
    },
    // {
    //     name: 'KEA3',
    //     tags: {
    //         gene: true,
    //         CF: false,
    //         Ag: true,
    //         MaayanLab: true,
    //     },
    //     img1: {
    //         src: '/logos/MaayanLab_logo.png',
    //         alt: 'MaayanLab',
    //     },
    //     img2: {
    //         src: '/logos/kea3_site.png',
    //         alt: 'KEA3 site image',
    //     },
    //     title: 'KEA3',
    //     description: 'Kinase Enrichment Analysis 3 (KEA3) infers upstream kinases whose putative substrates are overrepresented in a user-inputted list of proteins or differentially phosphorylated proteins.',
    //     url: "https://maayanlab.cloud/kea3/",
    //     countapi: 'maayanlab.github.io/KEA3click',
    //     clickurl: if_search(async ({ search }) => `https://maayanlab.cloud/kea3?gene=${search}`),
    // },
    // {
    //     name: 'ChEA3',
    //     tags: {
    //         gene: true,
    //         CF: false,
    //         Ag: true,
    //         MaayanLab: true,
    //     },
    //     img1: {
    //         src: '/logos/MaayanLab_logo.png',
    //         alt: 'MaayanLab',
    //     },
    //     img2: {
    //         src: '/logos/chea3_site.png',
    //         alt: 'ChEA3 site image',
    //     },
    //     title: 'ChEA3',
    //     description: 'ChIP-X Enrichment Analysis 3 (ChEA3) predicts transcription factors (TFs) associated with user-input sets of genes.',
    //     url: "https://maayanlab.cloud/chea3/",
    //     countapi: 'maayanlab.github.io/ChEA3click',
    //     clickurl: if_search(async ({ search }) => `https://maayanlab.cloud/chea3?gene=${search}`),
    // },
    {
        name: 'ENCODE',
        tags: {
            gene: true,
            PS: true,
        },
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
    },
    {
        name: 'uniprot',
        tags: {
            gene: true,
            Ag: true,
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
    },
    {
        name: 'MARRVEL',
        tags: {
            gene: true,
            Ag: true,
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
    },
    {
        name: 'biogps',
        tags: {
            gene: true,
            PS: true,
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
    },
    {
        name: 'hgnc',
        tags: {
            gene: true,
            Ag: true,
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
    },
    {
        name: 'ensembl',
        tags: {
            gene: true,
            PS: true,
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
    },
    {
        name: 'cosmic',
        tags: {
            gene: true,
            PS: true,
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
    },
    {
        name: 'ClinGen',
        tags: {
            gene: true,
            PS: true,
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
        url: "https://www.clinicalgenome.org/",
        countapi: 'maayanlab.github.io/CLINGENclick',
        clickurl: if_search(async ({ search }) => `https://search.clinicalgenome.org/kb/genes/HGNC:${await HGNC(search)}`),
    },
    {
        name: 'gwas',
        tags: {
            gene: true,
            PS: true,
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
    },
    {
        name: 'PDBe',
        tags: {
            gene: true,
            PS: true,
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
        title: 'PDB',
        description: 'PDB has information about the 3D shapes of proteins, nucleic acids, and complex assemblies that contribute to understanding everything from protein synthesis to health and disease.',
        url: "https://www.rcsb.org/",
        countapi: 'maayanlab.github.io/PDBclick',
        clickurl: if_search(async ({ search }) => `https://www.rcsb.org/search?request=%7B%22query%22%3A%7B%22parameters%22%3A%7B%22attribute%22%3A%22rcsb_entity_source_organism.rcsb_gene_name.value%22%2C%22operator%22%3A%22in%22%2C%22value%22%3A%5B%22${search}%22%5D%7D%2C%22service%22%3A%22text%22%2C%22type%22%3A%22terminal%22%2C%22node_id%22%3A0%7D%2C%22return_type%22%3A%22entry%22%2C%22request_options%22%3A%7B%22pager%22%3A%7B%22start%22%3A0%2C%22rows%22%3A25%7D%2C%22scoring_strategy%22%3A%22combined%22%2C%22sort%22%3A%5B%7B%22sort_by%22%3A%22score%22%2C%22direction%22%3A%22desc%22%7D%5D%7D%2C%22request_info%22%3A%7B%22src%22%3A%22ui%22%2C%22query_id%22%3A%220b67dad6ca2a8ccaca6d67d2399f1ac3%22%7D%7D`),
    },
    {
        name: 'geneva',
        tags: {
            CF: true,
            gene: true,
            Ag: true,
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
    },
    {
        name: 'mgi',
        tags: {
            gene: true,
            PS: true,
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
    },
    {
        name: 'omim',
        tags: {
            gene: true,
            PS: true,
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
    },
    {
        name: 'GEO_search',
        tags: {
            gene: true,
            PS: true,
            MaayanLab: true,
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
        clickurl: if_search(async ({ search }) => {
            const ret = await fetch(`https://appyters.maayanlab.cloud/Gene_Centric_GEO_Reverse_Search/`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    species_input: "Human",
                    human_gene: search,
                    mouse_gene: search,
                }),
            })
            const {session_id} = await ret.json()
            return `https://appyters.maayanlab.cloud/Gene_Centric_GEO_Reverse_Search/${session_id}`
        }),
    },
    {
        name: 'go',
        tags: {
            gene: true,
            PS: true,
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
    },
    {
        name: 'reactome',
        tags: {
            gene: true,
            CF: true,
            PS: true,
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
    },
    {
        name: 'kegg',
        tags: {
            gene: true,
            PS: true,
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
    },
    {
        name: 'monarch',
        tags: {
            gene: true,
            PS: true,
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
    },
    {
        name: 'hgb',
        tags: {
            gene: true,
            PS: true,
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
    },
    {
        name: 'OpenTargets',
        tags: {
            gene: true,
            Ag: true,
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
    },
    {
        name: 'OpenTargetsGenetics',
        tags: {
            gene: true,
            Ag: true,
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
    },
    {
        name: 'genemania',
        tags: {
            gene: true,
            Ag: true,
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
    },
    {
        name: 'humanproteinatlas',
        tags: {
            gene: true,
            PS: true,
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
    },
    {
        name: 'OpenTargets',
        tags: {
            drug: true,
            Ag: true,
            CF: false,
            PS: false,
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
    },
    {
        name: 'pubchem',
        tags: {
            drug: true,
            CF: false,
            PS: false,
            Ag: true,
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
    },
    {
        name: 'chembl',
        tags: {
            drug: true,
            CF: false,
            PS: false,
            Ag: true,
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
    },
    {
        name: 'guide',
        tags: {
            drug: true,
            CF: false,
            PS: false,
            Ag: true,
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
    },
    {
        name: 'drugbank',
        tags: {
            drug: true,
            CF: false,
            PS: false,
            Ag: true,
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
        img1: {
            src: '/logos/drugenrichr_logo.png',
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
    },
    {
        name: 'drugscom',
        tags: {
            drug: true,
            CF: false,
            PS: false,
            Ag: true,
        },
        img1: {
            src: '/logos/Drugscom_logo.png',
            alt: 'Drugs.com image',
        },
        img2: {
            src: '/logos/Drugscom_site.png',
            alt: 'Drugs.com site image',
        },
        title: 'Drugs.com',
        description: `Drugs.com is the largest, most widely visited, independent medicine information website available on the Internet. Drug.com's aim is to be the Internet’s most trusted resource for drug and related health information.`,
        url: "https://www.drugs.com/",
        countapi: 'maayanlab.github.io/drugscomclick',
        clickurl: if_search(async ({ search }) => `https://www.drugs.com/${await DrugName(search)}.html`),
    },
    {
        name: 'rxlist',
        tags: {
            drug: true,
            CF: false,
            PS: false,
            Ag: true,
        },
        img1: {
            src: '/logos/RxList_logo.png',
            alt: 'RxList image',
        },
        img2: {
            src: '/logos/RxList_site.png',
            alt: 'RxList site image',
        },
        title: 'RxList',
        description: 'RxList is an online medical resource dedicated to offering detailed and current pharmaceutical information on brand and generic drugs.',
        url: "https://www.rxlist.com/",
        countapi: 'maayanlab.github.io/rxlistclick',
        clickurl: if_search(async ({ search }) => `https://www.rxlist.com/${await RxList(search)}-drug.htm`),
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
        clickurl: if_search(async ({ search }) => `https://drugcentral.org/drugcard/74?q=${await DrugName(search)}`),
    },
    {
        name: 'zinc15',
        tags: {
            drug: true,
            CF: false,
            PS: true,
            Ag: false,
        },
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
    },
    {
        name: 'ldp2',
        tags: {
            CF: true,
            drug: true,
            PS: true,
            Ag: false,
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
]

// Remove `false` entries so the key does not appear with `in` operator
// Also compute tag counts
// Also insert common attributes by tag
export const manifest_tag_counts = {}
for (const item of manifest) {
    for (const tag in item.tags) {
        if (item.tags[tag] === false) delete item.tags[tag]
        else {
            if (!(tag in manifest_tag_counts)) manifest_tag_counts[tag] = 0
            manifest_tag_counts[tag] += 1
        }
    }
    if ('countapi' in item) {
        item.clicks = async ({ self }) => await countable(self.countapi).get()
    }
    if ('clickurl' in item) {
        item.status = if_search(async ({ self }) => {
            const status = await isitup(self.clickurl)
            if (status !== 'yes') throw new Error(`${item.name}: isitup returned ${status}`)
            return status
        })
    }
}

export default manifest
