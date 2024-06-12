# Install the app dependencies in a full Node docker image
FROM registry.access.redhat.com/ubi9/nodejs-20:latest

# Set the environment variables
ARG RULES_REPO_BRANCH
ENV RULES_REPO_BRANCH=${RULES_REPO_BRANCH}

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
RUN git clone -b ${RULES_REPO_BRANCH} https://github.com/bcgov/brms-rules.git brms-rules

# Start the application
CMD ["npm", "start"]