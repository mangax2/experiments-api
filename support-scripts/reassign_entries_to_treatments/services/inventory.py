import json
import os
import pandas as pd
import requests

from . import utils


def getInventoryURL(env):
    return "https://inventory-api.velocity{suffix}.ag".format(suffix=utils.getSuffix(env))


def filterInventories(materials):
    """
    Return rows that have an inventory value but NOT a catalog Id
    """
    return materials[(materials["index"] == "inventory") & (materials.isna()["catalog"])]


def getArchivedInventoriesByLots(materialsDf, env='nonprod', inventoryToken='', store=False, **kwargs):
    url = '{0}/v2/inventories/barcodes'.format(getInventoryURL(env))
    params = dict(includeArchived=True)
    headers = utils.getHeaders(inventoryToken)
    inventories = filterInventories(materialsDf)
    body = inventories['inventory'].values.astype('int64').tolist()
    response = requests.post(url, headers=headers, params=params, json=body)
    response.raise_for_status()
    if store:
        with open(os.path.join(utils.getRegressionDataPath(), 'archivedMaterialDataResponse.json'), 'w') as fid:
            fid.write(json.dumps(response.json(), sort_keys=True, indent=2))
    return response.json()


def responseShim(data):
    """ Format response for usage """
    retval = pd.io.json.json_normalize(data,
                                       None,
                                       [
                                           ["materialId"],
                                           ["lot", "id"],
                                           ["_source", "catalog", "id"],
                                           ["_source", "type"]
                                       ],
                                       max_level=2)
    column_mapping = {
      "lot.id": "lot",
      "materialId": "catalog",
      "type": "type",
      "barcode": "inventory"
    }
    retval = retval.rename(columns=column_mapping)
    retval = retval[["inventory", "lot", "catalog", "type"]]
    retval.inventory = retval.inventory.astype('int64')
    retval.lot = retval.lot.astype('int64')
    retval.catalog = retval.catalog.astype('int64')
    return retval

    
def parseInventoryResponse(materialsDf, data):
    dataDf = responseShim(data)
    merged = materialsDf.join(
          dataDf.set_index(["type", "inventory"]),
          on=["type", "inventory"],
          lsuffix='_deleteme',
          rsuffix='',
          how="inner"
        )
    merged = merged.drop(columns=[c for c in merged.keys() if c.endswith('_deleteme')])
    return merged
