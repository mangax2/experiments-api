#!/usr/bin/env python3
"""
Usage:
  reassign_entries_to_treatments.py [-u | --update] --env=ENV --experiment=ID -e=TOKEN -s=TOKEN -v=TOKEN
  reassign_entries_to_treatments.py (-h | --help)
  reassign_entries_to_treatments.py --version

Options:
  -h --help         Show this screen.
  --version         Show version.
  --experiment=ID   Find all sets by experiment ID
  -u --update       Overwrite regression testing data with new data
  --env=ENV         Environment to run in.  Values are 'prod' or 'nonprod'. 
                      [default: 'nonprod']
  -e=TOKEN          Token for Experiments API
  -s=TOKEN          Token for Sets API
  -v=TOKEN          Token for Velocity Materials API
"""
# # Introduction
# For the experiment, we need to reassign the mapping between the experimental unit and the treatment.  
# Unfortunately, determining the new assignments means we need some information from other serivces.  Here they are:
# 1. First and foremost, we need to get the data that caused this mess in the first place - the seed materials that are (some incorrectly!) assigned to the entries in Sets.
# 2. With the material-to-entry IDs in hand, we need to go to Velocity Materials and get the catalog IDs that were assigned to the combination element in each experiment level. (Remember, Set material is assigned on the lot and/or inventory level!)
# 
# With this information in hand, we can identify which entry CAN go to which experimental unit and which are irreparably foobar...

from docopt import docopt
from getpass import getuser
from itertools import accumulate
import json
import numpy as np
import os
import pandas as pd
import requests
import sgqlc as gql
from sgqlc.endpoint.http import HTTPEndpoint


def getRegressionDataPath():
  pathlist = __file__.split(os.path.sep)[:-1]
  pathlist[-1] = 'test/data'
  regressionDataPath = os.path.join(*pathlist)
  return regressionDataPath

def getHeaders(token):
  return {
    'oauth_resourceownerinfo': "user_id={0}".format(getuser().lower()), 
    'Authorization': "Bearer {0}".format(token),
    "Content-Type": "application/json",
  }

def getSuffix(env):
  suffix = "-np"
  if env == "prod":
    suffix = ""
  return suffix

def getSetURL(env):
  return "https://api01{suffix}.agro.services/sets-api/v2".format(suffix=getSuffix(env))

def getExperimentURL(env):
  return "https://api01{suffix}.agro.services/experiments-api/v3".format(suffix=getSuffix(env))

def getVelmatURL(env):
  return "https://velmat-search-api.velocity{suffix}.ag/search".format(suffix=getSuffix(env))

treatmentsEndpoint = "/experiments/{id}/treatments"
experimentalUnitsEndpoint = "/experiments/{id}/experimental-units"
setEntriesEndpoint = "/set-entries"

# ## Get the materials assigned to each set entry
# 
# Let's query the Sets service and get the mapping of `setEntryId` -> `seedMaterial` (with `materialType` and `materialId`).
def getSetsByExperiment(experiment=None, env='np', setsToken='', store=False, *args, **kwargs):
  params = {'sourceId': experiment, "entries": "true", "limit": 500}
  headers = getHeaders(setsToken)
  response = requests.get(getSetURL(env) + "/sets", params=params, headers=headers)
  response.raise_for_status()
  if store:
    with open(os.path.join(getRegressionDataPath(), 'setsByExperimentResponse.json'), 'w') as fid:
      fid.write(json.dumps(response.json(), sort_keys=True, indent=2))
  retval = pd.io.json.json_normalize(response.json(), 
                                     ["entries", "materials"],
                                     [
                                       ["entries", "setId"],
                                       ["entries", "entryId"],
                                       "name",
                                     ],
                                     errors='ignore', max_level=10)
  retval = retval[['materialId', 'materialType', 'productType', 'materialName', 'entries.setId', 'entries.entryId', 'name']]
  retval = retval.rename(columns={"entries.setId": "setId", "entries.entryId": "entryId", "name": "setName"})
  for column in ['materialId', 'setId', 'entryId']:
    retval[column] = retval[column].astype('int64')
  return retval

def getSeedsOnly(df):
  return df[df.materialType == 'internal_seed']
  
# ## Get the catalog information from Velmat
# 
# Now that we have the seed material information in hand, we need to get the relationship between how Experiments stores the material (the catalog ID) and how Sets stores the material (an inventory or lot ID).

def getMaterialsFromSet(df):
  materials = []
  for index, material in df.iterrows():
    materials.append((
      material.productType, 
      "INTERNAL_SEED", 
      int(material.materialId), 
      int(material.entryId), 
      int(material.setId)
    ))
  return materials

