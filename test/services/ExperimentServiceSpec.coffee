#sinon = require 'sinon'
#ExperimentsService = require '../../services/ExperimentsService'
#ExperimentDao = require '../../dao/ExperimentDao'
#ConnectionManager = require '../../db/ConnectionManager'
#
#describe 'the ExperimentsService', ->
#
##  beforeEach (done) ->
##    testObject = new ExperimentsService()
##    mockGetExperiments = sinon.stub().returns [{'id':2}]
##    mockConnection = sinon.stub().returns {}
##    ConnectionManager.getConnection = mockConnection
##    expDao = new ExperimentDao(mockConnection)
##    expDao.getAll = mockGetExperiments
#
#
#  it 'getAllExperiments happy path', ->
#    sinon.stub(ExperimentDao.prototype, 'getAll').returns([{'id':2}])
#    sinon.stub(ConnectionManager.prototype, 'getConnection').resolves({})
#    sinon.stub(ConnectionManager.prototype, 'releaseConnection').resolves()
#
#    testObject = new ExperimentsService()
#
#    testObject.getAllExperiments()
#    .then (experiments) ->
#      experiments.length.should.equal 1
#      experiment = experiments[0]
#      experiment['id'].should.equal 2
#
