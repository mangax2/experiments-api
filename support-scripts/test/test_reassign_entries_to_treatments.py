import json
import numpy as np
import os.path as op
import pandas as pd
import pytest
from unittest.mock import Mock, MagicMock, patch
import requests
from requests import Response
import sgqlc
from sgqlc.endpoint.http import HTTPEndpoint

from reassign_entries_to_treatments.reassign_entries_to_treatments import *
from reassign_entries_to_treatments.services.experiments import *
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
  actual = getSetsDataFrame(response)
  assert isinstance(actual, pd.DataFrame)
  assert actual.materialId.dtype == np.int64
  assert actual.shape[0] == 364  # NOT len(data) b/c materials is nested inside the sets
  assert sorted(["entryId", "materialId", "materialType", "productType", "setId", "materialName", "setName"]) == sorted(list(actual.columns))
  
def test_getSeedsOnly():
  df = pd.DataFrame({
    "setId": [1, 2],
    "sourceId": [1, 1],
    "materialType": ["internal_seed", "other"], 
    "entry_id": [1, 2],
    })
  actual = getSeedsOnly(df)
  assert isinstance(actual, pd.DataFrame)
  assert np.all(actual.eq(df.loc[0])), "{0}\n{1}".format(actual, df[0])
  
def test_getMaterialsFromSet():
  df = pd.DataFrame({
    "materialId":  [1, 5],
    "entryId":     [2, 1],
    "setId":       [3, 3],
    "productType": ["inventory", "lot"]
  })
  actual = getMaterialsFromSet(df)
  assert actual == [
    ("inventory", "INTERNAL_SEED", 1, 2, 3),
    ("lot", "INTERNAL_SEED", 5, 1, 3)
  ]

@patch('requests.post', autospec=True)
@patch('requests.Response', autospec=True )
def test_getSetMaterialData(res, req):
  with open(op.abspath('./test/data/velmatSearchResponse.json'), 'r') as fid:
    data = json.load(fid)
  res.json.return_value = data
  res.raise_for_status.return_value = None
  req.return_value = res
  materials = [
    ("inventory", "INTERNAL_SEED", 1, 2, 3),
    ("lot", "INTERNAL_SEED", 5, 1, 3)
  ]
  actual = getSetMaterialData(materials, env='np', velmatToken="yyyy")
  assert isinstance(actual, pd.DataFrame)
  assert actual.materialId.dtype == np.int64
  assert actual.shape[0] == len(data)
  assert sorted(["lotId", "materialId", "catalogId"]) == sorted(actual.columns)

@patch.object(HTTPEndpoint, '__call__', autospec=True)
def test_getUnitsToTreatments(endpoint):
  with open(op.abspath('test/data/getUnitsByExperimentResponse.json'), 'r') as fid:
    units_data = json.load(fid)
  with open(op.abspath('test/data/getTreatmentsByExperimentResponse.json'), 'r') as fid:
    treatments_data = json.load(fid)
  endpoint.side_effect = [units_data, treatments_data]
  getUnitsToTreatments(experiment=1, env="np", experimentsToken="zzzz")
  mock_calls = endpoint.mock_calls
  assert mock_calls[0][1][1:] == (getUnitsByExperimentIdQuery, dict(experimentId=1))
  assert mock_calls[1][1][1:] == (getTreatmentsByExperimentIdQuery, dict(experimentId=1))

def test_parseExperimentResponse():
  with open(op.abspath('test/data/getUnitsByExperimentResponse.json'), 'r') as fid:
    units_data = json.load(fid)["data"]['getUnitsByExperimentId']
  with open(op.abspath('test/data/getTreatmentsByExperimentResponse.json'), 'r') as fid:
    treatments_data = json.load(fid)["data"]['getTreatmentsByExperimentId']
  actual = parseExperimentResponses(units_data, treatments_data)
  assert isinstance(actual, pd.DataFrame)
  assert sorted(list(actual.columns)) == sorted(["block", "blockId", "catalogId", "treatmentId", "entryId", "variableLabel", "combinationId", "treatmentVariableLevelId", "experimentalUnitId"])
  assert actual.catalogId.dtype == np.int64
  assert actual.shape[0] == len(units_data)

def test_patchExperimentalUnits(setup_data):
  mergeData, corrected = setup_data
  arguments = dict(id=0, env='np', experimentsToken='xxxx')
  args = corrected[["experimentalUnitId", "entryId"]].T.apply(lambda x: tuple(x)).values
  prep = patchExperimentalUnits(*args, **arguments, testing=True)
  assert prep.headers["oauth_resourceownerinfo"].startswith("user_id"), prep.headers
  bodyToSend = eval(prep.body)
  expectedLength = 52 * 7  # number of testing sets = 7 (6 scenarios plus a 'repeated' scenario)
  assert len(bodyToSend) == expectedLength, "Body length incorrect: expected {0}, actual {1}".format(expectedLength, len(bodyToSend))
  assert sum([x.keys() == set(["id", "setEntryId"]) for x in bodyToSend]), "At least one input is missing a key"
  assert len(set([x["id"] for x in bodyToSend])) == expectedLength, "Not sending one entry per experimental unit"
  assert len(set([x["setEntryId"] for x in bodyToSend])) == expectedLength, "Not sending one experimental unit per entry "
  assert prep.url.startswith('https://api01'), "Actual: {0}".format(prep.url)
  assert prep.url.endswith('experiments/{id}/experimental-units'.format(**arguments)), "Actual: {0}".format(prep.url)
