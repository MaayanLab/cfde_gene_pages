export default function to_tsv(records, columns, sep) {
  if (columns === undefined) columns = Object.keys(records[0])
  if (sep === undefined) sep = '\t'
  return [
    columns.join('\t'),
    records.map(record =>
      columns.map(c =>
        typeof record[c] === 'string' ?
          record[c] : JSON.stringify(record[c])
      ).join('\t')
    ).join('\n'),
  ].join('\n')
}
