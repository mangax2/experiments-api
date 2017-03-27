const sinon = require("sinon")
const RefDataSourceService = require("../../src/services/RefDataSourceService")
const db = require("../../src/db/DbManager")

describe("RefDataSourceService Specs", () => {
    let target
    let findStub
    let findTypeStub
    let findByTypeStub
    let allStub

    before(() => {
        target = new RefDataSourceService()

        allStub = sinon.stub(db.refDataSource, "all")
        findStub = sinon.stub(db.refDataSource, "find")
        findTypeStub = sinon.stub(db.refDataSourceType, "find")
        findByTypeStub = sinon.stub(db.refDataSource, "findByTypeId")
    })

    afterEach(() => {
        findStub.reset()
        findTypeStub.reset()
        allStub.reset()
        findByTypeStub.reset()
    })

    after(() => {
        findStub.restore()
        findTypeStub.restore()
        allStub.restore()
        findByTypeStub.restore()
    })
    
    describe("getRefDataSources", ()=>{
        it("gets all ref data sources from database",()=>{
            allStub.resolves([{}])

            return target.getRefDataSources().then((value)=>{
                value.should.deep.equal([{}])
            })
        })

        it("throws an error when get all ref data sources fails", ()=>{
            allStub.rejects("error")

            return target.getRefDataSources().should.be.rejected.then((error)=>{
                error.message.should.equal("error")
            })
        })
    })

    describe("getRefDataSourceById", ()=>{
        it("gets a ref data source by it's id", ()=>{
            findStub.resolves({})

            return target.getRefDataSourceById(1).then((value)=>{
                value.should.deep.equal({})
            })
        })

        it("rejects when a ref data source is not found for id", ()=>{
            findStub.resolves(null)

            return target.getRefDataSourceById(1).should.be.rejected.then((error)=>{
                error.status.should.equal(404)
                error.message.should.equal("Ref Data Source Not Found for requested id")
            })
        })

        it("rejects when getRefDataSourceById fails", ()=>{
            findStub.rejects("error")

            return target.getRefDataSourceById(1).should.be.rejected.then((error)=>{
                error.message.should.equal("error")
            })
        })
    })

    describe("getRefDataSourcesByTypeId", ()=>{
        it("gets all ref data sources based on type id", ()=>{
            findByTypeStub.resolves([{}])

            return target.getRefDataSourcesByRefDataSourceTypeId(1).then((values)=>{
                values.should.deep.equal([{}])
            })
        })

        it("rejects when the database call fails", ()=>{
            findByTypeStub.rejects("error")

            return target.getRefDataSourcesByRefDataSourceTypeId(1).should.be.rejected.then((err)=>{
                err.message.should.equal("error")
            })
        })
    })

    describe("getCompleteRefDataSourceById", ()=>{
        it("gets a complete ref data source by it's id", ()=>{
            findStub.resolves({ref_data_source_type_id: 1})
            findTypeStub.resolves({type: 'testType'})

            return target.getCompleteRefDataSourceById(1).then((value)=>{
                value["ref_data_source_type"].should.deep.equal({type: "testType"})
            })
        })

        it("throws error when it can't find ref data source by id", ()=>{
            findStub.resolves(null)

            return target.getCompleteRefDataSourceById(1).should.be.rejected.then((err)=>{
                sinon.assert.notCalled(findTypeStub)
            })
        })

        it("throws error when find ref data source by id fails", ()=>{
            findStub.rejects("error")

            return target.getCompleteRefDataSourceById(1).should.be.rejected.then((err)=>{
                sinon.assert.notCalled(findTypeStub)
                err.message.should.equal("error")
            })
        })

        it("throws an error when find ref data source type by id fails", ()=>{
            findStub.resolves({ref_data_source_type_id: 1})
            findTypeStub.rejects("error")

            return target.getCompleteRefDataSourceById(1).should.be.rejected.then((err)=>{
                sinon.assert.calledWith(findTypeStub, 1)
                err.message.should.equal("error")
            })

        })
    })
})