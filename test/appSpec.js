const app = require('../src/app')
const request = require('supertest')

describe('the app', function() {
    // const experimentId = {}.experimentId
    return it('GET all experiments', (done) => {
        return request(app).get('/experiments-api/experiments').expect('Content-Type', 'application/json; charset=utf-8').expect((res) => {
            const b = res.body
            return b.length.should.gt(0)
        }).expect(200, done)
    })
})
