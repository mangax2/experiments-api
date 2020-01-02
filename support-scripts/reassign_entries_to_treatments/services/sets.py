from getpass import getuser
from itertools import accumulate
import json
import os
import pandas as pd
import requests

from . import utils


def getSetURL(env):
  return "{url}/sets-api/v2".format(url=utils.getBaseURL(env))


def getSetsByExperiment(experiment=None, env='np', setsToken='', store=False, *args, **kwargs):
  """
  Get the materials assigned to each set entry

  Note: assumes number of sets is less than 500...
  """
  params = {'sourceId': experiment, "entries": "true", "limit": 500}
  headers = utils.getHeaders(setsToken)
  response = requests.get(getSetURL(env) + "/sets", params=params, headers=headers)
  response.raise_for_status()
  if store:
    with open(os.path.join(utils.getRegressionDataPath(), 'setsByExperimentResponse.json'), 'w') as fid:
      fid.write(json.dumps(response.json(), sort_keys=True, indent=2))
  return response.json()

def formatSetsResponse(jsonInput):
  setsDF = getSetsDataFrame(jsonInput)
  setSeeds = getSeedsOnly(setsDF)
  return setsDF, setSeeds

def parseMaterialRow(material):
  material[material["index"]] = int(material["materialId"])  # set catalog, lot, or inventory ID
  material["type"] = material["type"].upper()
  return material

def getSeedsOnly(df):
  return df[df["type"] == 'INTERNAL_SEED']

def getSetsDataFrame(output):
  retval = pd.io.json.json_normalize(
    output, 
    ["entries", "materials"],
    [
      ["entries", "setId"],
      ["entries", "entryId"],
      "name",
    ],
    errors='ignore', max_level=10)
  retval = retval[['materialId', 'materialType', 'productType', 'materialName', 'entries.setId', 'entries.entryId', 'name']]
  column_mapping = {
    "entries.setId":   "setId",
    "entries.entryId": "entryId",
    "name":            "setName",
    "materialType":    "type",
    "productType":     "index"
  }
  retval = retval.rename(columns=column_mapping)
  retval.insert(3, 'catalog', None)
  retval.insert(3, 'lot', None)
  retval.insert(3, 'inventory', None)
  retval = retval.apply(parseMaterialRow, axis=1)
  retval = retval.drop(columns=["materialId"])
  retval = retval.fillna(-1)
  for column in ['setId', 'entryId', "inventory", "lot", "catalog"]:
    retval[column] = retval[column].astype('int64')
  return retval
