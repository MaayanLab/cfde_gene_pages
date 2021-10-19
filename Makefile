DOWNLOADS=downloads
PYTHON=python3.8
NODE=node
NPM=npm

node_modules/:
	$(NPM) install

.next/server/availability.js: node_modules/
	$(NPM) run build

$(DOWNLOADS)/genes.tsv:
	$(NODE) .next/server/availability.js gene > $@

$(DOWNLOADS)/genes.png: $(DOWNLOADS)/genes.tsv
	$(PYTHON) services/clustermap.py -i $^ -o $@

$(DOWNLOADS)/drugs.tsv:
	$(NODE) .next/server/availability.js drug > $@

$(DOWNLOADS)/drugs.png: $(DOWNLOADS)/drugs.tsv
	$(PYTHON) services/clustermap.py -i $^ -o $@
