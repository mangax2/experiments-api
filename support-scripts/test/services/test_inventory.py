import json
import numpy as np
import os.path as op
import pandas as pd
import pytest
from unittest.mock import patch, ANY
import requests
from requests import Response


from reassign_entries_to_treatments.services.inventory import *
from reassign_entries_to_treatments.services.sets import formatSetsResponse
from reassign_entries_to_treatments.services.utils import *


materials = pd.DataFrame([
    {"index": "inventory", "type": "INTERNAL_SEED", "catalog": None, "lot": None, "inventory": 2323699, "entryId": 11, "setId": 2},
    {"index": "lot",       "type": "INTERNAL_REED", "catalog": None, "lot": 3456, "inventory": None, "entryId": 22, "setId": 3},
    {"index": "catalog",   "type": "INTERNAL_FEED", "catalog": 6789, "lot": None, "inventory": None, "entryId": 33, "setId": 1},
    {"index": "inventory", "type": "INTERNAL_SEED", "catalog": 1111, "lot": 2222, "inventory": 5432, "entryId": 12, "setId": 4}
], dtype='int64')


with open(op.abspath('./test/data/archivedMaterialDataResponse.json'), 'r') as fid:
    data = json.load(fid)


def test_getInventoryURL():
    actual = getInventoryURL("np")
    assert actual.count("inventory-api.velocity-np.") == 1, actual
    actual = getInventoryURL("prod")
    assert actual.count("inventory-api.velocity.") == 1, actual


def test_filterInventories():
    actual = filterInventories(materials)
    expected = pd.DataFrame([ materials.iloc[0,:] ])
    pd.testing.assert_frame_equal(actual, expected)


@patch("requests.post", autospec=True)
@patch("requests.Response", autospec=True )
def test_getArchivedInventoriesByLots(res, req):
    archivedIds = [ int(materials["inventory"][0]) ]
    assert archivedIds == [ 2323699 ], "Test setup failed: {0}".format(archivedIds)
    archived = data[0]
    expected = [ archived ]
    res.json.return_value = expected
    res.raise_for_status.return_value = None
    req.return_value = res
    response = getArchivedInventoriesByLots(pd.DataFrame(materials), env='np', inventoryToken="my_token")
    req.assert_called_once_with("https://inventory-api.velocity-np.ag/v2/inventories/barcodes",
                                headers=getHeaders("my_token"),
                                params=dict(includeArchived=True),
                                json=archivedIds)
    assert response == expected
