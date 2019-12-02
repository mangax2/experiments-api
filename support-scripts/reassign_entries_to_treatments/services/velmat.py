import json
import os
import pandas as pd
import requests

from . import utils


def getVelmatURL(env):
  return "https://velmat-search-api.velocity{suffix}.ag/search".format(suffix=utils.getSuffix(env))

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

def parseVelmatResponse(responseJSON):
  retval = []
  for catalog in responseJSON:
    item = {
      "catalogId": int(catalog["_source"]["catalog"]["id"]),
      "lotId": catalog["_source"].get("lot", {}).get("id", None),
      "materialId": int(catalog["_id"])
      }
    retval.append(item)
  retval = pd.DataFrame(retval)
  for column in ['materialId']:
    retval[column] = retval[column].astype('int64')
  return retval

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
    with open(os.path.join(utils.getRegressionDataPath(), 'velmatSearchResponse.json'), 'w') as fid:
      fid.write(json.dumps(response.json(), sort_keys=True, indent=2))
  return parseVelmatResponse(response.json())
      


