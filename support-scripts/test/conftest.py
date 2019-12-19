import json
import os.path as op
import pandas as pd
import pytest

from reassign_entries_to_treatments.reassign_entries_to_treatments import correctUnitEntryAssociations, mapMaterialsToEntries
from reassign_entries_to_treatments.services.experiments import parseExperimentResponses, patchExperimentalUnits
from reassign_entries_to_treatments.services.sets import formatSetsResponse
from reassign_entries_to_treatments.services.velmat import parseVelmatResponse
from reassign_entries_to_treatments.services.inventory import parseInventoryResponse


@pytest.fixture(scope="module")
def setup_data():
    with open(op.abspath('test/data/setsByExperimentResponse.json'), 'r') as fid:
      setResponseJSON = json.load(fid)
    setMaterials, setSeeds = formatSetsResponse(setResponseJSON)
    assert setSeeds.shape[0] == 52 * 7
    assert setMaterials.shape[0] >= 52 * 7
    with open(op.abspath('test/data/velmatSearchResponse.json'), 'r') as fid:
      velmatResponseJSON = json.load(fid)
    activeDf = parseVelmatResponse(setMaterials, velmatResponseJSON)
    assert activeDf.shape[0] == 52 * 7 - 1, "Error creating materials"

    with open(op.abspath('test/data/archivedMaterialDataResponse.json'), 'r') as fid:
        archive = json.load(fid)
    archiveDf = parseInventoryResponse(setMaterials, archive)
    assert archiveDf.shape[0] == 1
    columns = ["type", "index", "inventory", "lot", "catalog", "setId", "entryId", "setName"]
    materialsDf = pd.concat([archiveDf[columns], activeDf[columns]])
    materialsDf = materialsDf.drop_duplicates().infer_objects()

    entriesToCatalog = mapMaterialsToEntries(materialsDf, setSeeds)
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
