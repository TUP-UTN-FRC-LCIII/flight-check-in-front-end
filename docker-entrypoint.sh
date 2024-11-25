#!/bin/sh

# Generate env.js with current environment variables
/usr/local/bin/generate-env.sh


if [ "$ENVIRONMENT" = "development" ]; then
    echo "Starting in DEVELOPMENT mode"
    ng serve --configuration=development --host 0.0.0.0 --poll=2000
elif [ "$ENVIRONMENT" = "local" ]; then
    echo "Starting in LOCAL mode"
    ng serve --configuration=local --host 0.0.0.0 --poll=2000
else
    echo "Starting in PRODUCTION mode"
    ng build --configuration=production
    # Copy env.js to dist folder
    cp src/env.js dist/flight-checkin/browser/
    # Serve the built files
    serve -s dist/flight-checkin/browser -l 4200
fi