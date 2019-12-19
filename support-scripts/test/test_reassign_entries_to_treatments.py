import json
import numpy as np
import os.path as op
import pandas as pd
import pytest
from unittest.mock import Mock, MagicMock, patch, create_autospec
from sgqlc.endpoint.http import HTTPEndpoint


from reassign_entries_to_treatments.services.utils import *
from reassign_entries_to_treatments.reassign_entries_to_treatments import *


@patch('requests.post', autospec=True)
@patch('requests.Response', autospec=True )
def test_combineActiveAndArchivedMaterials(res, req, setup_data):
    with open(op.abspath('test/data/setsByExperimentResponse.json'), 'r') as fid:
        setResponseJSON = json.load(fid)
    setMaterials, setSeeds = formatSetsResponse(setResponseJSON)
    with open(op.abspath('./test/data/velmatSearchResponse.json'), 'r') as fid:
        active = json.load(fid)[0]
        activeId = int(active["_id"])
        active["_source"]["barcode"] = 3456
        active["_source"]["barcodeStr"] = "3456"
        active["_source"]["lot"]["id"] = 3456

    with open(op.abspath('./test/data/archivedMaterialDataResponse.json'), 'r') as fid:
        archived = json.load(fid)[0]
        archiveId = archived["barcode"]

    res.json.side_effect = ([active], [archived])
    res.raise_for_status.return_value = None
    req.return_value = res
    setMaterials.loc[setMaterials.shape[0] - 1, "inventory"] = archiveId

    actual = combineActiveAndArchivedMaterials(setMaterials, 'np', 'xxxx')
    assert isinstance(actual, pd.DataFrame)
    assert actual.inventory.dtype == np.int64
    assert actual.shape[0] == 2, actual
    assert sorted(['catalog', 'entryId', 'index', 'inventory', 'lot', 'setId', 'setName', 'type']
) == sorted(actual.columns)
    assert np.all(actual.inventory.values == [archiveId, activeId])
