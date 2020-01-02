import importlib
import json
import numpy as np
import os.path as op
import pandas as pd
import pytest
import sys
from unittest.mock import create_autospec, patch
import requests
from requests import Response

from reassign_entries_to_treatments.services import velmat
from reassign_entries_to_treatments.services import sets
from reassign_entries_to_treatments.services.utils import *


materials = pd.DataFrame([
    {"index": "inventory", "type": "INTERNAL_SEED", "catalog": None, "lot": None, "inventory": 1234, "entryId": 11, "setId": 2},
    {"index": "lot",       "type": "INTERNAL_REED", "catalog": None, "lot": 3456, "inventory": None, "entryId": 22, "setId": 3},
    {"index": "catalog",   "type": "INTERNAL_FEED", "catalog": 6789, "lot": None, "inventory": None, "entryId": 33, "setId": 1},
    {"index": "inventory", "type": "INTERNAL_SEED", "catalog": None, "lot": None, "inventory": 5432, "entryId": 12, "setId": 4}
])


def test_generateListQuery():
    actual = velmat.generateListQuery(materials)
    assert json.loads(actual) == [
        dict(_index="inventory", _type="INTERNAL_SEED", _id=1234),
        dict(_index="lot",       _type="INTERNAL_REED", _id=3456),
        dict(_index="catalog",   _type="INTERNAL_FEED", _id=6789),
        dict(_index="inventory", _type="INTERNAL_SEED", _id=5432)
    ]


@patch('requests.post', autospec=True)
@patch('requests.Response', autospec=True )
def test_getSetMaterialData(res, req):
    with open(op.abspath('./test/data/velmatSearchResponse.json'), 'r') as fid:
        data = json.load(fid)
    retval = data[0]
    retval["_id"] = 3456
    retval["_source"]["barcode"] = 3456
    retval["_source"]["barcodeStr"] = "3456"
    retval["_source"]["lot"]["id"] = 3456
    res.json.return_value = [ retval ]
    res.raise_for_status.return_value = None
    req.return_value = res
    actual = velmat.getSetMaterialData(materials, env='np', velmatToken="yyyy")
    assert actual == res.json.return_value
    expected_headers = getHeaders("yyyy")
    expected_headers.pop('oauth_resourceownerinfo')
    req.assert_called_once_with("https://velmat-search-api.velocity-np.ag/v2/load",
                                headers=expected_headers,
                                data=velmat.generateListQuery(materials))


def test_parseVelmatResponse():
    with open(op.abspath('test/data/setsByExperimentResponse.json'), 'r') as fid:
        setResponseJSON = json.load(fid)
    setMaterials, setSeeds = sets.formatSetsResponse(setResponseJSON)
    with open(op.abspath('./test/data/velmatSearchResponse.json'), 'r') as fid:
        data = json.load(fid)
    actual = velmat.parseVelmatResponse(setMaterials, data)
    assert actual.shape[0] == setMaterials.shape[0] - 1
