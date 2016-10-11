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
  "api-id":"${API_ID}",
  "api-gateway": {
    "name": "Experiments API",
    "security-policy": "OAuthSecurity",
    "operational-policies": ["CORSAllowAll","BasicAuditing","DetailedAuditingOnError"],
    "target-endpoints": ["${targetEndpoint}"],
    "proxy-endpoint-info": {
      "protocol": "https",
      "deployment-zone": "${DEPLOYMENT_ZONE}",
      "root-path": "experiments-api"
    },
    "api-admin-emails": ["ajay.2.kumar@monsanto.com","kyle.mcclendon@monsanto.com","kamaraju.prathi@monsanto.com","paul.n.watt@monsanto.com"],
    "groups": ["Monsanto"],
    "requires-approval": true,
    "platform-tag": "api",
    "tags": ["experiments-api","experiments","velocity-experiments-api","velocity-experiments","cosmos"],
    "additional-operations": [{"method":"GET", "uri":"/ping"}]
  },
  "swagger": "{
                  "swagger": "2.0",
                  "info": {
                      "title": "Experiments API",
                      "description": "Experiment APIs to create experiment model",
                      "version": "v1"
                  },
                  "host": "api01-np.agro.services",
                  "schemes": [
                      "https"
                  ],
                  "basePath": "/experiments-api",
                  "produces": [
                      "application/json"
                  ],
                  "paths": {
                      "/experiment-designs": {
                          "get": {
                              "summary": "Get all experiment designs",
                              "description": "Returns all experiment designs that can be used\n",
                              "tags": [
                                  "Experiment Design"
                              ],
                              "responses": {
                                  "200": {
                                      "description": "Array of experiment designs",
                                      "schema": {
                                          "type": "array",
                                          "items": {
                                              "$ref": "#/definitions/ExperimentDesign"
                                          }
                                      }
                                  },
                                  "401": {
                                      "description": "Unauthorized",
                                      "schema": {
                                          "$ref": "#/definitions/Error"
                                      }
                                  },
                                  "500": {
                                      "description": "Internal Server Error",
                                      "schema": {
                                          "$ref": "#/definitions/Error"
                                      }
                                  }
                              }
                          },
                          "post": {
                              "summary": "Adds a new experiment design",
                              "description": "Posts a new experiment design",
                              "tags": [
                                  "Experiment Design"
                              ],
                              "parameters": [
                                  {
                                      "name": "experimentDesign",
                                      "in": "body",
                                      "required": true,
                                      "schema": {
                                          "$ref": "#/definitions/ExperimentDesignPayload"
                                      }
                                  }
                              ],
                              "responses": {
                                  "201": {
                                      "description": "ID of newly created experiment design",
                                      "schema": {
                                          "type": "number"
                                      }
                                  },
                                  "400": {
                                      "description": "Invalid body",
                                      "schema": {
                                          "$ref": "#/definitions/Error"
                                      }
                                  },
                                  "401": {
                                      "description": "Unauthorized",
                                      "schema": {
                                          "$ref": "#/definitions/Error"
                                      }
                                  },
                                  "500": {
                                      "description": "Internal Server Error",
                                      "schema": {
                                          "$ref": "#/definitions/Error"
                                      }
                                  }
                              }
                          }
                      },
                      "/experiment-designs/{id}": {
                          "get": {
                              "summary": "Get one experiment design entity",
                              "description": "Returns a single experiment design entity\n",
                              "tags": [
                                  "Experiment Design"
                              ],
                              "parameters": [
                                  {
                                      "name": "id",
                                      "in": "path",
                                      "type": "string",
                                      "required": true
                                  }
                              ],
                              "responses": {
                                  "200": {
                                      "description": "Array of experiment designs",
                                      "schema": {
                                          "type": "array",
                                          "items": {
                                              "$ref": "#/definitions/ExperimentDesign"
                                          }
                                      }
                                  },
                                  "400": {
                                      "description": "Invalid Request",
                                      "schema": {
                                          "$ref": "#/definitions/Error"
                                      }
                                  },
                                  "401": {
                                      "description": "Unauthorized",
                                      "schema": {
                                          "$ref": "#/definitions/Error"
                                      }
                                  },
                                  "404": {
                                      "description": "Experiment Design Does Not Exist",
                                      "schema": {
                                          "$ref": "#/definitions/Error"
                                      }
                                  },
                                  "500": {
                                      "description": "Internal Server Error",
                                      "schema": {
                                          "$ref": "#/definitions/Error"
                                      }
                                  }
                              }
                          },
                          "put": {
                              "summary": "Update one experiment design",
                              "description": "Updates a single experiment design entity\n",
                              "tags": [
                                  "Experiment Design"
                              ],
                              "parameters": [
                                  {
                                      "name": "id",
                                      "in": "path",
                                      "type": "string",
                                      "required": true
                                  },
                                  {
                                      "name": "experimentDesign",
                                      "in": "body",
                                      "required": true,
                                      "schema": {
                                          "$ref": "#/definitions/ExperimentDesignPayload"
                                      }
                                  }
                              ],
                              "responses": {
                                  "200": {
                                      "description": "Updated Experiment Design entity",
                                      "schema": {
                                          "$ref": "#/definitions/ExperimentDesign"
                                      }
                                  },
                                  "400": {
                                      "description": "Invalid Request",
                                      "schema": {
                                          "$ref": "#/definitions/Error"
                                      }
                                  },
                                  "401": {
                                      "description": "Unauthorized",
                                      "schema": {
                                          "$ref": "#/definitions/Error"
                                      }
                                  },
                                  "404": {
                                      "description": "Experiment Design Does Not Exist",
                                      "schema": {
                                          "$ref": "#/definitions/Error"
                                      }
                                  },
                                  "500": {
                                      "description": "Internal Server Error",
                                      "schema": {
                                          "$ref": "#/definitions/Error"
                                      }
                                  }
                              }
                          },
                          "delete": {
                              "summary": "Deletes one experiment design",
                              "description": "Deletes a single experiment design entity\n",
                              "tags": [
                                  "Experiment Design"
                              ],
                              "parameters": [
                                  {
                                      "name": "id",
                                      "in": "path",
                                      "type": "string",
                                      "required": true
                                  }
                              ],
                              "responses": {
                                  "204": {
                                      "description": "Deleted Experiment Design entity",
                                      "schema": {
                                          "type": "number"
                                      }
                                  },
                                  "400": {
                                      "description": "Invalid Request",
                                      "schema": {
                                          "$ref": "#/definitions/Error"
                                      }
                                  },
                                  "401": {
                                      "description": "Unauthorized",
                                      "schema": {
                                          "$ref": "#/definitions/Error"
                                      }
                                  },
                                  "404": {
                                      "description": "Experiment Design Does Not Exist",
                                      "schema": {
                                          "$ref": "#/definitions/Error"
                                      }
                                  },
                                  "500": {
                                      "description": "Internal Server Error",
                                      "schema": {
                                          "$ref": "#/definitions/Error"
                                      }
                                  }
                              }
                          }
                      },
                      "/experiments": {
                          "get": {
                              "summary": "get all experiment entities",
                              "description": "This endpoint returns information about the experiments.\n",
                              "tags": [
                                  "Experiments"
                              ],
                              "responses": {
                                  "200": {
                                      "description": "An array of experiments",
                                      "schema": {
                                          "type": "array",
                                          "items": {
                                              "$ref": "#/definitions/ExperimentResponse"
                                          }
                                      }
                                  },
                                  "401": {
                                      "description": "Unauthorized",
                                      "schema": {
                                          "$ref": "#/definitions/Error"
                                      }
                                  },
                                  "500": {
                                      "description": "Internal Server Error",
                                      "schema": {
                                          "$ref": "#/definitions/Error"
                                      }
                                  }
                              }
                          },
                          "post": {
                              "summary": "post one or more experiment entities",
                              "description": "Creates new experiments in Experiments System.\n",
                              "tags": [
                                  "Experiments"
                              ],
                              "parameters": [
                                  {
                                      "name": "experiment",
                                      "in": "body",
                                      "required": true,
                                      "schema": {
                                          "type": "array",
                                          "items": {
                                              "$ref": "#/definitions/ExperimentPayload"
                                          }
                                      }
                                  }
                              ],
                              "responses": {
                                  "201": {
                                      "description": "Experiment Created",
                                      "schema": {
                                          "type": "array",
                                          "items": {
                                              "$ref": "#/definitions/CreateResponse"
                                          }
                                      }
                                  },
                                  "400": {
                                      "description": "Invalid/Problematic Input",
                                      "schema": {
                                          "type": "array",
                                          "items": {
                                              "$ref": "#/definitions/Error"
                                          }
                                      }
                                  },
                                  "401": {
                                      "description": "Unauthorized",
                                      "schema": {
                                          "$ref": "#/definitions/Error"
                                      }
                                  },
                                  "500": {
                                      "description": "Internal Server Error",
                                      "schema": {
                                          "$ref": "#/definitions/Error"
                                      }
                                  }
                              }
                          }
                      },
                      "/experiments/{id}": {
                          "get": {
                              "summary": "get one experiment entity",
                              "description": "The Experiments endpoint returns information about the experiment entities in Experiments System.\n",
                              "tags": [
                                  "Experiments"
                              ],
                              "parameters": [
                                  {
                                      "name": "id",
                                      "in": "path",
                                      "type": "integer",
                                      "required": true
                                  }
                              ],
                              "responses": {
                                  "200": {
                                      "description": "Experiment entity",
                                      "schema": {
                                          "type": "object",
                                          "items": {
                                              "$ref": "#/definitions/ExperimentResponse"
                                          }
                                      }
                                  },
                                  "400": {
                                      "description": "Invalid ID",
                                      "schema": {
                                          "$ref": "#/definitions/Error"
                                      }
                                  },
                                  "401": {
                                      "description": "Unauthorized",
                                      "schema": {
                                          "$ref": "#/definitions/Error"
                                      }
                                  },
                                  "404": {
                                      "description": "No Experiment Found For ID",
                                      "schema": {
                                          "$ref": "#/definitions/Error"
                                      }
                                  },
                                  "500": {
                                      "description": "Internal Server Error",
                                      "schema": {
                                          "$ref": "#/definitions/Error"
                                      }
                                  }
                              }
                          },
                          "put": {
                              "summary": "put one experiment entity",
                              "description": "update experiment entiry in Experiments System.\n",
                              "tags": [
                                  "Experiments"
                              ],
                              "parameters": [
                                  {
                                      "name": "id",
                                      "in": "path",
                                      "type": "integer",
                                      "required": true
                                  },
                                  {
                                      "name": "experiment",
                                      "in": "body",
                                      "required": true,
                                      "schema": {
                                          "$ref": "#/definitions/ExperimentPayload"
                                      }
                                  }
                              ],
                              "responses": {
                                  "200": {
                                      "description": "Experiment entity",
                                      "schema": {
                                          "$ref": "#/definitions/ExperimentResponse"
                                      }
                                  },
                                  "400": {
                                      "description": "Invalid/Problematic Input",
                                      "schema": {
                                          "type": "array",
                                          "items": {
                                              "$ref": "#/definitions/Error"
                                          }
                                      }
                                  },
                                  "401": {
                                      "description": "Unauthorized",
                                      "schema": {
                                          "$ref": "#/definitions/Error"
                                      }
                                  },
                                  "404": {
                                      "description": "No Experiment Found For ID",
                                      "schema": {
                                          "$ref": "#/definitions/Error"
                                      }
                                  },
                                  "500": {
                                      "description": "Internal Server Error",
                                      "schema": {
                                          "$ref": "#/definitions/Error"
                                      }
                                  }
                              }
                          },
                          "delete": {
                              "summary": "delete one experiment entity",
                              "description": "delete experiment entity in Experiments System.\n",
                              "tags": [
                                  "Experiments"
                              ],
                              "parameters": [
                                  {
                                      "name": "id",
                                      "in": "path",
                                      "type": "string",
                                      "required": true
                                  }
                              ],
                              "responses": {
                                  "204": {
                                      "description": "Experiment Deleted",
                                      "schema": {
                                          "type": "string"
                                      }
                                  },
                                  "400": {
                                      "description": "Invalid ID",
                                      "schema": {
                                          "$ref": "#/definitions/Error"
                                      }
                                  },
                                  "404": {
                                      "description": "No Experiment Found For ID",
                                      "schema": {
                                          "$ref": "#/definitions/Error"
                                      }
                                  },
                                  "500": {
                                      "description": "Internal Server Error",
                                      "schema": {
                                          "$ref": "#/definitions/Error"
                                      }
                                  }
                              }
                          }
                      },
                      "/factor-types": {
                          "get": {
                              "summary": "Get all factor types",
                              "description": "Returns all factor types that can be used\n",
                              "tags": [
                                  "Factor Type"
                              ],
                              "responses": {
                                  "200": {
                                      "description": "Array of factor types",
                                      "schema": {
                                          "type": "array",
                                          "items": {
                                              "$ref": "#/definitions/FactorType"
                                          }
                                      }
                                  },
                                  "401": {
                                      "description": "Unauthorized",
                                      "schema": {
                                          "$ref": "#/definitions/Error"
                                      }
                                  },
                                  "500": {
                                      "description": "Internal Server Error",
                                      "schema": {
                                          "$ref": "#/definitions/Error"
                                      }
                                  }
                              }
                          },
                          "post": {
                              "summary": "Adds a new factor type",
                              "description": "Creates a new factor type",
                              "tags": [
                                  "Factor Type"
                              ],
                              "parameters": [
                                  {
                                      "name": "factorType",
                                      "in": "body",
                                      "schema": {
                                          "$ref": "#/definitions/FactorTypePayload"
                                      }
                                  }
                              ],
                              "responses": {
                                  "201": {
                                      "description": "ID of newly created factor type",
                                      "schema": {
                                          "type": "number"
                                      }
                                  },
                                  "400": {
                                      "description": "Invalid body",
                                      "schema": {
                                          "$ref": "#/definitions/Error"
                                      }
                                  },
                                  "401": {
                                      "description": "Unauthorized",
                                      "schema": {
                                          "$ref": "#/definitions/Error"
                                      }
                                  },
                                  "500": {
                                      "description": "Internal Server Error",
                                      "schema": {
                                          "$ref": "#/definitions/Error"
                                      }
                                  }
                              }
                          }
                      },
                      "/factor-types/{id}": {
                          "get": {
                              "summary": "Get one factor type entity",
                              "description": "Returns a single factor type entity\n",
                              "tags": [
                                  "Factor Type"
                              ],
                              "parameters": [
                                  {
                                      "name": "id",
                                      "in": "path",
                                      "type": "string",
                                      "required": true
                                  }
                              ],
                              "responses": {
                                  "200": {
                                      "description": "Single Factor Type Entity",
                                      "schema": {
                                          "$ref": "#/definitions/FactorType"
                                      }
                                  },
                                  "400": {
                                      "description": "Invalid Request",
                                      "schema": {
                                          "$ref": "#/definitions/Error"
                                      }
                                  },
                                  "401": {
                                      "description": "Unauthorized",
                                      "schema": {
                                          "$ref": "#/definitions/Error"
                                      }
                                  },
                                  "404": {
                                      "description": "Factor Type Does Not Exist",
                                      "schema": {
                                          "$ref": "#/definitions/Error"
                                      }
                                  },
                                  "500": {
                                      "description": "Internal Server Error",
                                      "schema": {
                                          "$ref": "#/definitions/Error"
                                      }
                                  }
                              }
                          },
                          "put": {
                              "summary": "Update one factor type",
                              "description": "Updates a single factor type entity\n",
                              "tags": [
                                  "Factor Type"
                              ],
                              "parameters": [
                                  {
                                      "name": "id",
                                      "in": "path",
                                      "type": "string",
                                      "required": true
                                  },
                                  {
                                      "name": "factorType",
                                      "in": "body",
                                      "required": true,
                                      "schema": {
                                          "$ref": "#/definitions/FactorTypePayload"
                                      }
                                  }
                              ],
                              "responses": {
                                  "200": {
                                      "description": "Updated Factor Type entity",
                                      "schema": {
                                          "$ref": "#/definitions/FactorType"
                                      }
                                  },
                                  "400": {
                                      "description": "Invalid Request",
                                      "schema": {
                                          "$ref": "#/definitions/Error"
                                      }
                                  },
                                  "401": {
                                      "description": "Unauthorized",
                                      "schema": {
                                          "$ref": "#/definitions/Error"
                                      }
                                  },
                                  "404": {
                                      "description": "Factor Type Does Not Exist",
                                      "schema": {
                                          "$ref": "#/definitions/Error"
                                      }
                                  },
                                  "500": {
                                      "description": "Internal Server Error",
                                      "schema": {
                                          "$ref": "#/definitions/Error"
                                      }
                                  }
                              }
                          },
                          "delete": {
                              "summary": "Deletes one factor type",
                              "description": "Deletes a single factor type entity\n",
                              "tags": [
                                  "Factor Type"
                              ],
                              "parameters": [
                                  {
                                      "name": "id",
                                      "in": "path",
                                      "type": "string",
                                      "required": true
                                  }
                              ],
                              "responses": {
                                  "204": {
                                      "description": "Deleted Experimental Design entity",
                                      "schema": {
                                          "type": "number"
                                      }
                                  },
                                  "400": {
                                      "description": "Invalid Request",
                                      "schema": {
                                          "$ref": "#/definitions/Error"
                                      }
                                  },
                                  "401": {
                                      "description": "Unauthorized",
                                      "schema": {
                                          "$ref": "#/definitions/Error"
                                      }
                                  },
                                  "404": {
                                      "description": "Factor Type Does Not Exist",
                                      "schema": {
                                          "$ref": "#/definitions/Error"
                                      }
                                  },
                                  "500": {
                                      "description": "Internal Server Error",
                                      "schema": {
                                          "$ref": "#/definitions/Error"
                                      }
                                  }
                              }
                          }
                      }
                  },
                  "definitions": {
                      "ExperimentDesign": {
                          "type": "object",
                          "properties": {
                              "id": {
                                  "type": "string",
                                  "description": "unique id for experiment design entity"
                              },
                              "name": {
                                  "type": "string",
                                  "description": "name of experiment design"
                              }
                          }
                      },
                      "ExperimentDesignPayload": {
                          "type": "object",
                          "properties": {
                              "name": {
                                  "type": "string",
                                  "description": "name of experiment design"
                              }
                          }
                      },
                      "ExperimentResponse": {
                          "type": "object",
                          "properties": {
                              "id": {
                                  "type": "integer",
                                  "description": "unique id for experiment entity"
                              },
                              "name": {
                                  "type": "string",
                                  "description": "name of the experiment entity."
                              },
                              "subjectType": {
                                  "type": "string",
                                  "description": "Subject of the Experiment."
                              },
                              "reps": {
                                  "type": "integer",
                                  "description": "Number of reps."
                              },
                              "ExperimentDesign": {
                                  "type": "string",
                                  "description": "Experiment Design Type"
                              },
                              "status": {
                                  "type": "string",
                                  "description": "status of the experiment entity."
                              },
                              "createdDate": {
                                  "type": "string",
                                  "description": "created timestamp in UTC."
                              },
                              "createdUserId": {
                                  "type": "string",
                                  "description": "created user id for audit tracking."
                              },
                              "modifiedDate": {
                                  "type": "string",
                                  "description": "Modified timestamp in UTC."
                              },
                              "modifiedUserId": {
                                  "type": "string",
                                  "description": "modified user id for audit tracking."
                              }
                          }
                      },
                      "CreateResponse": {
                          "type": "object",
                          "properties": {
                              "status": {
                                  "type": "integer",
                                  "description": "http status code, 201 for success and 4.x.x for errors."
                              },
                              "message": {
                                  "type": "string",
                                  "description": "Resource created or error description in case of error."
                              },
                              "id": {
                                  "type": "integer",
                                  "description": "id of newely created resource or black in case of error."
                              }
                          }
                      },
                      "ExperimentPayload": {
                          "type": "object",
                          "properties": {
                              "name": {
                                  "type": "string",
                                  "description": "name of the experiment entity."
                              },
                              "subjectType": {
                                  "type": "string",
                                  "description": "Subject of the Experiment."
                              },
                              "reps": {
                                  "type": "integer",
                                  "description": "Number of reps."
                              },
                              "experimentDesign": {
                                  "type": "string",
                                  "description": "ExperimentDesign Type."
                              },
                              "status": {
                                  "type": "string",
                                  "description": "status of the experiment entity."
                              }
                          }
                      },
                      "FactorType": {
                          "type": "object",
                          "properties": {
                              "id": {
                                  "type": "string",
                                  "description": "unique id for factor type"
                              },
                              "type": {
                                  "type": "string",
                                  "description": "name of the factor type"
                              }
                          }
                      },
                      "FactorTypePayload": {
                          "type": "object",
                          "properties": {
                              "type": {
                                  "type": "string",
                                  "description": "name of the factor type"
                              }
                          }
                      },
                      "Error": {
                          "type": "object",
                          "properties": {
                              "status": {
                                  "type": "integer",
                                  "format": "int32"
                              },
                              "code": {
                                  "type": "string"
                              },
                              "errorMessage": {
                                  "type": "string"
                              }
                          }
                      }
                  }
              }
"
}]
EndOfMessage
)
echo $payload

payloadFilename="registeration-temp-`date +"%s"`.json"
$(echo ${payload} > ${payloadFilename})
echo

#curl -v -X POST -H "Authorization: bearer $ACCESS_TOKEN" -H "Cache-Control: no-cache" -H "Content-Type: application/json" --data @${payloadFilename} https://api01-np.agro.services/api-gateway-api/v2/apis

curl -v -X PUT -H "Authorization: bearer $ACCESS_TOKEN" -H "Cache-Control: no-cache" -H "Content-Type: application/json" --data @${payloadFilename} https://api01-np.agro.services/api-gateway-api/v2/apis/${API_ID}

echo
rm ${payloadFilename}
echo "Deleted temp file ${payloadFilename}"