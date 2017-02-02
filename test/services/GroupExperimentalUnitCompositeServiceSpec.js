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

        it("IntialLoad:getGroupsAndUnitDetails", ()=> {
            getGroupsByExperimentIdStub.resolves([])
            return target.getGroupAndUnitDetails(2, testTx).then((data)=> {
                data.length.should.equal(0)
                sinon.assert.notCalled(
                    batchGetGroupValuesByGroupIdsStub
                )
                sinon.assert.notCalled(
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
        let validateGroupsStub
        let batchCreateGroupsStub
        let batchCreateExperimentalUnitsStub
        let batchCreateGroupValuesStub
        let getDistinctExperimentIdsStub
        let recursiveBatchCreateStub

        before(() => {
            deleteGroupsForExperimentIdStub = sinon.stub(target._groupService, 'deleteGroupsForExperimentId')
            batchCreateGroupsStub = sinon.stub(target._groupService, 'batchCreateGroups')
            batchCreateGroupValuesStub = sinon.stub(target._groupValueService, 'batchCreateGroupValues')
            batchCreateExperimentalUnitsStub = sinon.stub(target._experimentalUnitService, 'batchCreateExperimentalUnits')
            getDistinctExperimentIdsStub = sinon.stub(db.treatment,'getDistinctExperimentIds')
            validateGroupsStub = sinon.stub(target, '_validateGroups')
            recursiveBatchCreateStub = sinon.stub(target, '_recursiveBatchCreate')
        })
        afterEach(() => {
            deleteGroupsForExperimentIdStub.reset()
            batchCreateGroupsStub.reset()
            batchCreateGroupValuesStub.reset()
            batchCreateExperimentalUnitsStub.reset()
            getDistinctExperimentIdsStub.reset()
            validateGroupsStub.reset()
            recursiveBatchCreateStub.reset()
        })
        after(() => {
            deleteGroupsForExperimentIdStub.restore()
            batchCreateGroupsStub.restore()
            batchCreateGroupValuesStub.restore()
            batchCreateExperimentalUnitsStub.restore()
            getDistinctExperimentIdsStub.restore()
            validateGroupsStub.restore()
            recursiveBatchCreateStub.restore()
        })

        it("Success:saveGroupAndUnitDetails", ()=> {
            deleteGroupsForExperimentIdStub.resolves([])
            recursiveBatchCreateStub.resolves()

            return target.saveGroupAndUnitDetails(1,{},testContext,testTx).then((result)=>{
                sinon.assert.called(deleteGroupsForExperimentIdStub)
                sinon.assert.called(recursiveBatchCreateStub)
                result.should.deep.equal({status: 200, message: 'SUCCESS'})
            })
        })

        it.skip("Failure:saveGroupAndUnitDetails when validateGroups fails", ()=> {
            validateGroupsStub.returns('testError')

            return target.saveGroupAndUnitDetails([],testContext,testTx).should.be.rejected.then((err)=>{
                err.errorMessage.should.equal('testError')
                sinon.assert.notCalled(recursiveBatchCreateStub)
                sinon.assert.notCalled(deleteGroupsForExperimentIdStub)
            })
        })

        it("Failure:saveGroupAndUnitDetails when deleteGroupsForExperimentIdStub fails", ()=> {
            validateGroupsStub.returns(undefined)
            deleteGroupsForExperimentIdStub.rejects(testError)
            return target.saveGroupAndUnitDetails([],testContext,testTx).should.be.rejected.then((err)=>{
                sinon.assert.notCalled(recursiveBatchCreateStub)
                err.should.equal(testError)
            })
        })
        it("Failure:saveGroupAndUnitDetails when recursiveBatchCreate fails", ()=> {
            validateGroupsStub.returns(undefined)
            deleteGroupsForExperimentIdStub.resolves([])
            recursiveBatchCreateStub.rejects(testError)
            return target.saveGroupAndUnitDetails([],testContext,testTx).should.be.rejected.then((err)=> {
                testError.should.equal(err)
            })
        })

        // it("Failure:saveGroupAndUnitDetails when getDistinctExperimentIdsStub fails as it return different experimentIds", ()=> {
        //     const requestpayLoad=[
        //         {
        //             "experimentId": 1,
        //             "refRandomizationStrategyId": 1,
        //             "groupValues": [{"repNumber":1}],
        //             "units":[
        //                 {
        //                     "treatmentId": 5,
        //                     "rep": 1
        //                 }
        //             ]
        //         },
        //         {
        //             "experimentId": 1,
        //             "refRandomizationStrategyId": 1,
        //             "groupValues": [{"repNumber":2}],
        //             "units":[
        //                 {
        //                     "treatmentId": 150,
        //                     "rep": 2
        //                 }
        //             ]
        //         }
        //
        //     ]
        //     deleteGroupsForExperimentIdStub.resolves([])
        //     batchCreateGroupsStub.resolves([{'id':1},{'id':2}])
        //     batchCreateGroupValuesStub.resolves([])
        //     getDistinctExperimentIdsStub.resolves([{'experiment_id':1},{'experiment_id':2}])
        //    return  target.saveGroupAndUnitDetails(requestpayLoad,testContext,testTx).should.be.rejected.then((err)=> {
        //         err.should.equal("Treatments not associated with same experiment")
        //         sinon.assert.notCalled(
        //             batchCreateExperimentalUnitsStub
        //         )
        //
        //
        //     })
        // })
        //
        // it("Failure:saveGroupAndUnitDetails when payload has multiple  experimentIds", ()=> {
        //     const requestpayLoad=[
        //         {
        //             "experimentId": 1,
        //             "refRandomizationStrategyId": 1,
        //             "groupValues": [{"repNumber":1}],
        //             "units":[
        //                 {
        //                     "treatmentId": 5,
        //                     "rep": 1
        //                 }
        //             ]
        //         },
        //         {
        //             "experimentId": 2,
        //             "refRandomizationStrategyId": 1,
        //             "groupValues": [{"repNumber":2}],
        //             "units":[
        //                 {
        //                     "treatmentId": 150,
        //                     "rep": 2
        //                 }
        //             ]
        //         }
        //
        //     ]
        //     return target.saveGroupAndUnitDetails(requestpayLoad,testContext,testTx).should.be.rejected.then((err)=> {
        //         err.should.equal("Multiple ExperimentIds in the payload")
        //         sinon.assert.notCalled(
        //             deleteGroupsForExperimentIdStub
        //         )
        //
        //
        //     })
        // })




})

    describe("assignGroupIdToGroupValuesAndUnits Specs",()=>{

        it("assignGroupIdToGroupValuesAndUnits",()=>{
            const groupUnits=[{'experiment_id':1,groupValues:[{"id":1}],"units":[{"id":1}]}]
            const groupIds=[1]
            const result = target.assignGroupIdToGroupValuesAndUnits(groupUnits,groupIds)
            result[0].groupValues[0].groupId.should.equal(1)
        })

        it("assignGroupIdToGroupValuesAndUnits and sets parentId to child groups",()=>{
            const groupUnits=[{'experiment_id':1,groupValues:[{"id":1}],"units":[{"id":1}],"childGroups":[{}]}]
            const groupIds=[1]
            const result = target.assignGroupIdToGroupValuesAndUnits(groupUnits,groupIds)
            result[0].groupValues[0].groupId.should.equal(1)
            result[0].childGroups[0].parentId.should.equal(1)
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
        it.skip("createExperimentalUnits",()=>{
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
                err.errorMessage.should.equal("Treatments not associated with same experiment")
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

    describe("validateGroups",()=>{

        let validateGroupStub
        before(()=>{
            validateGroupStub = sinon.stub(target, '_validateGroup')
        })

        afterEach(()=>{
            validateGroupStub.reset()
        })

        after(()=>{
            validateGroupStub.restore()
        })

        it('returns undefined for errors when the structure is validated',()=>{
            validateGroupStub.returns(undefined)
            const groupStructure = [{
                    id:1,
                    childGroups:[
                        {
                            id:2,
                            units:[{}]
                        }
                    ],
                    units:[]
                }
            ]

            _.isUndefined(target._validateGroups(groupStructure)).should.equal(true)
        })

        it('fails due to having units and child groups in one tier', ()=>{
            validateGroupStub.returns('testError')
            const groupStructure = [
                {
                    id:1,
                    childGroups:[
                        {
                            id:2,
                            units:[{}]
                        }
                    ],
                    units:[{}]
                },
                {
                    id:3,
                    childGroups:[],
                    units:[]
                }
            ]

            target._validateGroups(groupStructure).should.equal("testError")
            sinon.assert.calledOnce(validateGroupStub)
        })
    })

    describe("validateGroup",()=>{
        let validateGroupsStub

        before(()=>{
            validateGroupsStub = sinon.stub(target, '_validateGroups')
        })

        afterEach(()=>{
            validateGroupsStub.reset()
        })

        after(()=>{
            validateGroupsStub.restore()
        })

        it('returns an error when a group has both child groups and units', ()=>{
            const group = {units:[{}],childGroups:[{}]}

            target._validateGroup(group).should.equal("Only leaf childGroups should have units")
        })

        it('returns an error when a group has no child groups and no units', ()=>{
            const group = {units:[],childGroups:[]}

            target._validateGroup(group).should.equal("Each group should have at least one Unit or at least one ChildGroup")
        })

        it('calls validateGroups when group is valid and has child groups', ()=>{
            const group = {childGroups:[{}]}
            validateGroupsStub.returns('stubResponse')

            target._validateGroup(group).should.equal('stubResponse')
            sinon.assert.calledOnce(validateGroupsStub)
        })

        it('returns undefined when the group has no child groups and some units', ()=>{
            const group = {units:[{}]}

            _.isUndefined(target._validateGroup(group)).should.equal(true)
        })
    })

    describe("recursiveBatchCreate",()=>{
        let batchCreateGroupsStub
        let createGroupValuesUnitsAndChildGroupsStub

        before(()=>{
            batchCreateGroupsStub = sinon.stub(target._groupService, 'batchCreateGroups')
            createGroupValuesUnitsAndChildGroupsStub = sinon.stub(target, '_createGroupValuesUnitsAndChildGroups')
        })
        afterEach(()=>{
            batchCreateGroupsStub.reset()
            createGroupValuesUnitsAndChildGroupsStub.reset()
        })
        after(()=>{
            batchCreateGroupsStub.restore()
            createGroupValuesUnitsAndChildGroupsStub.restore()
        })

        it('successfully creates groups and calls createGroupValuesUnitsAndChildGroups', ()=>{
            batchCreateGroupsStub.resolves([])
            createGroupValuesUnitsAndChildGroupsStub.resolves({status: 200, message: "SUCCESS"})

            const groupPayload = [{
                units: [{}],
                childGroups: [{}],
                refRandomizationStrategyId: 1,
                groupValues: [{
                    repNumber: 1
                }]
            }]

            const expectedGroupOutput = [
                {
                    experimentId: 1,
                    refRandomizationStrategyId: 1
                }
            ]

            return target._recursiveBatchCreate(1,groupPayload,testContext,testTx).then((result)=>{
                result.should.deep.equal({status: 200, message: 'SUCCESS'})
                sinon.assert.calledWithExactly(batchCreateGroupsStub, expectedGroupOutput, testContext, testTx)
            })
        })
    })

    describe('createGroupValuesUnitsAndChildGroups',()=>{
        let batchCreateGroupValuesStub
        let createExperimentalUnitsStub
        let getUnitsAndGroupValues
        let recursiveBatchCreateStub

        before(()=>{
            batchCreateGroupValuesStub = sinon.stub(target._groupValueService, 'batchCreateGroupValues')
            createExperimentalUnitsStub = sinon.stub(target, '_createExperimentalUnits')
            getUnitsAndGroupValues = sinon.stub(target, '_getUnitsAndGroupValues')
            recursiveBatchCreateStub = sinon.stub(target, '_recursiveBatchCreate')
        })

        afterEach(()=>{
            batchCreateGroupValuesStub.reset()
            createExperimentalUnitsStub.reset()
            getUnitsAndGroupValues.reset()
            recursiveBatchCreateStub.reset()
        })
        after(()=>{
            batchCreateGroupValuesStub.restore()
            createExperimentalUnitsStub.restore()
            getUnitsAndGroupValues.restore()
            recursiveBatchCreateStub.restore()
        })

        it('sucessfully resolves after calling batchCreateGroupValues and recursiveBatchCreate',()=>{
            batchCreateGroupValuesStub.resolves()
            createExperimentalUnitsStub.resolves()
            getUnitsAndGroupValues.returns({groupValues: [{repNumber: 1}], units: [], childGroups:[{},{}]})
            recursiveBatchCreateStub.resolves()

            return target._createGroupValuesUnitsAndChildGroups(1, [], [], testContext, testTx).then(()=>{
                sinon.assert.calledWithExactly(batchCreateGroupValuesStub, [{repNumber: 1}], testContext, testTx)
                sinon.assert.calledWithExactly(recursiveBatchCreateStub, 1, [{},{}], testContext, testTx)
            })
        })

        it('sucessfully resolves after calling batchCreateGroupValues and createExperimentalUnits',()=> {
            batchCreateGroupValuesStub.resolves()
            createExperimentalUnitsStub.resolves()
            getUnitsAndGroupValues.returns({groupValues: [{repNumber: 1}], units: [{}, {}], childGroups: []})
            recursiveBatchCreateStub.resolves()

            return target._createGroupValuesUnitsAndChildGroups(1, [], [], testContext, testTx).then(() => {
                sinon.assert.calledWithExactly(batchCreateGroupValuesStub, [{repNumber: 1}], testContext, testTx)
                sinon.assert.calledWithExactly(createExperimentalUnitsStub, 1, [{}, {}], testContext, testTx)
            })
        })

        it('returns an empty promise after not calling any of the methods', ()=>{
            batchCreateGroupValuesStub.resolves()
            createExperimentalUnitsStub.resolves()
            getUnitsAndGroupValues.returns({groupValues: [], units: [], childGroups: []})
            recursiveBatchCreateStub.resolves()

            return target._createGroupValuesUnitsAndChildGroups(1, [], [], testContext, testTx).then(() => {
                sinon.assert.notCalled(batchCreateGroupValuesStub)
                sinon.assert.notCalled(createExperimentalUnitsStub)
                sinon.assert.notCalled(recursiveBatchCreateStub)
            })
        })
    })
})
