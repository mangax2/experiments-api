sinon = require 'sinon'
ExperimentsService = require '../../services/ExperimentsService'
db = require '../../db/DbManager'
experiments = require '../../repos/experiments'

describe 'the ExperimentsService', ->

  it 'getAllExperiments happy path', ->
#    sinon.stub(experiments.prototype, 'all').resolve([{'id':2}])
#    testObject = new ExperimentsService()
#
#    testObject.getAllExperiments()
#    .then (experiments) ->
#      experiments.length.should.equal 1
#      experiment = experiments[0]
#      experiment['id'].should.equal 2

