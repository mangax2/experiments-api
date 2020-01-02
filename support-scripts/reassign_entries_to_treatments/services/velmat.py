from itertools import filterfalse
import json
import os
import pandas as pd
import requests

from . import utils
from . import inventory


def getVelmatURL(env):
    return "https://velmat-search-api.velocity{suffix}.ag".format(suffix=utils.getSuffix(env))

  
def generateListQuery(materialsDf):
    output = []
    for i, material in materialsDf.iterrows():
        materialIndex = material["index"]
        entry = dict(
          _index=materialIndex,
          _type=material["type"],
          _id=material[materialIndex],
        )
        output.append(entry)
    return json.dumps(output, sort_keys=True, indent=2)


def responseShim(data):
    """ Format response for usage """
    output = pd.io.json.json_normalize(data,
                                       None,
                                       ["_id",
                                        ["_source", "lot", "id"],
                                        ["_source", "catalog", "id"],
                                        ["_source", "type"]
                                       ],
                                       max_level=2)
    column_mapping = {"_source.lot.id": "lot", "_source.catalog.id": "catalog", "_source.type": "type", "_id": "inventory"}
    output = output.rename(columns=column_mapping)
    output = output[["inventory", "lot", "catalog", "type"]]
    output.inventory = output.inventory.astype('int64')
    output.loc[(output.inventory == output.catalog), "lot"] = -1
    output.loc[(output.inventory == output.catalog), "inventory"] = -1
    output.loc[(output.inventory == output.lot), "inventory"] = -1
    return output

  
def splitMaterials(materialsDf, index, dataDf):
    indexed = materialsDf[materialsDf["index"] == index]
    indexData = dataDf.copy()
    if indexed.shape[0] > 0:
        merged = indexed.join(
          indexData.set_index(["type", index]),
          on=["type", index],
          lsuffix='_deleteme',
          rsuffix='',
          how="inner"
        )
        merged = merged.drop(columns=[c for c in merged.keys() if c.endswith('_deleteme')])
        return merged
    else:
        return pd.DataFrame(columns=["type", "index", "inventory", "materialName", "setId", "entryId", "setName", "lot", "catalog"])


def parseVelmatResponse(materialsDf, data):
    dataDf = responseShim(data)
    mergedInventories = splitMaterials(materialsDf, "inventory", dataDf)
    mergedLots = splitMaterials(materialsDf, "lot", dataDf)
    mergedLots = mergedLots[mergedLots.inventory < 0]
    mergedCatalogs = splitMaterials(materialsDf, "catalog", dataDf)
    mergedCatalogs = mergedCatalogs[mergedCatalogs.lot < 0]
    output = pd.concat([mergedInventories, mergedLots, mergedCatalogs], sort=False)
    return output

  
def getSetMaterialData(materialsDf, env='', velmatToken='', store=False, **kwargs):
    """ 
    Return a list of dictionaries with keys 'catalogId', 'lotId', and 'inventoryId'.
    The lot OR the inventory key can == None.
    """
    url = "{0}/v2/load".format(getVelmatURL(env))
    headers = {'Authorization': "Bearer {0}".format(velmatToken),
               'Content-Type': 'application/json'}
    query = generateListQuery(materialsDf)
    response = requests.post(url, data=query, headers=headers)
    response.raise_for_status()
    if store:
        with open(os.path.join(utils.getRegressionDataPath(), 'velmatSearchResponse.json'), 'w') as fid:
            fid.write(json.dumps(response.json(), sort_keys=True, indent=2))
    return response.json()
