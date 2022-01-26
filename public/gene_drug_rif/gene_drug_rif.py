'''
This script constructs gene_drug_rif.json by joining drugrif and generif
'''

#%%
import json
import pandas as pd

#%%
drugrif = 'https://appyters.maayanlab.cloud/storage/DrugShot/DrugRIF.tsv.gz'
generif = 'https://s3.amazonaws.com/mssm-data/autorif.tsv'

#%%
df_drugrif = pd.read_csv(drugrif, compression='gzip', sep='\t')

#%%
df_generif = pd.read_csv(generif, sep='\t', header=None)
df_generif.columns = ['name', 'PMID', 'date']

#%%
df_merged = pd.merge(
  left=df_drugrif.rename({ 'name': 'drug' }, axis=1),
  left_on='PMID',
  right=df_generif.rename({ 'name': 'gene' }, axis=1),
  right_on='PMID',
  how='inner',
)
df_merged

#%%
gene_lookup = {}
for g, d in df_merged.groupby('gene'):
  gene_lookup[g] = list(d['drug'].value_counts().iloc[:10].index)

pd.Series(gene_lookup)

#%%
drug_lookup = {}
for g, d in df_merged.groupby('drug'):
  drug_lookup[g] = list(d['gene'].value_counts().iloc[:10].index)

pd.Series(drug_lookup)

#%%
with open('gene_drug.json', 'w') as fw:
  json.dump(gene_lookup, fw)

#%%
with open('drug_gene.json', 'w') as fw:
  json.dump(drug_lookup, fw)
