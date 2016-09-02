sinon = require 'sinon'
ExperimentsService = require '../../services/ExperimentsService'
db = require '../../db/DbManager'

describe 'the ExperimentsService', ->

  it 'getAllExperiments happy path', (done) ->
    sinon.stub(db.experiments, 'all').resolves([{'id':2}])
    testObject = new ExperimentsService()

    testObject.getAllExperiments()
    .then (experiments) ->
      experiments.length.should.equal 1
      experiments[0]['id'].should.equal 2
      done()