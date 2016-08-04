sinon = require 'sinon'
ExperimentsService = require '../../services/ExperimentsService'
ExperimentDao = require '../../dao/ExperimentDao'
ConnectionManager = require '../../db/ConnectionManager'

describe 'the ExperimentsService', ->

  {testObject, mockGetExperiments,mockConnection} = {}

#  beforeEach (done) ->
#    testObject = new ExperimentsService()
#    mockGetExperiments = sinon.stub().returns [{'id':2}]
#    mockConnection = sinon.stub().returns {}
#    ConnectionManager.getConnection = mockConnection
#    expDao = new ExperimentDao(mockConnection)
#    expDao.getAll = mockGetExperiments


  it 'getAllExperiments happy path', ->
    console.log("step1")
    testObject = new ExperimentsService()
    console.log("step2")
    mockGetExperiments = sinon.stub().returns [{'id':2}]
    mockConnection = sinon.stub().returns {}
    ConnectionManager.getConnection = mockConnection
    expDao = new ExperimentDao(mockConnection)
    expDao.getAll = mockGetExperiments
    testObject.getAllExperiments()
    .then (experiments) ->
      console.log("testing")
#      experiments.length.should.equal 5
      console.log("mocha broken")
      experiment = experiments[0]
      console.log(experiment)
      experiment.id.should.eql 1
    .catch (err) ->  err

