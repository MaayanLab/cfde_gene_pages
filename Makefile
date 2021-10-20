DOWNLOADS=downloads
PYTHON=python3.8
NODE=node
NPM=npm

node_modules/:
	$(NPM) install

.next/server/availability.js: | node_modules/
	$(NPM) run build

$(DOWNLOADS)/:
	mkdir -p $(DOWNLOADS)

$(DOWNLOADS)/genes.tsv: | $(DOWNLOADS)/
	$(NODE) .next/server/availability.js gene > $@

$(DOWNLOADS)/gene-resource-manifest.tsv: | $(DOWNLOADS)/
	$(NODE) .next/server/manifest.js gene > $@

$(DOWNLOADS)/genes.png: | $(DOWNLOADS)/ $(DOWNLOADS)/genes.tsv $(DOWNLOADS)/gene-resource-manifest.tsv
	$(PYTHON) services/clustermap.py -i $(DOWNLOADS)/genes.tsv -m $(DOWNLOADS)/gene-resource-manifest.tsv -o $@

$(DOWNLOADS)/drugs.tsv: | $(DOWNLOADS)/
	$(NODE) .next/server/availability.js drug > $@

$(DOWNLOADS)/drug-resource-manifest.tsv: | $(DOWNLOADS)/
	$(NODE) .next/server/manifest.js drug > $@

$(DOWNLOADS)/drugs.png: | $(DOWNLOADS)/ $(DOWNLOADS)/drugs.tsv $(DOWNLOADS)/drug-resource-manifest.tsv
	$(PYTHON) services/clustermap.py -i $(DOWNLOADS)/drugs.tsv -m $(DOWNLOADS)/drug-resource-manifest.tsv -o $@

.PHONY: downloads
downloads: $(DOWNLOADS)/gene-resource-manifest.tsv $(DOWNLOADS)/drug-resource-manifest.tsv $(DOWNLOADS)/genes.tsv $(DOWNLOADS)/genes.png $(DOWNLOADS)/drugs.tsv $(DOWNLOADS)/drugs.png
