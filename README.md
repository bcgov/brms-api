# BRMS API/Backend

This project is the API/Backend for the SDPR Business Rules Engine (BRE) and Business Rules Engine Management System (BRMS). It will act primarly as the backend for the [frontend simulator](https://github.com/bcgov/brms-simulator-frontend).

## Local Development Setup

### Running MongoDB Locally

A local MongoDB instance is required for the project to run properly. You'll have to set this up first and create a database for it. Make note of the URL.

### Setting Environment Variables

Before running your application locally, you'll need some environment variables. You can create a `.env` file to do so. Set the following variables:

- MONGODB_URL: The URL for connecting to the MongoDB instance you created in the previous step. Set it to something like mongodb://localhost/nest.
- FRONTEND_URI: The URI for the frontend application. Set it to http://localhost:8080.
- GITHUB_APP_CLIENT_ID
- GITHUB_APP_CLIENT_SECRET

### Including Rules from the Rules Repository

To get access to rules locally on your machine simply clone the repo at https://github.com/bcgov/brms-rules into your project. This project is set to grab rules from `brms-rules/rules`, which is the default location of rules if that project is cloned into this one.

### Running the Application

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

The API will now be available at [http://localhost:3000](http://localhost:3000).

## How to Contribute

Please note that this project is released with a [Contributor Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms.

## License

```
Copyright 2024 Province of British Columbia

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```
