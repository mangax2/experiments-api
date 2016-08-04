app = require '../app'
request = require 'supertest'
ExperimentDao = require '../dao/ExperimentDao'

describe 'the app', ->

  {experimentId} = {}

  it 'GET all experiments', (done) ->
    request app
    .get '/experiments-api/experiments'
    .expect 'Content-Type', 'application/json; charset=utf-8'
    .expect (res) ->
      b = res.body
      b.length.should.gt 0
    .expect 200, done



