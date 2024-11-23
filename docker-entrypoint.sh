#!/bin/sh

if [ "$ENVIRONMENT" = "development" ]; then
    echo "Starting in DEVELOPMENT mode"
    ng serve --configuration=development --host 0.0.0.0 --poll=2000
elif [ "$ENVIRONMENT" = "local" ]; then
    echo "Starting in LOCAL mode"
    ng serve --configuration=local --host 0.0.0.0 --poll=2000
else
    echo "Starting in PRODUCTION mode"
    ng serve --configuration=production --host 0.0.0.0 --poll=2000
fi
