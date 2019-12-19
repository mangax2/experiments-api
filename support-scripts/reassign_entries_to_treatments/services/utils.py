from getpass import getuser
import os


COLUMNS = {
  "type": 'object',
  "index": 'object',
  "inventory": 'int64',
  "lot": 'int64',
  "catalog": 'int64',
  "materialName": 'object',
  "setId": 'int64',
  "entryId": 'int64',
  "setName": 'object'
}


def getRegressionDataPath():
  pathlist = __file__.split(os.path.sep)[:-2]
  pathlist[-1] = 'test/data'
  pathlist = [os.path.sep] + pathlist
  regressionDataPath = os.path.join(*pathlist)
  return regressionDataPath


def getHeaders(token):
  return {
    'oauth_resourceownerinfo': "user_id={0}".format(getuser().lower()), 
    'Authorization': "Bearer {0}".format(token),
    "Content-Type": "application/json",
  }


def getSuffix(env):
  suffix = "-np"
  if env == "prod":
    suffix = ""
  return suffix


def getBaseURL(env):
  return "https://api01{suffix}.agro.services".format(suffix=getSuffix(env))
