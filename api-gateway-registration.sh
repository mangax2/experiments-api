#!/bin/bash

#These $ values are expected from the environment set up by Jenkins

export PING=$PING_URL
export NEXUS_PW=$NEXUS_PW

# Update this field with the URL of your Swagger Document
#   that you'd like to register as an API in Akana
swagger_url=$GATEWAY_SWAGGER_URL

payload=$(cat << EndOfMessage
 {
 "name" : "Envision Datasets API",
 "securityPolicy" : "OAuthSecurity",
 "operationalPolicies" : ["CORSAllowAll","BasicAuditing"],
 "apiVisibilityInfo" : { "apiVisibility" : "Registered" },
 "emailsToInviteAsAdmins" : ["ajay.2.kumar@monsanto.com,"kyle.mcclendon@monsanto.com,"kamaraju.prathi@monsanto.com","paul.n.watt@monsanto.com"],
 "serviceMaturityTag" : "Level2",
 "targetEndpoints" : ["http://${CF_DOMAIN}/"],
 "proxyEndpointInfo": {
            "protocol": "https",
            "deploymentZone": "$DEPLOYMENT_ZONE",
            "rootPath": "experiments-api"
          },
 "tags" : ["experiments-api","experiments","velocity-experiments-api","velocity-experiments","cosmos"],
 "platformTag" : "field"
 }
EndOfMessage
)
echo $payload
### Do not modify any of the below script.
# Note that there are 3 commands run together with `&&`. If one
#  command fails, then it does not run the last command.
# (1) Download the script (JAR)
# (2) run it with the above arguments
# (3) delete it
curl -u tpsjenkins:$NEXUS_PW -L 'https://nexus.agro.services/service/local/repositories/releases/content/com/monsanto/arch/register-api_2.11/0.1.8/register-api_2.11-0.1.8-assembly.jar' -o register-api.jar && java -jar register-api.jar SwaggerRegistration "$payload" $swagger_url && rm register-api.jar