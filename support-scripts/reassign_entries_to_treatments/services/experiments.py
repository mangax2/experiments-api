import json
import os
import pandas as pd
import requests
import sgqlc as gql
from sgqlc.endpoint.http import HTTPEndpoint

from . import utils


def getExperimentURL(env):
  return "{url}/experiments-api/v3".format(url=utils.getBaseURL(env))


def getGraphQLURL(env):
  return "{url}/experiments-api-graphql/v1/graphql".format(url=utils.getBaseURL(env))


treatmentsEndpoint = "/experiments/{id}/treatments"
experimentalUnitsEndpoint = "/experiments/{id}/experimental-units"
getUnitsByExperimentIdQuery = """
query GetUnitsByExperimentId($experimentId: Int!) {
  getUnitsByExperimentId(experimentId:$experimentId) {
    id,
    block,
    blockId,
    treatmentId,
    setEntryId
  }
}
"""
getTreatmentsByExperimentIdQuery = """
query GetTreatmentsByExperimentId($experimentId: Int!) {
  getTreatmentsByExperimentId(experimentId:$experimentId){
    id, 
    isControl,
    inAllBlocks,
    blockId,
    combinationElements{
      id,
      treatmentVariableLevelId,
      treatmentId,
      treatmentVariableLevel {
        id,
        valueJSON, 
        nestedLevels {valueJSON}
        associatedLevels {valueJSON}
      }
    },
    controlTypes
  }
}
"""


def getUnitsByExperimentId(experiment, env, experimentsToken, store, **kwargs):
  filename = ''
  if store:
    filename = 'getUnitsByExperimentResponse'
  response = getFromGraphQL(getUnitsByExperimentIdQuery, filename, experiment, env, experimentsToken, store)
  return response['getUnitsByExperimentId']


def getTreatmentsByExperimentId(experiment, env, experimentsToken, store, **kwargs):
  filename = ''
  if store:
    filename = 'getTreatmentsByExperimentResponse'
  response = getFromGraphQL(getTreatmentsByExperimentIdQuery, filename, experiment, env, experimentsToken, store)
  return response['getTreatmentsByExperimentId']


def getFromGraphQL(query, filename, experiment, env, token, store=False):
  headers = utils.getHeaders(token)
  endpoint = HTTPEndpoint(getGraphQLURL(env), headers)
  variables = {"experimentId": experiment}
  data = endpoint(query, variables)
  if "errors" in data.keys() and len(data["errors"]) > 0:
    raise RuntimeError(data["errors"])
  if store and filename != '':
    with open('{0}/{1}.json'.format(utils.getRegressionDataPath(), filename), 'w') as fid:
      json.dump(data, fid, indent=2)
  return data['data']


def parseTreatments(treatments):
  retval = []
  for treatment in treatments:
    for element in treatment["combinationElements"]:
      for item in element["treatmentVariableLevel"]['valueJSON']['items']:
        if item['catalogType'] == "INTERNAL_SEED":
          if 'value' not in item:
            catalogId = -1
          else:
            catalogId = item['value']
          retval.append({
            "catalog": catalogId,
            "variableLabel": item["label"],
            "treatmentId": treatment["id"],
            "combinationId": element["id"],
            "treatmentVariableLevelId": element["treatmentVariableLevelId"]
          })
  return retval


def parseExperimentResponses(units, treatments):
  unitsFrame = pd.DataFrame(units)
  unitsFrame = unitsFrame.dropna().astype(dict(id='int64', blockId='int64', treatmentId='int64', setEntryId='int64', block='object'))  # if Set entries aren't associated yet, they will be 'NaN' (which we don't care about)
  unitsFrame = unitsFrame.rename(columns={"setEntryId": "entryId", "id": "experimentalUnitId"})
  parsedTreatments = parseTreatments(treatments)
  txFrame = pd.DataFrame(parsedTreatments)
  txToUnits = txFrame.merge(unitsFrame, on=["treatmentId"], how="inner", copy=True, validate="one_to_many")
  txToUnits = txToUnits.astype({'catalog': 'int64'})
  return txToUnits


def getUnitsToTreatments(experiment, env, experimentsToken, store=False, **kwargs):
  units = getUnitsByExperimentId(experiment, env, experimentsToken, store)
  treatments = getTreatmentsByExperimentId(experiment, env, experimentsToken, store)
  return parseExperimentResponses(units, treatments)


def patchExperimentalUnits(*args, id=None, env=None, experimentsToken='', testing=False, update=False, **kwargs):
  """
  args = (eunit_1, entryId_1), (eunit_2, entryId_2)
  """
  headers = utils.getHeaders(experimentsToken)
  body = sorted([{"id":eunit, "setEntryId":entry} for eunit, entry in args], key=lambda d: d["setEntryId"])
  if testing or update:
    print("Found {0} experimental units to fix...".format(len(args)))
    request = requests.Request("PATCH", getExperimentURL(env) + experimentalUnitsEndpoint.format(id=id), headers=headers, data=json.dumps(body))
    return request.prepare()

  print("Patching {0} experimental units...".format(len(args)))

  # abort = input("Would you like to abort and examine? Y/n ")
  # if abort.lower() == "y":
  #   print()
  #   print("-"*100)
  #   print(json.dumps(body, sort_keys=True, indent=2))
  #   print("-"*100)
  #   return None

  response = requests.patch(getExperimentURL(env) + experimentalUnitsEndpoint.format(id=id), headers=headers, data=json.dumps(body))
  response.raise_for_status()
  return response
