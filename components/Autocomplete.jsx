// TODO: autocomplete

export default function Autocomplete({ value, onChange }) {
  return (
    <input
      type="text"
      className="form-control"
      placeholder="Gene or Drug"
      value={value}
      onChange={onChange}
    />
  )
}
