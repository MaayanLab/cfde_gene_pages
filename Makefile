DOWNLOADS=downloads
PYTHON=python3.8
NODE=node
NPM=npm

node_modules/:
	$(NPM) install

.next/server/availability.js: node_modules/
	$(NPM) run build

$(DOWNLOADS)/:
	mkdir -p $(DOWNLOADS)

$(DOWNLOADS)/genes.tsv: $(DOWNLOADS)/
	$(NODE) .next/server/availability.js gene > $@

$(DOWNLOADS)/genes.png: $(DOWNLOADS)/genes.tsv $(DOWNLOADS)/
	$(PYTHON) services/clustermap.py -i $< -o $>

$(DOWNLOADS)/drugs.tsv: $(DOWNLOADS)/
	$(NODE) .next/server/availability.js drug > $@

$(DOWNLOADS)/drugs.png: $(DOWNLOADS)/drugs.tsv $(DOWNLOADS)/
	$(PYTHON) services/clustermap.py -i $< -o $@

.PHONY: downloads
downloads: $(DOWNLOADS)/genes.tsv $(DOWNLOADS)/genes.png $(DOWNLOADS)/drugs.tsv $(DOWNLOADS)/drugs.png
