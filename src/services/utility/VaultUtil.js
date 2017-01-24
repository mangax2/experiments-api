const HttpUtil = require('./HttpUtil')
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
            return  HttpUtil.post('https://vault.agro.services/v1/auth/approle/login',[{headerName:'Accept', headerValue:'application/json'}], JSON.stringify(body))
                .then((result) => {
                    const vaultToken = result.body.auth.client_token
                    return HttpUtil.get(`https://vault.agro.services/v1/secret/cosmos/experiments-api/${vaultEnv}/db`,[{headerName:'X-Vault-Token', headerValue:`${vaultToken}`}])
                        .then((vaultObj) => {
                            this.dbAppUser = vaultObj.body.data.appUser
                            this.dbAppPassword = vaultObj.body.data.appUserPassword
                        })


                }).catch((err) => {
                    console.error(err)
                    return Promise.reject(err)
                })


        }

    }

}

module.exports = VaultUtil