def generateListQuery(materials):
  retval = []
  for index, materialType, materialId, entryId, setId in materials:
    entry = {'_index':index, '_type':materialType, '_id': materialId}
    retval.append(entry)
  return json.dumps(retval, sort_keys=True, indent=2)

def getSetMaterialData(materials, env='', velmatToken='', store=False, **kwargs):
  """ 
  Return a list of dictionaries with keys 'catalogId', 'lotId', and 'inventoryId'.
  The lot OR the inventory key can == None.
  """
  url = "https://velmat-search-api.velocity-np.ag/v2/load"
  headers = {'Authorization': "Bearer {0}".format(velmatToken),
            'Content-Type': 'application/json'}
  query = generateListQuery(materials)
  response = requests.post(url, data=query, headers=headers)
  response.raise_for_status()
  if store:
    with open(os.path.join(getRegressionDataPath(), 'velmatSearchResponse.json'), 'w') as fid:
      fid.write(json.dumps(response.json(), sort_keys=True, indent=2))
  retval = []
  for catalog in response.json():
    item = {}
    item["catalogId"] = int(catalog["_source"]["catalog"]["id"])
    item["lotId"] = catalog["_source"].get("lot", {}).get("id", None)
    if int(catalog["_id"]) != item["lotId"]: 
      item["materialId"] = int(catalog["_id"])
    else: 
      item["materialId"] = int(item["lotId"])
    retval.append(item)
  retval = pd.DataFrame(retval)
  for column in ['materialId']:
    retval[column] = retval[column].astype('int64')
  return retval

# ## Identify the treatment that the set entry SHOULD be assigned to
# 
# So now we know what catalog item each material comes from.  We need to get the entry-to-catalog mapping so we can then map the entry to the treatment combination in Experiments. 

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
  return getFromGraphQL(getUnitsByExperimentIdQuery, filename, experiment, env, experimentsToken, store)['getUnitsByExperimentId']

def getTreatmentsByExperimentId(experiment, env, experimentsToken, store, **kwargs):
  filename = ''
  if store:
    filename = 'getTreatmentsByExperimentResponse'
  return getFromGraphQL(getTreatmentsByExperimentIdQuery, filename, experiment, env, experimentsToken, store)['getTreatmentsByExperimentId']

def getFromGraphQL(query, filename, experiment, env, token, store=False):
  url = "https://api01{suffix}.agro.services/experiments-api-graphql/v1/graphql".format(suffix=getSuffix(env))
  headers = getHeaders(token)
  endpoint = HTTPEndpoint(url, headers)
  variables = {"experimentId": experiment}
  data = endpoint(query, variables)
  if "errors" in data.keys() and len(data["errors"]) > 0:
    raise RuntimeError(data["errors"])
  if store and filename != '':
    with open('{0}/{1}.json'.format(getRegressionDataPath(), filename), 'w') as fid:
      json.dump(data, fid, indent=2)
  return data['data']

def getUnitsToTreatments(experiment, env, experimentsToken, store=False, **kwargs):
  units = getUnitsByExperimentId(experiment, env, experimentsToken, store)
  unitsFrame = pd.DataFrame(units)
  for column in ['blockId', 'treatmentId', 'setEntryId', "id"]:
    unitsFrame[column] = unitsFrame[column].astype('int64')
  unitsFrame = unitsFrame.rename(columns={"setEntryId": "entryId", "id": "experimentalUnitId"})
  treatments = getTreatmentsByExperimentId(experiment, env, experimentsToken, store)
  parsedTreatments = []
  for treatment in treatments:
    for element in treatment["combinationElements"]:
      for item in element["treatmentVariableLevel"]['valueJSON']['items']:
        if item['catalogType'] == "INTERNAL_SEED":
          if 'value' not in item:
            catalogId = -1
          else:
            catalogId = item['value']
          parsedTreatments.append({
            "catalogId": catalogId,
            "variableLabel": item["label"],
            "treatmentId": treatment["id"],
            "combinationId": element["id"],
            "treatmentVariableLevelId": element["treatmentVariableLevelId"]
          })
  txFrame = pd.DataFrame(parsedTreatments)
  txToUnits = txFrame.merge(unitsFrame, on=["treatmentId"], how="inner", copy=True, validate="one_to_many")
  txToUnits["catalogId"] = txToUnits["catalogId"].astype('int64')
  return txToUnits

