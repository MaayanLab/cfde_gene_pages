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

$(DOWNLOADS)/genes.png: | $(DOWNLOADS)/ $(DOWNLOADS)/genes.tsv
	$(PYTHON) services/clustermap.py -i $< -o $@

$(DOWNLOADS)/drugs.tsv: | $(DOWNLOADS)/
	$(NODE) .next/server/availability.js drug > $@

$(DOWNLOADS)/drug-resource-manifest.tsv: | $(DOWNLOADS)/
	$(NODE) .next/server/manifest.js drug > $@

$(DOWNLOADS)/drugs.png: | $(DOWNLOADS)/ $(DOWNLOADS)/drugs.tsv
	$(PYTHON) services/clustermap.py -i $< -o $@

.PHONY: downloads
downloads: $(DOWNLOADS)/genes.tsv $(DOWNLOADS)/genes.png $(DOWNLOADS)/drugs.tsv $(DOWNLOADS)/drugs.png
