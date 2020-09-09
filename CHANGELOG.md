## 04/09/2020

- Add username and password support for Elasticsearch connection

# 2.0.0

## 17/07/2020

- Migrate to Elasticsearch 7.x

# v1.1.1

## 13/07/2020

- Security updates to the `handlebars` and `websocket-extensions` NPM packages.
- Capture additional details from write process into task logs.

# 1.1.0

## 09/04/2020

- Add node affinity to kubernetes configuration.

## 11/02/2020
- Streamline queue connection with other rabbitmq services
- Streamline tests

# v1.0.0

## 14/11/2019
- Replace ES library to match other API MSs
- Set CPU and memory quotas on k8s config
- Added liveliness and readiness probes to k8s config
- CS formatting to match ESLint rules
- Update ESLint packages and config
- Added hook to validate ESLint on commit
- Update node version to 12.x
- Replace npm with yarn
