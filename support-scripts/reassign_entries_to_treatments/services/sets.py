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
  return getMaterialsFromSet(setSeeds), setSeeds

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

def getSeedsOnly(df):
  return df[df.materialType == 'internal_seed']

def getSetsDataFrame(output):
  retval = pd.io.json.json_normalize(output, 
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
