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
from getpass import getuser
from itertools import accumulate
import json
import numpy as np
import os
import pandas as pd
import requests
import sgqlc as gql
from sgqlc.endpoint.http import HTTPEndpoint

from services.experiments import getUnitsToTreatments, patchExperimentalUnits
from services.sets import getSetsByExperiment, getSetsDataFrame
from services.velmat import getSetMaterialData


def getSeedsOnly(df):
  return df[df.materialType == 'internal_seed']
  
def getMaterialsFromSet(df):
  materials = []
  for index, material in df.iterrows():
    materials.append((
      material.productType, 
      "INTERNAL_SEED", 
      int(material.materialId), 
      int(material.entryId), 
      int(material.setId)
    ))
  return materials

def switchRows(df, i1, i2):
  r1 = df.iloc[i1, -9:]
  r2 = df.iloc[i2, -9:]
  df.iloc[i1, -9:] = r2
  df.iloc[i2, -9:] = r1
  return df

def correctUnitEntryAssociations(df, verbose):
  for setId in df["setId"]:
    setDf = df.loc[lambda df: df.setId == setId, :].copy()
    _, expRowNumbers, setRowNumbers = np.intersect1d(
      setDf.catalogId_e.values,
      setDf.catalogId_s.values,
      return_indices=True
    )
    if verbose:  # setId == 37867:
      # verbose = True
      print()
      print("New set:", setId)
      print(expRowNumbers)
      print(setRowNumbers)
      print(")"*100)
    df.loc[lambda df: df.setId == setId, :] = algorithm(setDf, expRowNumbers, setRowNumbers, verbose)
  return df
  
def algorithm(df, expRowNumbers, setRowNumbers, verbose):
  old = df.copy()
  i = -1
  if np.all(expRowNumbers == setRowNumbers):
    return df
  for expRowNumber in expRowNumbers:
    i += 1
    setRowNumber = setRowNumbers[i]
    if verbose: 
      print('-'*100, '\n', expRowNumber, setRowNumber, ':\n')
    if expRowNumber != setRowNumber:
      df = switchRows(df, expRowNumber, setRowNumber)
      if verbose:
        print(expRowNumber, '<-->', setRowNumber, end="\n")
        print('Exp:', expRowNumbers, '\nSet:', setRowNumbers, '\n^^^^^^OLD VS NEWvvvvvvv')
        print(df.iloc[expRowNumber, -9:], df.iloc[expRowNumber, -9:])
        print("......")
      if verbose: 
        print(expRowNumber, '<-->', setRowNumber, end="\n")
      if expRowNumber in setRowNumbers:  # part of a chain
        setRowNumbers[np.where(setRowNumbers == expRowNumber)] = setRowNumber
      setRowNumbers[i] = expRowNumber
      if verbose:
        print('Exp:', expRowNumbers, '\nSet:', setRowNumbers)
    else:
      if verbose:
        print("Do nothing!")
        _, __, currentIndices = np.intersect1d(df.catalogId_e.values, df.catalogId_s.values, return_indices=True)
        print('Exp:', expRowNumbers, '\nCur:', currentIndices)
      continue
  return df

def patchExperimentalUnits(*args, id=None, env=None, experimentsToken='', testing=False, verbose=False, **kwargs):
  """
    args = (eunit_1, entryId_1), (eunit_2, entryId_2)
  """
  headers = getHeaders(experimentsToken)
  body = sorted([{"id": eunit, "setEntryId": entry} for eunit, entry in args], key=lambda d: d["setEntryId"])
  if testing or kwargs["update"]:
    if verbose:
      for pair in body:
        print(pair)
      print("Found {0} experimental units to fix...".format(len(args)))
    request = requests.Request("PATCH", getExperimentURL(env) + experimentalUnitsEndpoint.format(id=id), headers=headers, data=json.dumps(body))
    return request.prepare()
  else:
    print("Fixing {0} experimental units...".format(len(args)))
    response = requests.patch(getExperimentURL(env) + experimentalUnitsEndpoint.format(id=id), headers=headers, data=json.dumps(body))
    response.raise_for_status()
    print("Patch response: {0}".format(response.status_code))
  return response

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
  setsDF = getSetsDataFrame(setResponseJSON)
  setSeeds = getSeedsOnly(setsDF)
  # Get the catalog information from Velmat
  # 
  # Now that we have the seed material information in hand, we need to get the relationship
  #   between how Experiments stores the material (the catalog ID) and how Sets stores the
  #   material (an inventory or lot ID).
  setMaterials = getMaterialsFromSet(setSeeds)
  mappedMaterials = getSetMaterialData(setMaterials, **arguments)
  entriesToCatalog = setSeeds.merge(mappedMaterials, on=["materialId"], how="inner", copy=True)
  txToUnits = getUnitsToTreatments(**arguments)
  # The home stretch
  # 
  # Now we have two competing DataFrames: `entriesToCatalog` and `txToUnits` which represent
  # the state of the Sets app and the Experiments app, respectively.  To identify the changes
  # to be made we need to merge these together, but be careful!  We know that the mapping
  # between `experimentalUnitId` and `entryId` is wrong in some places, so we must remember
  # to find where the `catalogId` fields are mismatched.
  #
  # Note: we MUST examine the relationships BY SET or we could accidentally move an entry
  # association to a different block in Experiments!  <-- This is VERY BAD!
  final = txToUnits.merge(entriesToCatalog, on='entryId', how="inner", suffixes=('_e', '_s'), copy=True)
  correct = None
  try:
    correct = correctUnitEntryAssociations(final, False)
    correct = correct.loc[correct.catalogId_s != final.catalogId_s].copy()
  except:
    print(final)
  if correct is None:
    args = correct[["experimentalUnitId", "entryId"]].T.apply(lambda x: tuple(x)).values
    prep = patchExperimentalUnits(*args, **arguments)
  else:
    print("No corrections needed")
  exit()
