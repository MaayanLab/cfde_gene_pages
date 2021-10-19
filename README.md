# CFDE Gene Pages

<https://cfde-gene-pages.cloud/>

## Development

```bash
# install dependencies
npm install
# run in development
npm run dev
```

## Production

### Docker
```bash
docker-compose up
```

### Native
```bash
# prepare
npm run build
# run in production
npm run start
```

### Building Downloads
A `Makefile` was created for directly assembling the downloads from scratch, it takes some time to execute.

```bash
# install any necessary python dependencies
pip install -r requirements.txt

# build all downloads
make downloads
```