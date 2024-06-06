# Install the app dependencies in a full Node docker image
FROM registry.access.redhat.com/ubi9/nodejs-20:latest

# Set the working directory
WORKDIR /opt/app-root/src

# Copy package.json, and optionally package-lock.json if it exists
COPY package.json package-lock.json* ./

# Install app dependencies
RUN npm ci 
# RUN npm ci --only=production

# Copy the application code
COPY . ./

# Clone the rules repository
# TODO:  -b ${BRANCH_NAME}
# TODO: docker build --build-arg BRANCH_NAME=$(git rev-parse --abbrev-ref HEAD) -t my-image .
RUN git clone -b dev https://github.com/bcgov/brms-rules.git rules-repo

# Start the application
CMD ["npm", "start"]