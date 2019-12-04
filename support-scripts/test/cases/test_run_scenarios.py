from pytest_cases import cases_data

from . import test_scenarios_EXP384


@cases_data(module=test_scenarios_EXP384)
def test_scenarios(setup_data, case_data):
    mergeData, corrected = setup_data
    inputs, expected, error = case_data.get()
    setName = inputs["setName"]
    thisSet = corrected.loc[lambda df: df.setName == setName, :].copy()
    placeholderValue = -1
    # Check the final length
    _shortened = thisSet.loc[:, ["setName", "catalogId_e", "catalogId_s", "experimentalUnitId", "entryId"]]
    assert thisSet.shape[0] == expected['size'],  "{2}: Expected final length to be {0}, instead \n{1}".format(expected['size'], _shortened.head(), setName)
    # Check the final mismatched length
    mismatched = thisSet.loc[(thisSet.catalogId_e != thisSet.catalogId_s) & (thisSet.catalogId_e != placeholderValue), ["catalogId_e", "catalogId_s", "setName", "entryId", "treatmentId"]]
    assert mismatched.shape[0] == expected['mismatchedSize'], "{2}: Expected mismatched length to be {0}, instead \n{1}".format(expected['mismatchedSize'], mismatched.head(), setName)
    # Check the final mismatched length without the placeholder value
    withPlaceHolders = thisSet[(thisSet.catalogId_e == placeholderValue)]
    assert withPlaceHolders.shape[0] == expected["placeholderCount"], withPlaceHolders
    # Run additional checks
    if "checks" in inputs.keys():
        for check in inputs["checks"]:
            eval(check.format(actual=mismatched, old=mergeData.loc[lambda df: df.setName == setName, :].copy()))
    
