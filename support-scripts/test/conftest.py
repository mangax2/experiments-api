import json
import os.path as op
import pytest

from reassign_entries_to_treatments.reassign_entries_to_treatments import getSeedsOnly, getMaterialsFromSet, correctUnitEntryAssociations
from reassign_entries_to_treatments.services.experiments import parseExperimentResponses, patchExperimentalUnits
from reassign_entries_to_treatments.services.sets import getSetsByExperiment, getSetsDataFrame
from reassign_entries_to_treatments.services.velmat import parseVelmatResponse


@pytest.fixture(scope="module")
def setup_data():
    with open(op.abspath('test/data/setsByExperimentResponse.json'), 'r') as fid:
      setResponseJSON = json.load(fid)
    with open(op.abspath('test/data/velmatSearchResponse.json'), 'r') as fid:
      velmatResponseJSON = json.load(fid)
    with open(op.abspath('test/data/getUnitsByExperimentResponse.json'), 'r') as fid:
      units = json.load(fid)['data']['getUnitsByExperimentId']
    with open(op.abspath('test/data/getTreatmentsByExperimentResponse.json'), 'r') as fid:
      treatments = json.load(fid)['data']['getTreatmentsByExperimentId']
    setsDF = getSetsDataFrame(setResponseJSON)
    setSeeds = getSeedsOnly(setsDF)
    setMaterials = getMaterialsFromSet(setSeeds)
    mappedMaterials = parseVelmatResponse(velmatResponseJSON)
    entriesToCatalog = setSeeds.merge(mappedMaterials, on=["materialId"], how="inner", copy=True)
    txToUnits = parseExperimentResponses(units, treatments)
    mergeData = txToUnits.merge(entriesToCatalog, on='entryId', how="inner", suffixes=('_e', '_s'), copy=True)
    corrected = correctUnitEntryAssociations(mergeData, False)
    return mergeData, corrected
