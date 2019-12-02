import pandas as pd
import pytest
from pytest_cases import CaseData, case_name, cases_data, pytest_fixture_plus, THIS_MODULE, CaseDataGetter, cases_fixture


@case_name('1. Happy path')
def case_userDidEverythingCorrectlyNoPlaceholders() -> CaseData:
  """ 
    The script should not change any data.
    TRT B1 L01 (37867)
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


@case_name('6. Right materials, wrong treatments - all inventories')
def case_rightInvMaterialsWrongTreatments() -> CaseData:
  """
    The output should contain only valid material afterwards
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


@case_name('4. Doubled_some_materials_and_missing_others')
def case_doubledAndMissingMaterials() -> CaseData:
  """
    The data that can be assigned correctly is, the rest is left as-is.
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


@case_name('Materials_from_wrong_block')
def case_rightMaterialsWrongBlock() -> CaseData:
  """ 
  Set with materials from the wrong block assigned to 48 of 52 entries should not change anything.
  """
  inputs = dict(setName="TRT B2 L02")
  outputs = dict(
    size=52,
    mismatchedSize=40,
    placeholderCount=8
  )
  return inputs, outputs, None
