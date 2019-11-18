import numpy as np
import os.path as op
import pandas as pd
import pytest
from pytest_cases import pytest_fixture_plus, fixture_union, cases_data
from unittest.mock import Mock, MagicMock, patch
import json
import requests
from requests import Response
import sgqlc  # from sgqlc.endpoint.http import HTTPEndpoint

from reassign_entries_to_treatments.reassign_entries_to_treatments import *

@patch('requests.get', autospec=True)
@patch('requests.Response', autospec=True )
def test_getSetsByExperiment(res, req):
  with open(op.abspath('./test/data/setsByExperimentResponse.json'), 'r') as fid:
    data = json.load(fid)
  res.json.return_value = data
  res.raise_for_status.return_value = None
  req.return_value = res
  kwargs = {"experiment": 1, "env": 'nonprod'}
  actual = getSetsByExperiment(setsToken='xxxx', **kwargs)
  req.assert_called_once_with('https://api01-np.agro.services/sets-api/v2/sets', headers=getHeaders("xxxx"), params={"sourceId": 1, "entries": "true", "limit": 500} )
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

@patch('sgqlc.endpoint.http.HTTPEndpoint', autospec=True)
def test_getUnitsToTreatments(req):
  with open(op.abspath('./test/data/getUnitsByExperimentResponse.json'), 'r') as fid:
    units_data = json.load(fid)
  with open(op.abspath('./test/data/getTreatmentsByExperimentResponse.json'), 'r') as fid:
    treatments_data = json.load(fid)
  print(req)
  req.side_effect = [units_data, treatments_data]
  
  actual = getUnitsToTreatments(experimentId=1, **{"env": "np", "experimentsToken": "zzzz"})
  req.assert_called_once_with(getUnitsByExperimentIdQuery, {"experimentId": 1})
  req.assert_called_once_with(getTreatmentsByExperimentIdQuery, {"experimentId": 1})
  assert isinstance(actual, pd.DataFrame)
  assert sorted(list(actual.columns)) == sorted(["catalogId", "treatmentId", "setEntryId", "variableLabel", "combinationId", "treatmentVariableLevelId", "experimentalUnitId"])
  assert actual.catalogId.dtype == np.int64
  assert actual.shape[0] == len(units_data)
