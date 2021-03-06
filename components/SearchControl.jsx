import React from 'react'
import dynamic from 'next/dynamic'
import {gene_examples, drug_examples, variant_examples} from '@/manifest/examples'
import {manifest_tag_counts} from '@/manifest'

const Autocomplete = dynamic(() => import('@/components/Autocomplete'))

export default function SearchControl({
                                          entity: initEntity, search: initSearch,
                                          CF, setCF, PS, setPS, Ag, setAg,
                                          gene, setGene, variant, setVariant,
                                          drug, setDrug,
                                          onSubmit,
                                      }) {
    const [entity, setEntity] = React.useState('gene')
    React.useEffect(() => {
        if (initEntity !== undefined) {
            setEntity(initEntity)
        }
    }, [initEntity])
    const [search, setSearch] = React.useState('')
    React.useEffect(() => {
        if (initSearch !== undefined) {
            setSearch(initSearch)
        }
    }, [initSearch])
    //
    if (CF === undefined) CF = false
    if (PS === undefined) PS = true
    if (Ag === undefined) Ag = true
    if (gene === undefined) gene = false
    if (variant === undefined) variant = false
    if (drug === undefined) drug = true
    return (
        <section className="pt-5 container">
            <div className="row py-lg-5">
                <div className="col-8 col-sm-10 mx-auto">
                    <h1 className="fw-light">Gene and Drug Landing Page Aggregator</h1>
                    <p className="text-muted mb-5">Gene and Drug Landing Page Aggregator (GDLPA) has links to {manifest_tag_counts.gene} gene, {manifest_tag_counts.variant} variant
                        and {manifest_tag_counts.drug} drug repositories that provide direct links to gene and drug
                        landing pages. You can search by gene or drug name and then choose the sites that contain
                        knowledge about your gene or drug of interest. Resources supported by the NIH Common Fund are listed first and have the CFDE logo at their top right corner.</p>
                    <form
                        className="row"
                        autoComplete="off"
                        onSubmit={(evt) => {
                            evt.preventDefault()
                            onSubmit({entity, search, CF, PS, Ag, gene, variant, drug})
                        }}
                    >
                        <div className="input-group">
                            <select
                                className="form-control"
                                style={{flex: '0 0 auto', width: 'auto'}}
                                value={entity}
                                onChange={evt => setEntity(evt.target.value)}
                            >
                                <option value="gene">Gene</option>
                                <option value="variant">Variant</option>
                                <option value="drug">Drug</option>
                            </select>
                            <Autocomplete
                                type="text"
                                className="form-control"
                                placeholder="Gene, Variant or Drug"
                                autocomplete={entity}
                                value={search}
                                onChange={evt => setSearch(evt.target.value)}
                            />
                            <input type="submit" className="btn btn-primary" value="Search"/>
                        </div>
                        <div className="input-group">
                            <div className="d-flex flex-wrap align-content-around justify-content-start">
                                <div className="mt-2 text-muted">
                                    Gene Examples:
                                    {gene_examples.map((gene, ind) => (
                                        <span key={gene}>
                                            {ind > 0 ? ',' : null}
                                            &nbsp;
                                            <a
                                                href="#"
                                                onClick={(evt) => {
                                                    evt.preventDefault();
                                                    onSubmit({entity: 'gene', search: gene, CF, PS, Ag})
                                                }}>
                                            {gene}
                                        </a>
                                        </span>
                                    ))}
                                </div>
                                <div className="mt-2 text-muted mx-3">
                                    Drug Examples:
                                    {drug_examples.map((drug, ind) => (
                                        <span key={drug}>
                                            {ind > 0 ? ',' : null}
                                            &nbsp;
                                            <a
                                                href="#"
                                                onClick={(evt) => {
                                                    evt.preventDefault();
                                                    onSubmit({entity: 'drug', search: drug, CF, PS, Ag})
                                                }}>
                                            {drug}
                                        </a>
                                        </span>
                                    ))}
                                </div>
                                <div className="mt-1 mb-3 text-muted">
                                    Variant Examples:
                                    {variant_examples.map((variant, ind) => (
                                        <span key={variant}>
                                            {ind > 0 ? ',' : null}
                                            &nbsp;
                                            <a
                                                href="#"
                                                onClick={(evt) => {
                                                    evt.preventDefault();
                                                    onSubmit({entity: 'variant', search: variant, CF, PS, Ag})
                                                }}>
                                            {variant}
                                        </a>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                        {setCF && setPS && setAg && setGene && setDrug ? (
                            <div className="form-group">
                                <div className="form-check form-check-inline">
                                    <input id="inlineCheckbox1" className="form-check-input" type="checkbox" value="option1" checked={CF}
                                           onChange={(evt) => setCF(evt.target.checked)}/>
                                    <label className="form-check-label" htmlFor="inlineCheckbox1">NIH CF Supported
                                        Only</label>
                                </div>
                                <div className="form-check form-check-inline">
                                    <input id="inlineRadio1" className="form-check-input" type="checkbox" value="option2" checked={PS}
                                           onChange={(evt) => setPS(evt.target.checked)}/>
                                    <label className="form-check-label" htmlFor="inlineRadio1">Primary Source</label>
                                </div>
                                <div className="form-check form-check-inline">
                                    <input id="inlineRadio2" className="form-check-input" type="checkbox" value="option3" checked={Ag}
                                           onChange={(evt) => setAg(evt.target.checked)}/>
                                    <label className="form-check-label" htmlFor="inlineRadio2">Aggregator</label>
                                </div>
                                <br />
                                <div className="form-check form-check-inline">
                                    <input id="inlineRadio3" className="form-check-input" type="checkbox" value="option3" checked={gene}
                                           onChange={(evt) => setGene(evt.target.checked)}/>
                                    <label className="form-check-label" htmlFor="inlineRadio3">Informs Related Genes</label>
                                </div>
                                <div className="form-check form-check-inline">
                                    <input id="inlineRadio4" className="form-check-input" type="checkbox" value="option4" checked={drug}
                                           onChange={(evt) => setDrug(evt.target.checked)}/>
                                    <label className="form-check-label" htmlFor="inlineRadio4">Informs Related Drugs</label>
                                </div>
                            </div>
                        ) : null}
                    </form>
                </div>
            </div>
        </section>
    )
}
