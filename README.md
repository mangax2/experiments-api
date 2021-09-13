# experiments-api
This is the API project for Velocity Experiments Workflow.

### Secrets Needed to Run
To run this project, you will need the following secrets from Vault:

In your .bash_profile, you will need
```
export EXPERIMENTS_API_CLIENT_ID=
export EXPERIMENTS_API_CLIENT_SECRET=
export KAFKA_PASSWORD=

export ENV=local
```

Also, you will need to create `experiments-api-cosmos.pem` in the src directory. This item can be found base64 encoded in Vault at cosmos/experiments/api/dev/kafka/privateKey.

Lastly, you will need to create an `overrides.json` in the `./src/config` directory with the following values: 
```
{
    "databaseHost": "localhost",
    "databasePort": "9000",
    "databaseRoHost": "localhost",
    "databaseRoPort": "9001"
}
```