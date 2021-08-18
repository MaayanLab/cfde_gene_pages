import React from 'react'
import dynamic from 'next/dynamic'
import { useQsState } from '@/utils/qsstate'

const Autocomplete = dynamic(() => import('@/components/Autocomplete'))

const uriCodec = {
  stringify: v => encodeURIComponent(v),
  parse: v => decodeURIComponent(v),
}

export default function SearchControl({ onSubmit }) {
  const [entity, setEntity] = useQsState('entity', 'gene', uriCodec)
  const [search, setSearch] = useQsState('search', '', uriCodec)
  const [CF, setCF] = useQsState('CF', false)
  const [PS, setPS] = useQsState('PS', true)
  const [Ag, setAg] = useQsState('Ag', true)
  return (
    <section className="py-1 text-center container">
      <div className="row py-lg-5">
        <div className="col-lg-10 col-md-8 mx-auto">
          <h1 className="fw-light">Gene and Drug Landing Page Aggregator</h1>
          <p className="lead text-muted">This page has links to 35 gene and 14 drug repositories that provide direct links to gene and drug landing pages. You can search by gene or drug name and then choose the sites that contain knowledge about your gene or drug. Common Fund program cards are colored in grey.</p>
          <form
            className="row"
            autoComplete="off"
            onSubmit={(evt) => {
              evt.preventDefault()
              onSubmit({ entity, search, CF, PS, Ag })
            }}
          >
            <div className="input-group">
              <select
                className="form-control"
                style={{ flex: '0 0 auto', width: 'auto' }}
                value={entity}
                onChange={evt => setEntity(evt.target.value)}
              >
                <option value="gene">Gene</option>
                <option value="drug">Drug</option>
              </select>
              <Autocomplete
                type="text"
                className="form-control"
                placeholder="Gene or Drug"
                value={search}
                onChange={evt => setSearch(evt.target.value)}
              />
              <input type="submit" className="btn btn-primary" value="Search" />
            </div>
            <div className="input-group">
              <div className="d-flex flex-wrap align-content-around justify-content-center">
                <div className="mx-1 text-nowrap">
                  Gene Examples:
                  {['ACE2', 'ULK4', 'DPH7', 'KL'].map((gene, ind) => (
                    <span key={gene}>
                      {ind > 0 ? ',' : null}
                      &nbsp;
                      <a
                        href="#"
                        onClick={(evt) => { evt.preventDefault(); onSubmit({ entity: 'gene', search: gene, CF, PS, Ag }) }}>
                        {gene}
                      </a>
                    </span>
                  ))}
                </div>
                <div className="mx-1 text-nowrap">
                  Drug Examples:
                  {['Imatinib', 'Acetaminophen', 'Dexamethasone'].map((drug, ind) => (
                    <span key={drug}>
                      {ind > 0 ? ',' : null}
                      &nbsp;
                      <a
                        href="#"
                        onClick={(evt) => { evt.preventDefault(); onSubmit({ entity: 'drug', search: drug, CF, PS, Ag }) }}>
                        {drug}
                      </a>
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="form-group">
              <div className="form-check form-check-inline">
                <input className="form-check-input" type="checkbox" value="option1" checked={CF} onChange={(evt) => setCF(evt.target.checked)} />
                <label className="form-check-label" htmlFor="inlineCheckbox1">NIH CF Supported Only</label>
              </div>
              <div className="form-check form-check-inline">
                <input className="form-check-input" type="checkbox" value="option2" checked={PS} onChange={(evt) => setPS(evt.target.checked)} />
                <label className="form-check-label" htmlFor="inlineRadio1">Primary Source</label>
              </div>
              <div className="form-check form-check-inline">
                <input className="form-check-input" type="checkbox" value="option3" checked={Ag} onChange={(evt) => setAg(evt.target.checked)} />
                <label className="form-check-label" htmlFor="inlineRadio2">Aggregator</label>
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}