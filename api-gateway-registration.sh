#!/bin/bash

namePostfix="-np"
if [ -z "$namePostfix" ]; then cfPostfix=""; else cfPostfix="-np"; fi

targetEndpoint="http://${CF_DOMAIN}/"
# swagger=$(curl ${targetEndpoint}/api-docs/swagger.json)
swagger=$(curl $SWAGGER_URL | tr "\n" " " | tr "\t" " " | tr "  " " ")

#    "description": undefined,
#    "cname": undefined,
#      "deployment-zone": "api01${namePostfix}.agro.services",  ### no -01 in dev...

 payload=$(cat << EndOfMessage
[{
  "api-gateway": {
    "name": "Experiments API",
    "security-policy": "OAuthSecurity",
    "operational-policies": ["CORSAllowAll","BasicAuditing","DetailedAuditingOnError"],
    "target-endpoints": ["${targetEndpoint}"],
    "proxy-endpoint-info": {
      "protocol": "https",
      "deployment-zone": $DEPLOYMENT_ZONE,
      "root-path": "experiments-api"
    },
    "api-admin-emails": ["ajay.2.kumar@monsanto.com","kyle.mcclendon@monsanto.com","kamaraju.prathi@monsanto.com","paul.n.watt@monsanto.com"],
    "groups": ["Cosmos"],
    "requires-approval": true,
    "platform-tag": "api",
    "tags": ["experiments-api","experiments","velocity-experiments-api","velocity-experiments","cosmos"]
  },
  "swagger": $swagger
}]
EndOfMessage
)
echo $payload

payloadFilename="registeration-temp-`date +"%s"`.json"
$(echo ${payload} > ${payloadFilename})
echo

# curl -X POST -H "Cache-Control: no-cache" -H "Content-Type: application/json" -d ${payload} $targetEndpoint/apis
curl -v -X PUT -H "Authorization: bearer $ACCESS_TOKEN" -H "Cache-Control: no-cache" -H "Content-Type: application/json" --data @${payloadFilename} https://api01-np.agro.services/api-gateway-api/v2/apis
# echo "curl -X POST -H \"Cache-Control: no-cache\" -H \"Content-Type: application/json\" -d $payload http://localhost:8080/apis"

echo
rm ${payloadFilename}
echo "Deleted temp file ${payloadFilename}"