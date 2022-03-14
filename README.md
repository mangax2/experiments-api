# experiments-api
This is the API project for Velocity Experiments Workflow.

## Install

`npm ci`

## Running

Before running the application locally, you must run:

- `vaultAuth` to authenticate to Vault
- `ssh pg-dev` to open a connection to dev database
- `ssh pg-dev-ro` to open a connection to read-only dev database

### Development

`npm run dev`

### Debugging

`npm run debug`

If you are using VSCode, you may also use the launch configuration in `.vscode`.

### Tests

With hot reloading:
`npm run testDev`

Without hot reloading:
`npm run test`

Generate code coverage report in `./coverage`:
`npm run testCoverage`

### Overrides

To override configuration values in `./src/configs/coreSource.js` pulled from Vault, you can create an `overrides.json`
in the `./src/configs/` directory containing keys and values you wish to override.

i.e. to enable Kafka locally;
```
{
    "kafka": {
        "enableKafka": true,
    }
}
```
