pm2 start dist/index.js --name=hlink-client --watch dist
pm2 start dist/startUpdateAdapter.js --name=hlink-client-update --watch dist/startUpdateAdapter.js

