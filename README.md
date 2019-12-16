# experiments-api
This is the API project for Velocity Experiments Workflow.

### Secrets Needed to Run
To run this project, you will need the following secrets:

In your .bash_profile, you will need
```
export EXPERIMENTS_DB_LOCAL_USER=experiments_dev_app_user
export EXPERIMENTS_DB_LOCAL_PASSWORD=
export EXPERIMENTS_API_CLIENT_ID=PD-EXPERIMENTS-API-DEV-SVC
export EXPERIMENTS_API_CLIENT_SECRET=
export KAFKA_PASSWORD=
```

Also, you will need to create `experiments-api-cosmos.pem` in the src directory. This file can be found base64 encoded in Vault. The .bash_profile secrets are also in Vault, but are not encoded in any fashion.