"""
# ---------------------------------------
entryIdColumnIndex = final.columns.get_loc("entryId")
setColumns = final.columns[-9:]

# ### Scenario 1
# ---
# #### Happy path - user did everything correctly.

scenario1 = final[final.setName == "TRT B1 L01"].copy()
assert scenario1.shape[0] == 52, scenario1.shape
scenario1.index = list(range(scenario1.shape[0]))
fixed1 = correctUnitEntryAssociations(scenario1, False)

mismatched = fixed1[(fixed1["catalogId_e"] != fixed1["catalogId_s"])]
assert mismatched.size == 0  # Scenario 1: happy path, user did everything correctly

# ### Scenario 2
# ---
# #### Happy path - user did everything correctly w/ exp placeholders.
scenario2 = final[final.setName == "TRT B2 L01"].copy()
assert scenario2.shape[0] == 52, scenario2.shape
scenario2.index = list(range(scenario2.shape[0]))
fixed2 = correctUnitEntryAssociations(scenario2, False)

mismatched = fixed2[(fixed2["catalogId_e"] != fixed2["catalogId_s"])]
assert mismatched[(mismatched.catalogId_e != -1)].shape[0] == 0, mismatched[(mismatched.catalogId_e == -1)]  # Scenario 2 

# ### Scenario 3
# ---
# #### Set has correct materials but all assigned to wrong treatment.  
# (Same as "TRT B1 L04" but with lots instead of inv.)

scenario3 = final[final.setName == "TRT B1 L02"].copy()
assert scenario3.shape[0] == 52, scenario3.shape
assert scenario3[(scenario3.productType != 'lot')].shape[0] == 0
scenario3.index = list(range(scenario3.shape[0]))
fixed3 = correctUnitEntryAssociations(scenario3, False)

mismatched = fixed3[(fixed3["catalogId_e"] != fixed3["catalogId_s"])]
assert mismatched.shape[0] == 0  # Scenario 3
duplicateCatalogIds, expIndices, setIndices = np.intersect1d(fixed3.catalogId_e.values, fixed3.catalogId_s.values, return_indices=True)
assert np.all(expIndices == setIndices)


# ### Scenario 4
# ---
# #### Set with some materials doubled up and some totally missing.
# 
# ##### Test case 1: Simple chain
# ```
# 47 wants to switch with 21,
# 21 wants to switch with  7,
#  7 wants to switch with  2,
#  2 wants to switch with 26,
# 26 must switch with 47 to complete the chain.
# ```
# 
# ##### Test case 2: Simple chain (longer)
# ```
# 40 wants to switch with 16,
# 16 wants to switch with  5, 
#  5 wants to switch with  1, 
#  1 wants to switch with 25, 
# 25 wants to switch with  9, 
#  9 wants to switch with  4, 
#  4 wants to switch with  0, 
#  0 wants to switch with 24, 
# 24 wants to switch with  8, 
#  8 wants to switch with  3, 
#  3 wants to switch with 27, 
# 27 must switch with 40 to complete the chain.
# ```
# 
# ##### Test case 3: Do-see-do
# ```
# 45 and 19 want to switch with each other.
# ```

scenario4 = final[final.setName == "TRT B1 L05"].copy()
assert scenario4.shape[0] == 52, scenario4.shape
scenario4.index = list(range(scenario4.shape[0]))
fixed4 = correctUnitEntryAssociations(scenario4, False)
correctlyAssigned = scenario4[(scenario4["catalogId_e"] == scenario4["catalogId_s"])]

assert correctlyAssigned.shape[0] == 2, correctlyAssigned.shape
cases = [  # format: ( expected order, original order)
  ([21, 7, 2, 26, 47], [47, 21, 7, 2, 26]),
  ([16, 5, 1, 25, 9, 4, 0, 24, 8, 3, 27, 40], [40, 16, 5, 1, 25, 9, 4, 0, 24, 8, 3, 27]),
  ([19, 45], [45, 19]),
]
for e, a in cases:
  c =  scenario4.columns.get_indexer(setColumns)
  expected = scenario4.iloc[e, c].values
  actual = fixed4.iloc[a, c].values
  assert np.array_equal(expected, actual), "Expected != actual {0}\n{1}".format((e, a), np.where(expected != actual, expected, np.empty_like(expected)))
# Check that the experiments side of the table is unaltered
expectedExp = scenario4.iloc[:, :7].values
actualExp = fixed4.iloc[:, :7].values
assert np.all(expectedExp == actualExp), "Violation: experiment values have been altered! {0}".format(np.where(expectedExp != actualExp, expectedExp, np.empty_like(expectedExp)))
# Check the count of the catalog matches has increased by X
previousMatches = scenario4[(scenario4["catalogId_s"] == scenario4["catalogId_e"])].shape[0]
finalMatches = fixed4[(fixed4["catalogId_s"] == fixed4["catalogId_e"])].shape[0]
assert finalMatches == 28, "Did not match the test criteria"
assert finalMatches - previousMatches == 26, "{0}, {1}".format(finalMatches, previousMatches)

# ### Scenario 5
# ---
# #### Set with materials from the wrong block assigned to 48 of 52 entries.
# 
# Behavior: _no changes made._

scenario5 = final[(final.setName == "TRT B2 L02")].copy()
scenario5.index = list(range(scenario5.shape[0]))
fixed5 = correctUnitEntryAssociations(scenario5, False)

assert scenario5.shape == fixed5.shape, fixed5
# Boolean without index column (Numpy thinks the index column is false)
assert np.all(fixed5.eq(scenario5).iloc[:, 1:]), fixed5.eq(scenario5)  # Scenario 5
# The last seven records are for checks, so the catalogId_e is NaN (which DataFrame.eq can't handle), so we'll ignore them for the first assertion
assert np.all(fixed5.eq(scenario5).iloc[:, 1:]), "Violation: values have been altered!\n {0}".format(fixed5.eq(scenario5).iloc[:, 1:])
assert np.all(fixed5.iloc[40:, 1:].eq(scenario5.iloc[40:, 1:])), "Violation: values have been altered!\n {0}".format(fixed5.eq(scenario5))

# ### Scenario 6
# ---
# #### Set with the right materials but all are assigned to the wrong treatment.  
# (Same as "TRT B1 L02" but with inv instead of lots.)
# 
# Behavior: all entry data is shifted accordingly to match the experiment's catalog IDs. (Test case #4)
# 
# ##### Test case 4: Merry-go-round
# ```
# x wants to switch with y,
# y wants to switch with z,
# z wants to switch with x.
# ```
# 

scenario6 = final[(final.setName == "TRT B1 L04")].copy()
scenario6.index = list(range(scenario6.shape[0]))
assert scenario6.shape[0] == 52
assert scenario6[(scenario6.productType != 'inventory')].shape[0] == 0
fixed6 = correctUnitEntryAssociations(scenario6, False)

mismatched = fixed6[(fixed6["catalogId_e"] != fixed6["catalogId_s"])]
assert mismatched.shape[0] == 0

# ## Sending the changes
# 
# Now that we can reliably map the entries to the experimental units for each set, we need to send those changes to the Experiments API so we can store them in the database.

args = []
for fixed in [fixed1, fixed2, fixed3, fixed4, fixed5, fixed6]:
  # print(fixed.loc[:, ["catalogId_e", "catalogId_s", "experimentalUnitId", "entryId"]].head())
  args.extend( fixed[["experimentalUnitId", "entryId"]].T.apply(lambda x: tuple(x)) )
prep = patchExperimentalUnits(*args, id=5419, env='np', token=experimentsToken, testing=True)

# Sanity check
assert not np.all(fixed1.eq(fixed2).iloc[1:, :]), fixed1.eq(fixed2)
# Check that we've made the tuples correctly
for i, fixed in zip(range(0, 312, 52), [fixed1, fixed2, fixed3, fixed4, fixed5, fixed6]):
  assert args[i] == fixed[["experimentalUnitId", "entryId"]].T.apply(lambda x: tuple(x) )[0], (args[i], fixed[["experimentalUnitId", "entryId"]].T.apply(lambda x: tuple(x) )[0])
assert prep.headers["oauth_resourceownerinfo"].startswith("user_id"), prep.headers
bodyToSend = eval(prep.body)
assert len(bodyToSend) == 312, "Missing values in body"
assert sum([x.keys() == set(["id", "setEntryId"]) for x in bodyToSend]), "At least one input is missing a key"
assert len(set([x["id"] for x in bodyToSend])) == 312, "Body is sending more than one entry per experimental unit"
assert len(set([x["setEntryId"] for x in bodyToSend])) == 312, "Body is sending more than one experimental unit per entry "
assert prep.url.startswith('https://api01')
assert prep.url.endswith('experiments/5419/experimental-units')
"""