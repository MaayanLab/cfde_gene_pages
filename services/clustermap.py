import click
import pandas as pd
import seaborn as sns
from matplotlib import pyplot as plt

@click.command()
@click.option('-i', '--input', type=click.Path(file_okay=True), required=True, help='Dataframe')
@click.option('-m', '--manifest', type=click.Path(file_okay=True), help='Dataframe for manifest')
@click.option('-o', '--output', type=click.Path(), required=True, help='Figure')
def clustermap(input, manifest, output):
  df = pd.read_csv(input, sep='\t', index_col=0)
  if manifest:
    df_manifest = pd.read_csv(manifest, sep='\t')
    df.columns = df_manifest.set_index('name').loc[df.columns, 'title']
  g = sns.clustermap(
    df.T,
    col_cluster=False,
    row_colors=None,
    yticklabels=True,
    xticklabels=False,
  )
  g.ax_cbar.set_visible(False)
  g.ax_col_dendrogram.set_visible(False)
  plt.savefig(output, dpi=300, bbox_inches='tight')

if __name__ == '__main__':
  clustermap()