from pytest_cases import CaseData, case_name

@case_name('Happy path')
def case_userDidEverythingCorrectly() -> CaseData:
  """ 
    The script should not change any data.
    TRT B1 L01 (37867) & TRT B2 L01 (37858)
  """
  inputs = dict(
    withoutExperimentPlaceholders=dict(setId=37867, experiment=5419),
    withExperimentPlaceholders=dict(setId=37858, experiment=5419),
  )
  outputs = (None, None)  # ???
  return inputs, outputs, None

@case_name('Right materials, wrong treatments')
def case_rightMaterialsWrongTreatments() -> CaseData:
  """
    The output should contain only valid material afterwards
  """
  inputs = dict(
    allLots=dict(setId=37861, experiment=5419),
    allInventories=dict(setId=37857, experiment=5419),
  )
  outputs = (None, None)  # ???
  return inputs, outputs, None

@case_name('Doubled some materials and missing others')
def case_doubledAndMissingMaterials() -> CaseData:
  """
    The data that can be assigned correctly is, the rest is left as-is.
  """
  inputs = dict(
    doubledUpAndMissing: dict(setId: 37856, experiment=5419),
  )
  outputs = (None)
  return inputs, outputs, None

@case_name('Materials from wrong block')
def case_rightMaterialsWrongBlock() -> CaseData:
  """ 
    If from larger or equal block, don't do anything.  
    If from smaller block, don't do anything.
  """
  inputs = dict(
    fromLargerBlock=dict(setId=37860, experiment=5419),
    fromSmallerBlock=dict(setId=37860, experiment=5419),
    fromEqualSizeBlock=dict(setId=37860, experiment=5419),
  )
  outputs = (None, None)
  return inputs, outputs, None
