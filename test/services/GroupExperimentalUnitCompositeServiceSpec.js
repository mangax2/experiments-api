const sinon = require('sinon')
const chai = require('chai')
const _ = require('lodash')
const GroupExperimentalUnitCompositeService = require('../../src/services/GroupExperimentalUnitCompositeService')
const db = require('../../src/db/DbManager')

describe("GroupExperimentalUnits Specs", ()=> {
    let target
    const testTx = {
        tx: {}
    }
    const testError = {}
    const testContext = {}
    before(()=> {
        target = new GroupExperimentalUnitCompositeService()
    })
    describe("get Groups and Units", ()=> {
        let getGroupsByExperimentIdStub
        let batchGetGroupValuesByGroupIdsStub
        let batchGetExperimentalUnitsByGroupIdsStub


        before(() => {
            getGroupsByExperimentIdStub = sinon.stub(target._groupService, 'getGroupsByExperimentId')
            batchGetGroupValuesByGroupIdsStub = sinon.stub(target._groupValueService, 'batchGetGroupValuesByGroupIds')
            batchGetExperimentalUnitsByGroupIdsStub = sinon.stub(target._experimentalUnitService, 'batchGetExperimentalUnitsByGroupIds')
        })
        afterEach(() => {
            getGroupsByExperimentIdStub.reset()
            batchGetGroupValuesByGroupIdsStub.reset()
            batchGetExperimentalUnitsByGroupIdsStub.reset()
        })
        after(() => {
            getGroupsByExperimentIdStub.restore()
            batchGetGroupValuesByGroupIdsStub.restore()
            batchGetExperimentalUnitsByGroupIdsStub.restore()
        })

        it("Success:getGroupsAndUnitDetails", ()=> {
            getGroupsByExperimentIdStub.resolves([{'id': 1, 'experiment_id': 2}, {'id': 2, 'experiment_id': 2}])
            batchGetGroupValuesByGroupIdsStub.resolves([{'id': 3, 'group_id': 1}, {'id': 4, 'group_id': 2}])
            batchGetExperimentalUnitsByGroupIdsStub.resolves([{'id': 1, 'group_id': 1}, {'id': 2, 'group_id': 2}])
            return target.getGroupAndUnitDetails(2, testTx).then((data)=> {
                data.length.should.equal(2)
                data[0]['groupValues'][0]['group_id'].should.equal(1)
                data[0]['units'][0]['group_id'].should.equal(1)
                sinon.assert.called(
                    batchGetGroupValuesByGroupIdsStub
                )
                sinon.assert.called(
                    batchGetExperimentalUnitsByGroupIdsStub

                )
            })
        })

        it("Failure:getGroupsAndUnitDetails When getGroupsByExperimentId Fails", ()=> {
            getGroupsByExperimentIdStub.rejects(testError)
            const experimentId = 1
            return target.getGroupAndUnitDetails(experimentId, testTx).should.be.rejected.then((err)=> {
                testError.should.equal(err)
                sinon.assert.calledWithExactly(
                    getGroupsByExperimentIdStub,
                    experimentId,
                    sinon.match.same(testTx)
                )
                sinon.assert.notCalled(
                    batchGetExperimentalUnitsByGroupIdsStub
                )
                sinon.assert.notCalled(
                    batchGetGroupValuesByGroupIdsStub
                )
            })
        })


        it("Failure:getGroupsAndUnitDetails When batchGetGroupValuesByGroupIds Fails", ()=> {
            getGroupsByExperimentIdStub.resolves([{'id': 1, 'experiment_id': 2}, {'id': 2, 'experiment_id': 2}])
            batchGetGroupValuesByGroupIdsStub.rejects(testError)
            const experimentId = 1
            return target.getGroupAndUnitDetails(experimentId, testTx).should.be.rejected.then((err)=> {
                testError.should.equal(err)
                sinon.assert.calledWithExactly(
                    getGroupsByExperimentIdStub,
                    experimentId,
                    sinon.match.same(testTx)
                )
                sinon.assert.calledWithExactly(
                    batchGetExperimentalUnitsByGroupIdsStub,
                    [1, 2],
                    sinon.match.same(testTx)
                )

            })
        })

        it("Failure:getGroupsAndUnitDetails When batchGetExperimentalUnitsByGroupIds Fails", ()=> {
            getGroupsByExperimentIdStub.resolves([{'id': 1, 'experiment_id': 2}, {'id': 2, 'experiment_id': 2}])
            batchGetExperimentalUnitsByGroupIdsStub.rejects(testError)
            const experimentId = 1
            return target.getGroupAndUnitDetails(experimentId, testTx).should.be.rejected.then((err)=> {
                testError.should.equal(err)
                sinon.assert.calledWithExactly(
                    getGroupsByExperimentIdStub,
                    experimentId,
                    sinon.match.same(testTx)
                )
                sinon.assert.calledWithExactly(
                    batchGetGroupValuesByGroupIdsStub,
                    [1, 2],
                    sinon.match.same(testTx)
                )
            })


        })

    })

    describe(("Save Groups and Units"),()=>{

        let deleteGroupsForExperimentIdStub
        let batchCreateGroupsStub
        let batchCreateExperimentalUnitsStub
        let batchCreateGroupValuesStub
        let getDistinctExperimentIdsStub

        before(() => {
            deleteGroupsForExperimentIdStub = sinon.stub(target._groupService, 'deleteGroupsForExperimentId')
            batchCreateGroupsStub = sinon.stub(target._groupService, 'batchCreateGroups')
            batchCreateGroupValuesStub = sinon.stub(target._groupValueService, 'batchCreateGroupValues')
            batchCreateExperimentalUnitsStub = sinon.stub(target._experimentalUnitService, 'batchCreateExperimentalUnits')
            getDistinctExperimentIdsStub = sinon.stub(db.treatment,'getDistinctExperimentIds')
        })
        afterEach(() => {
            deleteGroupsForExperimentIdStub.reset()
            batchCreateGroupsStub.reset()
            batchCreateGroupValuesStub.reset()
            batchCreateExperimentalUnitsStub.reset()
            getDistinctExperimentIdsStub.reset()
        })
        after(() => {
            deleteGroupsForExperimentIdStub.restore()
            batchCreateGroupsStub.restore()
            batchCreateGroupValuesStub.restore()
            batchCreateExperimentalUnitsStub.restore()
            getDistinctExperimentIdsStub.restore()
        })
        it("Success:saveGroupAndUnitDetails", ()=> {
            const requestpayLoad=[
                {
                    "experimentId": 1,
                    "refRandomizationStrategyId": 1,
                    "groupValues": [{"repNumber":1}],
                    "units":[
                        {
                            "treatmentId": 5,
                            "rep": 1
                        }
                    ]
                },
                {
                    "experimentId": 1,
                    "refRandomizationStrategyId": 1,
                    "groupValues": [{"repNumber":2}],
                    "units":[
                        {
                            "treatmentId": 150,
                            "rep": 2
                        }
                    ]
                }

            ]
            deleteGroupsForExperimentIdStub.resolves([])
            batchCreateGroupsStub.resolves([{'id':1},{'id':2}])
            batchCreateExperimentalUnitsStub.resolves([])
            batchCreateGroupValuesStub.resolves([])
            getDistinctExperimentIdsStub.resolves([{'experiment_id':1}])
            return target.saveGroupAndUnitDetails(requestpayLoad,testContext,testTx).then(()=>{
                sinon.assert.called(
                    batchCreateGroupValuesStub

                )
                sinon.assert.called(
                    batchCreateExperimentalUnitsStub
                )
                sinon.assert.calledWithExactly(getDistinctExperimentIdsStub,[5,150],testTx)

            })

        })

        it("Failure:saveGroupAndUnitDetails when deleteGroupsForExperimentIdStub fails", ()=> {
        const requestpayLoad=[
            {
                "experimentId": 1,
                "refRandomizationStrategyId": 1,
                "groupValues": [{"repNumber":1}],
                "units":[
                    {
                        "treatmentId": 5,
                        "rep": 1
                    }
                ]
            },
            {
                "experimentId": 1,
                "refRandomizationStrategyId": 1,
                "groupValues": [{"repNumber":2}],
                "units":[
                    {
                        "treatmentId": 150,
                        "rep": 2
                    }
                ]
            }

        ]
        deleteGroupsForExperimentIdStub.rejects(testError)
        return target.saveGroupAndUnitDetails(requestpayLoad,testContext,testTx).should.be.rejected.then((err)=> {
            testError.should.equal(err)
            sinon.assert.notCalled(
                batchCreateGroupsStub
            )
            sinon.assert.notCalled(
                batchCreateExperimentalUnitsStub
            )
            sinon.assert.notCalled(
                batchCreateGroupValuesStub
            )
            sinon.assert.notCalled(
                getDistinctExperimentIdsStub
            )
        })

    })
        it("Failure:saveGroupAndUnitDetails when batchCreateGroupsStub fails", ()=> {
            const requestpayLoad=[
                {
                    "experimentId": 1,
                    "refRandomizationStrategyId": 1,
                    "groupValues": [{"repNumber":1}],
                    "units":[
                        {
                            "treatmentId": 5,
                            "rep": 1
                        }
                    ]
                },
                {
                    "experimentId": 1,
                    "refRandomizationStrategyId": 1,
                    "groupValues": [{"repNumber":2}],
                    "units":[
                        {
                            "treatmentId": 150,
                            "rep": 2
                        }
                    ]
                }

            ]
            deleteGroupsForExperimentIdStub.resolves([])
            batchCreateGroupsStub.rejects(testError)
            return target.saveGroupAndUnitDetails(requestpayLoad,testContext,testTx).should.be.rejected.then((err)=> {
                testError.should.equal(err)
                sinon.assert.notCalled(
                    batchCreateExperimentalUnitsStub
                )
                sinon.assert.notCalled(
                    batchCreateGroupValuesStub
                )
                sinon.assert.notCalled(
                    getDistinctExperimentIdsStub
                )
            })
        })

        it("Failure:saveGroupAndUnitDetails when getDistinctExperimentIdsStub fails as it return different experimentIds", ()=> {
            const requestpayLoad=[
                {
                    "experimentId": 1,
                    "refRandomizationStrategyId": 1,
                    "groupValues": [{"repNumber":1}],
                    "units":[
                        {
                            "treatmentId": 5,
                            "rep": 1
                        }
                    ]
                },
                {
                    "experimentId": 1,
                    "refRandomizationStrategyId": 1,
                    "groupValues": [{"repNumber":2}],
                    "units":[
                        {
                            "treatmentId": 150,
                            "rep": 2
                        }
                    ]
                }

            ]
            deleteGroupsForExperimentIdStub.resolves([])
            batchCreateGroupsStub.resolves([{'id':1},{'id':2}])
            batchCreateGroupValuesStub.resolves([])
            getDistinctExperimentIdsStub.resolves([{'experiment_id':1},{'experiment_id':2}])
           return  target.saveGroupAndUnitDetails(requestpayLoad,testContext,testTx).should.be.rejected.then((err)=> {
                err.should.equal("Treatments not associated with same experiment")
                sinon.assert.notCalled(
                    batchCreateExperimentalUnitsStub
                )


            })
        })

        it("Failure:saveGroupAndUnitDetails when payload has multiple  experimentIds", ()=> {
            const requestpayLoad=[
                {
                    "experimentId": 1,
                    "refRandomizationStrategyId": 1,
                    "groupValues": [{"repNumber":1}],
                    "units":[
                        {
                            "treatmentId": 5,
                            "rep": 1
                        }
                    ]
                },
                {
                    "experimentId": 2,
                    "refRandomizationStrategyId": 1,
                    "groupValues": [{"repNumber":2}],
                    "units":[
                        {
                            "treatmentId": 150,
                            "rep": 2
                        }
                    ]
                }

            ]
            return target.saveGroupAndUnitDetails(requestpayLoad,testContext,testTx).should.be.rejected.then((err)=> {
                err.should.equal("Multiple ExperimentIds in the payload")
                sinon.assert.notCalled(
                    deleteGroupsForExperimentIdStub
                )


            })
        })




})

    describe("assignGroupIdToGroupValuesAndUnits Specs",()=>{

        it("assignGroupIdToGroupValuesAndUnits",()=>{
            const groupUnits=[{'experiment_id':1,groupValues:[{"id":1}],"units":[{"id":1}]}]
            const groupIds=[1]
            const result = target.assignGroupIdToGroupValuesAndUnits(groupUnits,groupIds)
            result[0].groupValues[0].groupId.should.equal(1)
        })
    })

    describe("createExperimentalUnits Specs",()=>{

        let batchCreateExperimentalUnitsStub
        let getDistinctExperimentIdsStub

        before(() => {
            batchCreateExperimentalUnitsStub = sinon.stub(target._experimentalUnitService, 'batchCreateExperimentalUnits')
            getDistinctExperimentIdsStub = sinon.stub(db.treatment,'getDistinctExperimentIds')
        })
        afterEach(() => {
            getDistinctExperimentIdsStub.reset()
            batchCreateExperimentalUnitsStub.reset()
        })
        after(() => {
            getDistinctExperimentIdsStub.restore()
            batchCreateExperimentalUnitsStub.restore()
        })
        it("createExperimentalUnits",()=>{
            getDistinctExperimentIdsStub.resolves([{'experiment_id':1}])
            const units=[{
                "treatmentId": 5,
                "rep": 1
            },{
                "treatmentId": 150,
                "rep": 2
            }]
            const experimentId=1

            return target._createExperimentalUnits(units,testContext,experimentId,testTx).then(()=>{
                sinon.assert.called(
                    batchCreateExperimentalUnitsStub

                )
            })




        })
        it("createExperimentalUnits, when getDistinctExperimentIds rejects",()=>{
            getDistinctExperimentIdsStub.rejects(testError)
            const units=[{
                "treatmentId": 5,
                "rep": 1
            },{
                "treatmentId": 150,
                "rep": 2
            }]
            const experimentId=1

            return target._createExperimentalUnits(units,testContext,experimentId,testTx).should.be.rejected.then((err)=>{
                err.should.equal(testError)
                sinon.assert.notCalled(
                    batchCreateExperimentalUnitsStub
                )
            })




        })

        it("createExperimentalUnits, when getDistinctExperimentIds rejects when treatment belong to multiple experiments ",()=>{
            getDistinctExperimentIdsStub.resolves([{experiment_id:1},{experiment_id:2}])
            const units=[{
                "treatmentId": 5,
                "rep": 1
            },{
                "treatmentId": 150,
                "rep": 2
            }]
            const experimentId=1
           return  target._createExperimentalUnits(units,testContext,experimentId,testTx).should.be.rejected.then((err)=>{
                err.should.equal("Treatments not associated with same experiment")
                sinon.assert.notCalled(
                    batchCreateExperimentalUnitsStub
                )
            })




        })
    })

    describe("getUnitsandGroupValues Specs",()=>{
        it("getUnitsandGroupValues",()=>{
            const groupResp=[{id:1}]
            const groupAndUnitDetails=[{'experimentId':1,'groupValues':[{repNumber:'1'}],'units':[{'treatmentId':1}]}]
            const result = target._getUnitsAndGroupValues(groupResp,groupAndUnitDetails)
            result.units[0].groupId.should.equal(1)
            result.groupValues[0].groupId.should.equal(1)
        })
    })

})
