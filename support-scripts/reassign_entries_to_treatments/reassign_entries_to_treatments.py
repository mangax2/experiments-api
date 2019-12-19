#!/usr/bin/env python3
"""
Usage:
  reassign_entries_to_treatments.py [-u | --update] --env=ENV --experiment=ID -e=TOKEN -s=TOKEN -v=TOKEN
  reassign_entries_to_treatments.py (-h | --help)
  reassign_entries_to_treatments.py --version

Options:
  -h --help         Show this screen.
  --version         Show version.
  --experiment=ID   Find all sets by experiment ID
  -u --update       Overwrite regression testing data with new data
  --env=ENV         Environment to run in.  Values are 'prod' or 'nonprod'. 
                      [default: 'nonprod']
  -e=TOKEN          Token for Experiments API
  -s=TOKEN          Token for Sets API
  -v=TOKEN          Token for Velocity Materials API

Introduction
------------
For the experiment, we need to reassign the mapping between the experimental unit and the treatment because the materials were incorrectly assigned by the user in Sets and the packets have been created and shipped in Material Fulfillment.  By reassigning, we can recover some value from the sets being planted.

Unfortunately, determining the new assignments means we need some information from other serivces.  Here they are:
1. First and foremost, we need to get the data that caused this mess in the first place - the seed materials that are (some incorrectly!) assigned to the entries in Sets.
2. With the material-to-entry IDs in hand, we need to go to Velocity Materials and get the catalog IDs that were assigned to the combination element in each experiment level. (Remember, Set material is assigned on the lot and/or inventory level!)
 
With this information in hand, we can identify which entry CAN go to which experimental unit and which are irreparably foobar...
"""
from docopt import docopt
import numpy as np

from services.experiments import getUnitsToTreatments, patchExperimentalUnits
from services.sets import getSetsByExperiment, formatSetsResponse
from services.velmat import getSetMaterialData


totalCount = 0

def switchRows(df, i1, i2):
  global totalCount
  print(".", end="")
  r1 = df.iloc[i1, -9:]
  r2 = df.iloc[i2, -9:]
  df.iloc[i1, -9:] = r2
  df.iloc[i2, -9:] = r1
  totalCount += 1
  return df

def correctUnitEntryAssociations(df):
  # Note: we MUST examine the relationships BY SET or we could accidentally move an entry
  # association to a different block in Experiments!  <-- This is VERY BAD!
  df = df.copy()
  for setId in df["setId"].unique():
    print(' | ', end='')
    setDf = df.loc[(df.setId == setId), :].copy()
    _, expRowNumbers, setRowNumbers = np.intersect1d(
      setDf.catalogId_e.values,
      setDf.catalogId_s.values,
      return_indices=True
    )
    output = algorithm(setDf, expRowNumbers, setRowNumbers)
    df.loc[(df.setId == setId), :] = output
  print()
  return df
  
def algorithm(df, expRowNumbers, setRowNumbers):
  df = df.copy()
  i = -1
  if np.all(expRowNumbers == setRowNumbers):
    return df
  for expRowNumber in expRowNumbers:
    i += 1
    setRowNumber = setRowNumbers[i]
    if expRowNumber != setRowNumber:
      df = switchRows(df, expRowNumber, setRowNumber)
      if expRowNumber in setRowNumbers:
        setRowNumbers[np.where(setRowNumbers == expRowNumber)] = setRowNumber
      setRowNumbers[i] = expRowNumber
    else:
      continue
  return df

def cleanKey(key):
  return key.strip('-').lower()

def renameTokens(arguments):
  arguments["experimentsToken"] = arguments.pop("e")
  arguments["setsToken"] = arguments.pop("s")
  arguments["velmatToken"] = arguments.pop("v")
  arguments["store"] = arguments.pop("update")
  return arguments

if __name__ == "__main__":
  arguments = {cleanKey(x): y for x, y in docopt(__doc__, version="0.1").items()}
  arguments.pop('help')
  arguments.pop('version')
  arguments = renameTokens(arguments)
  # Get the materials assigned to each set entry
  # 
  # Let's query the Sets service and get the mapping of `setEntryId` -> `seedMaterial`
  #   (with `materialType` and `materialId`).
  setResponseJSON = getSetsByExperiment(**arguments)
  print("Retrieved sets...")
  setMaterials, setSeeds = formatSetsResponse(setResponseJSON)
  # Get the catalog information from Velmat
  # 
  # Now that we have the seed material information in hand, we need to get the relationship
  #   between how Experiments stores the material (the catalog ID) and how Sets stores the
  #   material (an inventory or lot ID).  
  mappedMaterials = getSetMaterialData(setMaterials, **arguments)
  mappedMaterials = mappedMaterials.drop_duplicates(keep='first')
  print("Retrieved materials...")
  entriesToCatalog = setSeeds.merge(mappedMaterials, on=["materialId"], how="inner", copy=True)
  # Get the experimental units and treatments
  txToUnits = getUnitsToTreatments(**arguments)
  print("Retrieved units and treatments...")
  # The home stretch
  # 
  # Now we have two competing DataFrames: `entriesToCatalog` and `txToUnits` which represent
  # the state of the Sets app and the Experiments app, respectively.  To identify the changes
  # to be made we need to merge these together, but be careful!  We know that the mapping
  # between `experimentalUnitId` and `entryId` is wrong in some places, so we must remember
  # to find where the `catalogId` fields are mismatched.
  #
  merged = txToUnits.merge(entriesToCatalog, on='entryId', how="inner", suffixes=('_e', '_s'), copy=True)
  correct = correctUnitEntryAssociations(merged)
  if np.all(correct == merged):
     print("No corrections needed")
  else:
    toFix = correct[(correct["catalogId_s"] != merged["catalogId_s"])].copy()
    args = toFix[["experimentalUnitId", "entryId"]].T.apply(lambda x: tuple(x)).values
    patchExperimentalUnits(*args, **arguments)
  print("DONE")
  exit(0)
