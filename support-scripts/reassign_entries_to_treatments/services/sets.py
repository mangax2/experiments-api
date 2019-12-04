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
