pm2 start dist/index.js --name=hlink-client --watch dist \
pm2 start dist/updateAdapter.js --name=hlink-client-update --watch dist/updateAdapter.js