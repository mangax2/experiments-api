const sinon = require('sinon')
const RefDataSourceTypeService = require('../../src/services/RefDataSourceTypeService')
const db = require('../../src/db/DbManager')

describe('RefDataSourceTypeService Specs', () => {
  let target
  let findStub
  let getSourcesStub
  let allStub

  before(() => {
    target = new RefDataSourceTypeService()
    getSourcesStub = sinon.stub(target._refDataSourceService, 'getRefDataSources')

    allStub = sinon.stub(db.refDataSourceType, 'all')
    findStub = sinon.stub(db.refDataSourceType, 'find')
  })

  afterEach(() => {
    findStub.reset()
    getSourcesStub.reset()
    allStub.reset()
  })

  after(() => {
    findStub.restore()
    getSourcesStub.restore()
    allStub.restore()
  })

  describe('getRefDataSourceTypes', () => {
    it('gets all ref data source types', () => {
      allStub.resolves([{}])

      return target.getRefDataSourceTypes().then((value) => {
        value.should.deep.equal([{}])
      })
    })

    it('throws an error when find all ref data source types fails', () => {
      allStub.rejects('error')

      return target.getRefDataSourceTypes().should.be.rejected.then((err) => {
        err.message.should.equal('error')
      })
    })
  })

  describe('getRefDataSourceTypeById', () => {
    it('gets ref data source type', () => {
      findStub.resolves({})

      return target.getRefDataSourceTypeById(1).then((value) => {
        value.should.deep.equal({})
      })
    })

    it('finds no ref data source type and rejects', () => {
      findStub.resolves(null)

      return target.getRefDataSourceTypeById(1).should.be.rejected.then((err) => {
        err.status.should.equal(404)
        err.message.should.equal('Ref Data Source Type Not Found for requested id')
      })
    })

    it('rejects when get ref data source type by id fails', () => {
      findStub.rejects('error')

      return target.getRefDataSourceTypeById(1).should.be.rejected.then((err) => {
        err.message.should.equal('error')
      })
    })
  })

  describe('getRefDataSourceTypesWithDataSources', () => {
    it('gets all sources with the types', () => {
      allStub.resolves([{ id: 1 }, { id: 2 }])
      getSourcesStub.resolves([{ ref_data_source_type_id: 2 }])

      return target.getRefDataSourceTypesWithDataSources().then((data) => {
        data.should.deep.equal([{ id: 1, ref_data_sources: [] }, {
          id: 2,
          ref_data_sources: [{ ref_data_source_type_id: 2 }],
        }])
      })
    })

    it('throws an error when fails to retrieve data source types', () => {
      allStub.rejects('error')

      return target.getRefDataSourceTypesWithDataSources().should.be.rejected.then((err) => {
        err.message.should.equal('error')
        sinon.assert.notCalled(getSourcesStub)
      })
    })

    it('throws an error when one call to refDataSourceService fails', () => {
      allStub.resolves([{ id: 1 }, { id: 2 }])
      getSourcesStub.rejects('error')

      return target.getRefDataSourceTypesWithDataSources().should.be.rejected.then((err) => {
        err.message.should.equal('error')
        sinon.assert.calledOnce(getSourcesStub)
      })
    })
  })
})