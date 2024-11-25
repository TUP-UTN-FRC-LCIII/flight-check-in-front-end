#!/bin/sh

# Recreate config file
env_file="/usr/share/nginx/html/env.js"
echo "(function(window) {" > $env_file
echo "    window['env'] = window['env'] || {};" >> $env_file
echo "    window['env']['API_URL'] = '${API_URL}';" >> $env_file
echo "    window['env']['ENVIRONMENT'] = '${ENVIRONMENT}';" >> $env_file
echo "})(this);" >> $env_file