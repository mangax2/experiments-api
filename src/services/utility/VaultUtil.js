var request = require('superagent')

class VaultUtil {

    constructor() {
        this.dbAppUser = ""
        this.dbAppPassword = ""
    }


    static configureDbCredentials(env, role_id, secret_id) {
        if (env === 'local') {
            return Promise.resolve()
        } else {
            const vaultEnv=env==='prod'?'prod':'np'
            const body = {}
            body.role_id=role_id
            body.secret_id=secret_id
            return request.post('https://vault.agro.services/v1/auth/approle/login')
                .set('Accept', 'application/json')
                .send(JSON.stringify(body))
                .then((result) => {
                    const vaultToken = result.body.auth.client_token
                    return request.get(`https://vault.agro.services/v1/secret/cosmos/experiments-api/${vaultEnv}/db`)
                        .set('X-Vault-Token', `${vaultToken}`)
                        .then((vaultObj) => {
                            this.dbAppUser = vaultObj.body.data.appUser
                            this.dbAppPassword = vaultObj.body.data.appUserPassword
                        })


                }).catch((err) => {
                    console.error(err)
                })


        }

    }

}

module.exports = VaultUtil