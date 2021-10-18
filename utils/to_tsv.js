import flatten from "@/utils/flatten"

export default function to_tsv(records, columns, sep) {
  if (columns === undefined) columns = Object.keys(flatten(records[0]))
  if (sep === undefined) sep = '\t'
  return [
    columns.join('\t'),
    records.map(record => flatten(record)).map(record =>
      columns.map(c => record[c]).join('\t')
    ).join('\n'),
  ].join('\n')
}
