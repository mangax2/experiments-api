import pandas as pd
import pytest
from pytest_cases import CaseData, case_name, cases_data, pytest_fixture_plus, THIS_MODULE, CaseDataGetter, cases_fixture


@case_name('1. Happy path')
def case_userDidEverythingCorrectlyNoPlaceholders() -> CaseData:
  """ 
    The script should not change any data.
    TRT B1 L01 (37867)

  # ### Scenario 1
  # ---
  # #### Happy path - user did everything correctly.

  scenario1 = final[final.setName == "TRT B1 L01"].copy()
  assert scenario1.shape[0] == 52, scenario1.shape
  scenario1.index = list(range(scenario1.shape[0]))
  fixed1 = correctUnitEntryAssociations(scenario1, False)
  mismatched = fixed1[(fixed1["catalogId_e"] != fixed1["catalogId_s"])]
  assert mismatched.size == 0  # Scenario 1: happy path, user did everything correctly

  """
  inputs = dict(setName="TRT B1 L01")
  outputs = dict(
    size=52,
    mismatchedSize=0,
    placeholderCount=0
  )
  return inputs, outputs, None

@case_name('2. Happy path with placeholders')
def case_userDidEverythingCorrectlyWithPlaceholders() -> CaseData:
  """ 
    The script should not change any data.
    TRT B2 L01 (37858)
  
  # ### Scenario 2
  # ---
  # #### Happy path - user did everything correctly w/ exp placeholders.
  scenario2 = final[final.setName == "TRT B2 L01"].copy()
  assert scenario2.shape[0] == 52, scenario2.shape
  scenario2.index = list(range(scenario2.shape[0]))
  fixed2 = correctUnitEntryAssociations(scenario2, False)
  mismatched = fixed2[(fixed2["catalogId_e"] != fixed2["catalogId_s"])]
  assert mismatched[(mismatched.catalogId_e != -1)].shape[0] == 0, mismatched[(mismatched.catalogId_e == -1)]  # Scenario 2 
  """
  inputs = dict(setName="TRT B2 L01")
  outputs = dict(
    size=52, 
    mismatchedSize=0,
    placeholderCount=8
  )
  return inputs, outputs, None


@case_name('3. Right materials, wrong treatments - all lots')
def case_rightLotMaterialsWrongTreatments() -> CaseData:
  """
    The output should contain only valid material afterwards
    TRT B1 L02 (37861)

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
  """
  inputs = dict(setName="TRT B1 L02")
  outputs = dict(
    size=52,
    mismatchedSize=0,
    placeholderCount=0,
    checks=[
      "assert {actual}[({actual}.productType != 'lot')].shape[0] == 0",
      ]
    )
  return inputs, outputs, None


@case_name('4. Doubled_some_materials_and_missing_others')
def case_doubledAndMissingMaterials() -> CaseData:
  """
    The data that can be assigned correctly is, the rest is left as-is.
    TRT B1 L05 (37854)

  # ### Scenario 4
  # ---
  # #### Set with some materials doubled up and some totally missing.

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
  setColumns = final.columns[-9:]
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
  """
  inputs = dict(setName="TRT B1 L05")
  outputs = dict(
    size=52,
    mismatchedSize=24,
    placeholderCount=0,
    checks=[
      "assert {actual}.iloc([-9:], [21, 7, 2, 26, 47]) == {old}.iloc([-9:],[47, 21, 7, 2, 26])"
      "assert {actual}.iloc([-9:], ([16, 5, 1, 25, 9, 4, 0, 24, 8, 3, 27, 40]) == {old}.iloc([-9:], [40, 16, 5, 1, 25, 9, 4, 0, 24, 8, 3, 27])"
      "assert {actual}.iloc([-9:], [19, 45]) == {old}.iloc([-9:],[45, 19])"
    ]
  )
  return inputs, outputs, None


@case_name('5. Materials from the wrong block')
def case_rightMaterialsWrongBlock() -> CaseData:
  """ 
  Set with materials from the wrong block assigned to 48 of 52 entries should not change anything.
    TRT B2 L02 (37860)

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
  """
  inputs = dict(setName="TRT B2 L02")
  outputs = dict(
    size=52,
    mismatchedSize=40,
    placeholderCount=8,
    checks=[
      "assert np.all({actual}.iloc[40:, 1:].eq({old}.iloc[40:, 1:]))",  # no changes made, ignore check entries
    ]
  )
  return inputs, outputs, None


@case_name('6. Right materials, wrong treatments - all inventories')
def case_rightInvMaterialsWrongTreatments() -> CaseData:
  """
    The output should contain only valid material afterwards
    TRT B1 L04 (37857)

  # ### Scenario 6
  # ---
  # #### Set with the right materials but all are assigned to the wrong treatment.  
  # (Same as "TRT B1 L02" but with inv instead of lots.)


  scenario6 = final[(final.setName == "TRT B1 L04")].copy()
  scenario6.index = list(range(scenario6.shape[0]))
  assert scenario6.shape[0] == 52
  assert scenario6[(scenario6.productType != 'inventory')].shape[0] == 0
  fixed6 = correctUnitEntryAssociations(scenario6, False)
  mismatched = fixed6[(fixed6["catalogId_e"] != fixed6["catalogId_s"])]
  assert mismatched.shape[0] == 0
  """
  inputs = dict(setName="TRT B1 L04")
  outputs = dict(
    size=52,
    mismatchedSize=0,
    placeholderCount=0,
    checks=[
      "assert {actual}[({actual}.productType != 'inventory')].shape[0] == 0",
    ]
  )
  return inputs, outputs, None
