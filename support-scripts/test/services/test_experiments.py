import json
import numpy as np
import os.path as op
import pandas as pd
import pytest
from unittest.mock import Mock, MagicMock, patch, create_autospec
from sgqlc.endpoint.http import HTTPEndpoint


from reassign_entries_to_treatments.services.experiments import *
from reassign_entries_to_treatments.services.utils import *
from reassign_entries_to_treatments.reassign_entries_to_treatments import *


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
    assert sorted(list(actual.columns)) == sorted(["block", "blockId", "catalog", "treatmentId", "entryId", "variableLabel", "combinationId", "treatmentVariableLevelId", "experimentalUnitId"])
    assert actual.catalog.dtype == np.int64
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
