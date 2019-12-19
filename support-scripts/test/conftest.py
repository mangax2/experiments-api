import json
import os.path as op
import pytest

from reassign_entries_to_treatments.reassign_entries_to_treatments import correctUnitEntryAssociations, mapMaterialsToEntries
from reassign_entries_to_treatments.services.experiments import parseExperimentResponses, patchExperimentalUnits
from reassign_entries_to_treatments.services.sets import formatSetsResponse
from reassign_entries_to_treatments.services.velmat import parseVelmatResponse, responseShim, splitMaterials  # TODO: remove


@pytest.fixture(scope="module")
def setup_data():
    with open(op.abspath('test/data/setsByExperimentResponse.json'), 'r') as fid:
      setResponseJSON = json.load(fid)
    setMaterials, setSeeds = formatSetsResponse(setResponseJSON)
    assert setSeeds.shape[0] == 52 * 7
    assert setMaterials.shape[0] >= 52 * 7
    with open(op.abspath('test/data/velmatSearchResponse.json'), 'r') as fid:
      velmatResponseJSON = json.load(fid)
    mappedMaterials = parseVelmatResponse(setMaterials, velmatResponseJSON)
    assert mappedMaterials.shape[0] == 52 * 7, "Error creating materials"
    entriesToCatalog = mapMaterialsToEntries(mappedMaterials, setSeeds)
    assert entriesToCatalog.shape[0] > 52, "Error mapping entries to material catalog"

    with open(op.abspath('test/data/getUnitsByExperimentResponse.json'), 'r') as fid:
      units = json.load(fid)['data']['getUnitsByExperimentId']
    with open(op.abspath('test/data/getTreatmentsByExperimentResponse.json'), 'r') as fid:
      treatments = json.load(fid)['data']['getTreatmentsByExperimentId']
    txToUnits = parseExperimentResponses(units, treatments)
    assert txToUnits.shape[0] > 0, "Error creating treatments and units"

    mergeData = txToUnits.merge(entriesToCatalog, on='entryId', how="inner", suffixes=('_e', '_s'), copy=True)
    corrected = correctUnitEntryAssociations(mergeData)
    assert corrected.shape[0] > 0, "Error creating corrected data"
    return mergeData, corrected
