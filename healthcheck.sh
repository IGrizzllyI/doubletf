#!/bin/bash
curl -f -m 2 localhost/api/coinflips
status=$?
echo "Status: $status"
if [ $status -ne 0 ]; then
    echo "Health check failed! Restarting app"
    PM2_HOME='/home/node/.pm2' /usr/local/bin/node /usr/local/lib/node_modules/pm2/bin/pm2 restart /home/node/doubletf/process.json
fi
