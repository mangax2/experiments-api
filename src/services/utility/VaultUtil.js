const HttpUtil = require('./HttpUtil')
class VaultUtil {

    constructor() {
        this.dbAppUser = ""
        this.dbAppPassword = ""
    }


    static configureDbCredentials(env, vaultConfig) {
        if (env === 'local') {
            return Promise.resolve()
        } else {
            const vaultEnv=env==='prod'?'prod':'np'
            const body = {}
            body.role_id= vaultConfig.roleId
            body.secret_id = vaultConfig.secretId

            return  HttpUtil.post(`${vaultConfig.baseUrl}${vaultConfig.authUri}`,[{headerName:'Accept', headerValue:'application/json'}], JSON.stringify(body))
                .then((result) => {
                    const vaultToken = result.body.auth.client_token
                    return HttpUtil.get(`${vaultConfig.baseUrl}${vaultConfig.secretUri}/${vaultEnv}/db`,[{headerName:'X-Vault-Token', headerValue:`${vaultToken}`}])
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