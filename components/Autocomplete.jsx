import React from "react"
import fetchEx from "@/utils/fetchEx"

const entity = {
  gene: async () => {
    const res = await fetchEx('/autocomplete_genes.json')
    return await res.json()
  },
  drug: async () => {
      const res = await fetchEx('/drugbank_vocabulary_drugs.json')
      return await res.json()
  },
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
