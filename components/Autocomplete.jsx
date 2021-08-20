import React from "react"
import { drug_examples } from "@/manifest/examples"

const entity = {
  gene: async () => {
    const res = await fetch('/autocomplete_genes.json')
    return await res.json()
  },
  drug: async () => drug_examples,
}

export default function Autocomplete({ value, onChange, autocomplete }) {
  const [autocompleteList, setAutocompleteList] = React.useState([])
  React.useEffect(async () => {
    try {
      setAutocompleteList(await entity[autocomplete]())
    } catch (e) {
      console.error(e)
    }
  }, [autocomplete])
  return (
    <>
      <input
        type="text"
        className="form-control"
        placeholder="Gene or Drug"
        value={value}
        onChange={onChange}
        list="autocompleteDataList"
      />
      <datalist id="autocompleteDataList">
        {autocompleteList
          .filter(item => item.toUpperCase().startsWith(value.toUpperCase()))
          .slice(0, 10)
          .map(item => (
            <option key={item}>{item}</option>
          ))}
      </datalist>
    </>
  )
}
