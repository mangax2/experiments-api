const app = require('../src/app')
const request = require('supertest')

describe('the app', function() {
    const experimentId = {}.experimentId
    it('GET all experiments', (done) => {
        request(app).get('/experiments-api/experiments').expect('Content-Type', 'application/json; charset=utf-8').expect((res) => {
            const b = res.body
            b.length.should.gt(0)
        }).expect(200, done)
    })
})
