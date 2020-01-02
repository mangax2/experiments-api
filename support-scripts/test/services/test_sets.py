import json
import numpy as np
import os.path as op
import pandas as pd
import pytest
from unittest.mock import Mock, MagicMock, patch
import requests
from requests import Response

from reassign_entries_to_treatments.reassign_entries_to_treatments import *
from reassign_entries_to_treatments.services.sets import *
from reassign_entries_to_treatments.services.utils import *


@patch('requests.get', autospec=True)
@patch('requests.Response', autospec=True )
def test_getSetsByExperiment(res, req):
  with open(op.abspath('./test/data/setsByExperimentResponse.json'), 'r') as fid:
    data = json.load(fid)
  res.json.return_value = data
  res.raise_for_status.return_value = None
  req.return_value = res
  kwargs = {"experiment": 1, "env": 'nonprod'}
  response = getSetsByExperiment(setsToken='xxxx', **kwargs)
  req.assert_called_once_with('https://api01-np.agro.services/sets-api/v2/sets', headers=getHeaders("xxxx"), params={"sourceId": 1, "entries": "true", "limit": 500} )


def test_getSetsDataFrame():
    with open(op.abspath('./test/data/setsByExperimentResponse.json'), 'r') as fid:
        data = json.load(fid)
    actual = getSetsDataFrame(data)
    assert isinstance(actual, pd.DataFrame)
    withoutNaN = actual.fillna(-1)
    for column in ["inventory", "lot", "catalog"]:
        assert withoutNaN[column].dtype == np.int64
    assert actual.shape[0] == 364  # NOT len(data) b/c materials is nested inside the sets
    assert sorted(list(actual.columns)) == ['catalog', 'entryId', 'index', 'inventory', 'lot', 'materialName', 'setId', 'setName', 'type']


def test_getSeedsOnly():
    df = pd.DataFrame({
        "setId": [1, 2],
        "type": ["INTERNAL_SEED", "other"], 
        "entryId": [1, 2],
    })
    actual = getSeedsOnly(df)
    assert isinstance(actual, pd.DataFrame)
    assert np.all(actual.eq(df.loc[0])), "{0}\n{1}".format(actual, df[0])
  

def test_parseMaterialRow():
    df = pd.DataFrame(
        {
            "setName":     ["a", "b", "c"],
            "materialId":  [1, 5, 2],
            "entryId":     [2, 1, 3],
            "setId":       [3, 4, 4],
            "index":       ["inventory", "lot", "catalog"],
            "type":        ["internal_seed", "internal_seed", "chemical"],
        },
        dtype="int64"
    )
    actual = df.apply(parseMaterialRow, axis=1)
    expected = pd.DataFrame(
        {
            "catalog":    [None, None, 2],
            "entryId":    [2, 1, 3],
            "index":      ["inventory", "lot", "catalog"],
            "inventory":  [1, None, None],
            "lot":        [None, 5, None],
            "materialId": [1, 5, 2],
            "setId":      [3, 4, 4],
            "setName":    ["a", "b", "c"],
            "type":       ["INTERNAL_SEED", "INTERNAL_SEED", "CHEMICAL"],
        },
        dtype="int64"
    )
    pd.testing.assert_frame_equal(actual, expected, check_dtype=False)
