from getpass import getuser
import os


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
