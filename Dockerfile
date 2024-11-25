# Build stage
FROM node:20-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Install Angular CLI
RUN npm install -g @angular/cli@19.0.1

# Copy project files
COPY . .

# Build the app
RUN ng build --configuration production

# Runtime stage
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist/flight-checkin/browser /usr/share/nginx/html

# Copy env.js and env.sh
COPY src/env.js /usr/share/nginx/html/env.js
COPY env.sh /docker-entrypoint.d/env.sh

# Make env.sh executable
RUN chmod +x /docker-entrypoint.d/env.sh

# Add bash
RUN apk add --no-cache bash

# Expose port 4200
EXPOSE 4200

# Start nginx
CMD ["nginx", "-g", "daemon off;"]