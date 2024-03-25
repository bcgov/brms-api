# Install the app dependencies in a full Node docker image
FROM registry.access.redhat.com/ubi8/nodejs-18:latest

# Copy package.json, and optionally package-lock.json if it exists
COPY package.json package-lock.json* ./

# Install app dependencies
RUN \
  if [ -f package-lock.json ]; then npm ci; \
  else npm install; \
  fi

# Copy the dependencies into a Slim Node docker image
FROM registry.access.redhat.com/ubi8/nodejs-18-minimal:latest

# Install app dependencies
COPY --from=0 /opt/app-root/src/node_modules /opt/app-root/src/node_modules
COPY . /opt/app-root/src

# Expose port 3000
EXPOSE 3000

# Set environment variables
ENV FRONTEND_URI="http://localhost:8080"
ENV CHEFS_API_URL="https://submit.digital.gov.bc.ca/app/api/v1"
ENV CHEFS_AUTH=""

# Start the application
CMD ["npm", "start"]