# ## The home stretch
# 
# Now we have two competing DataFrames: `entriesToCatalog` and `txToUnits` which represent the state of the Sets app and the Experiments app, respectively.  To identify the changes to be made we need to merge these together, but be careful!  We know that the mapping between `experimentalUnitId` and `entryId` is wrong in some places, so we must remember to find where the `catalogId` fields are mismatched.

def switchRows(df, i1, i2, verbose):
  r1 = df.iloc[i1, -9:]
  r2 = df.iloc[i2, -9:]
  df.iloc[i1, -9:] = r2
  df.iloc[i2, -9:] = r1
  return df

def correctUnitEntryAssociations(df, verbose):
  df = df.copy()
  duplicateCatalogIds, expIndices, setIndices = np.intersect1d(df.catalogId_e.values, df.catalogId_s.values, return_indices=True)
  if verbose:
    print(expIndices)
    print(setIndices)
  return algorithm(df, expIndices, setIndices, verbose)
  
def algorithm(df, expIndices, setIndices, verbose):
  old = df.copy()
  i = -1
  if len(expIndices) == df.shape[0]:
    # No fixes needed
    return None
  for e in expIndices:
    i += 1
    s = setIndices[i]
    if verbose: 
      print('-'*10, '\n', e, s, ':\n')
    if e != s:
      if verbose:
        if e not in setIndices:
          print('Single swap: ', end="\n")
        else:
          print('Chain swap: ', end="\n")
        print(e, '<-->', s, end="\n")
        print('Exp:', expIndices, '\nSet:', setIndices, '\n^^^^^^OLD VS NEWvvvvvvv')
      df = switchRows(df, e, s, verbose)
      if verbose: 
        print(e, '<-->', s, end="\n")
      if e in setIndices:  # part of a chain
        setIndices[np.where(setIndices == e)] = s
      setIndices[i] = e
      if verbose:
        print('Exp:', expIndices, '\nSet:', setIndices)
    else:
      if verbose:
        print("Do nothing!")
        _, __, currentIndices = np.intersect1d(df.catalogId_e.values, df.catalogId_s.values, return_indices=True)
        print('Exp:', expIndices, '\nCur:', currentIndices)
      continue
  return df.loc[df.catalogId_s != old.catalogId_s].copy()

def patchExperimentalUnits(*args, id=None, env=None, experimentsToken='', testing=False, **kwargs):
  """
    args = (eunit_1, entryId_1), (eunit_2, entryId_2)
  """
  headers = getHeaders(experimentsToken)
  body = sorted([{"id":eunit, "setEntryId":entry} for eunit, entry in args], key=lambda d: d["setEntryId"])
  if testing:
    for pair in body:
      print(pair)
    # print(json.dumps(body))
    print("Found {0} experimental units to fix...".format(len(args)))
    request = requests.Request("PATCH", getExperimentURL(env) + experimentalUnitsEndpoint.format(id=id), headers=headers, data=json.dumps(body))
    return request.prepare()
  else:
    print("Fixing {0} experimental units...".format(len(args)))
    response = requests.patch(getExperimentURL(env) + experimentalUnitsEndpoint.format(id=id), headers=headers, data=json.dumps(body))
    response.raise_for_status()
    print("Patch response: {0}".format(response.status_code))
  return response

def cleanKey(key):
  return key.strip('-').lower()

def renameTokens(arguments):
  arguments["experimentsToken"] = arguments.pop("e")
  arguments["setsToken"] = arguments.pop("s")
  arguments["velmatToken"] = arguments.pop("v")
  arguments["store"] = arguments.pop("update")
  return arguments

if __name__ == "__main__":
  arguments = {cleanKey(x): y for x, y in docopt(__doc__, version="0.1").items()}
  arguments.pop('help')
  arguments.pop('version')
  arguments = renameTokens(arguments)
  setResponse = getSetsByExperiment(**arguments)
  setSeeds = getSeedsOnly(setResponse)
  setMaterials = getMaterialsFromSet(setSeeds)
  mappedMaterials = getSetMaterialData(setMaterials, **arguments)
  entriesToCatalog = setSeeds.merge(mappedMaterials, on=["materialId"], how="inner", copy=True)
  txToUnits = getUnitsToTreatments(**arguments)
  final = txToUnits.merge(entriesToCatalog, on='entryId', how="inner", suffixes=('_e', '_s'), copy=True)
  correct = correctUnitEntryAssociations(final, False)
  if correct is None:
    args = correct[["experimentalUnitId", "entryId"]].T.apply(lambda x: tuple(x)).values
    prep = patchExperimentalUnits(*args, **arguments, testing=True)
  else:
    print("No corrections needed")
  exit()