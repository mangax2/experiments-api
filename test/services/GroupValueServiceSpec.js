const sinon = require('sinon')
const chai = require('chai')
const GroupValueService = require('../../src/services/GroupValueService')
const Transactional = require('../../src/decorators/transactional')
const db = require('../../src/db/DbManager')

describe('GroupValueService', () => {
    const testData = {}
    const testPayload = {}
    const testResponse = {}
    const testError = {}
    const tx = {tx: {}}
    const testContext = {}

    let groupValueService
    let groupService

    let findAllByGroupIdStub
    let findAllByGroupIdsStub
    let findStub
    let createStub
    let updateStub
    let removeStub
    let batchRemoveStub

    let groupFindStub
    let groupFindBatchStub

    let transactionStub
    let validateStub

    before(() => {
        groupValueService = new GroupValueService()
        groupService = groupValueService._groupService

        findAllByGroupIdStub = sinon.stub(db.groupValue, 'findAllByGroupId')
        findAllByGroupIdsStub = sinon.stub(db.groupValue, 'batchFindAllByGroupIds')
        findStub = sinon.stub(db.groupValue, 'find')
        createStub = sinon.stub(db.groupValue, 'batchCreate')
        updateStub = sinon.stub(db.groupValue, 'batchUpdate')
        removeStub = sinon.stub(db.groupValue, 'remove')
        batchRemoveStub = sinon.stub(db.groupValue, 'batchRemove')

        groupFindStub = sinon.stub(groupService, 'getGroupById')
        groupFindBatchStub = sinon.stub(groupService, 'batchGetGroupsByIds')

        transactionStub = sinon.stub(db.groupValue, 'repository', () => {
            return {
                tx: function (transactionName, callback) {
                    return callback(tx)
                }
            }
        })
        validateStub = sinon.stub(groupValueService._validator, 'validate')

    })

    after(() => {
        findAllByGroupIdStub.restore()
        findAllByGroupIdsStub.restore()
        findStub.restore()
        createStub.restore()
        updateStub.restore()
        removeStub.restore()
        batchRemoveStub.restore()

        groupFindStub.restore()
        groupFindBatchStub.restore()

        transactionStub.restore()
        validateStub.restore()
    })

    afterEach(() => {
        findAllByGroupIdStub.reset()
        findAllByGroupIdsStub.reset()
        findStub.reset()
        createStub.reset()
        updateStub.reset()
        removeStub.reset()
        batchRemoveStub.reset()

        groupFindStub.reset()
        groupFindBatchStub.reset()

        transactionStub.reset()
        validateStub.reset()
    })

    describe('batchCreateGroupValues', ()=>{
        it('calls groupValue repo with the values', ()=>{
            validateStub.resolves()
            createStub.resolves([{id: 1}])

            const groupValues = [{name: 'testFactor', value: 'testLevel', groupId: 1}]
            return groupValueService.batchCreateGroupValues(groupValues, testContext, tx).then((result)=>{
                sinon.assert.calledWith(validateStub, groupValues)
            })
        })

        it('does not call groupValue repo when validation fails', ()=>{
            validateStub.rejects()

            return groupValueService.batchCreateGroupValues([], testContext, tx).should.be.rejected.then((err)=>{
                createStub.called.should.equal(false)
            })
        })
    })

    describe('getGroupValuesByGroupId', ()=>{
        it('returns group values for a particular group', ()=>{
            let expectedResponse = [{id: 1, name: 'testFactor', value: 'testLevel', groupId: 1}]

            groupFindStub.resolves({id: 1})
            findAllByGroupIdStub.resolves(expectedResponse)

            return groupValueService.getGroupValuesByGroupId(1, tx).then((results)=>{
                results.should.equal(expectedResponse)
            })
        })

        it('fails to get group by group id, and does not call findAllByGroupId', ()=>{
            groupFindStub.rejects()

            return groupValueService.getGroupValuesByGroupId(1, tx).should.be.rejected.then(()=>{
                findAllByGroupIdStub.called.should.equal(false)
            })
        })

        it('fails to get group values', ()=>{
            groupFindStub.resolves({id:1})
            findAllByGroupIdStub.rejects()

            return groupValueService.getGroupValuesByGroupId(1,tx).should.be.rejected.then(()=>{
                findAllByGroupIdStub.called.should.equal(true)
            })

        })
    })

    describe('batchGetGroupValuesByGroupIds', ()=>{
        it('returns group values for all groups provided', ()=>{
            const response = [[{groupId: 1, name: "repNumber", value: "1"},{groupId: 1, name: "repNumber", value: "2"}],[{groupId: 2, name: 'testFactor', value: 'testLevel'}, {groupId: 2, name: 'testFactor2', value: 'testLevel2'}]]
            groupFindBatchStub.resolves([{id: 1}, {id:2}])
            findAllByGroupIdsStub.resolves(response)

            return groupValueService.batchGetGroupValuesByGroupIds([1,2], tx).then((values)=>{
                groupFindBatchStub.called.should.equal(true)
                findAllByGroupIdsStub.called.should.equal(true)
                values.should.equal(response)
            })
        })

        it('fails to get all groups and does not call group value repo', ()=>{
            groupFindBatchStub.rejects()

            return groupValueService.batchGetGroupValuesByGroupIds([1,2],tx).should.be.rejected.then((err)=>{
                findAllByGroupIdsStub.called.should.equal(false)
            })
        })

        it('fails to get all group values', ()=>{
            groupFindBatchStub.resolves([{id: 1}, {id: 2}])
            findAllByGroupIdsStub.rejects()

            return groupValueService.batchGetGroupValuesByGroupIds([1,2],tx).should.be.rejected
        })
    })

    describe('batchGetGroupValuesByGroupIdsNoValidate', ()=>{
        it('returns group values',()=>{
            let response = [[{groupId:1,name: "repNumber", value:"1"},{groupId:1,name: "repNumber", value: "2"}]]
            findAllByGroupIdsStub.resolves(response)
            return groupValueService.batchGetGroupValuesByGroupIdsNoValidate([1,2],tx).then((value)=>{
                value.should.equal(response)
            })
        })

        it('fails to get group values',()=>{
            findAllByGroupIdsStub.rejects()
            return groupValueService.batchGetGroupValuesByGroupIdsNoValidate([1,2],tx).should.be.rejected
        })
    })

    describe('getGroupValueById',()=>{
        it('finds a group value by id', ()=>{
            findStub.resolves({id: 1, name: 'testFactor', value: 'testLevel', groupId: 1})

            return groupValueService.getGroupValueById(1,tx).then((value)=>{
                value.id.should.equal(1)
                value.name.should.equal('testFactor')
                value.value.should.equal('testLevel')
                value.groupId.should.equal(1)
            })
        })

        it('finds no group value', ()=>{
            findStub.resolves(null)

            return groupValueService.getGroupValueById(1,tx).should.be.rejectedWith('Group Value Not Found for requested id')
        })

        it('fails to get a group value', ()=>{
            findStub.rejects()

            return groupValueService.getGroupValueById(1,tx).should.be.rejected
        })
    })

    describe('batchUpdateGroupValues',()=>{
        it('updates group values',()=>{
            let response = [{id:1, message: 'Resource updated', status: 200},{id:2, message:'Resource updated', status:200}]
            validateStub.resolves()
            updateStub.resolves([{id: 1, name: 'factor1', value: 'testLevel', groupId: 1},{id:2,name:'factor2',value:'level2', groupId:1}])

            return groupValueService.batchUpdateGroupValues([{id:1,name:'factor1',value:'testLevel', groupId: 1},{id:2, name:'factor2',value:'level2', groupId:1}],testContext,tx).then((value)=>{
                value.should.deep.equal(response)
            })
        })

        it('fails to validate group values', ()=>{
            validateStub.rejects()

            return groupValueService.batchUpdateGroupValues([{id:1}],testContext,tx).should.be.rejected.then(()=>{
                updateStub.called.should.equal(false)
            })
        })

        it('fails to update group values', ()=>{
            validateStub.resolves()
            updateStub.rejects()

            return groupValueService.batchUpdateGroupValues([{id:1}],testContext,tx).should.be.rejected
        })
    })

    describe('deleteGroupValue',()=>{
        it('deletes a group value',()=>{
            removeStub.resolves(1)

            return groupValueService.deleteGroupValue(1,tx).then((value)=>{
                value.should.equal(1)
            })
        })

        it('does not find a group value to delete', ()=>{
            removeStub.resolves(null)

            return groupValueService.deleteGroupValue(1,tx).should.be.rejectedWith('Group Value Not Found for requested id')
        })

        it('fails to delete a group value', ()=>{
            removeStub.rejects()

            return groupValueService.deleteGroupValue(1,tx).should.be.rejected
        })
    })

    describe('batchDeleteGroupValues',()=>{
        it('deletes all group values provided', ()=>{
            batchRemoveStub.resolves([1,2])

            return groupValueService.batchDeleteGroupValues([1,2],tx).then((value)=>{
                value.should.deep.equal([1,2])
            })
        })

        it('deletes some of the group values provided', ()=>{
            batchRemoveStub.resolves([1,null])

            return groupValueService.batchDeleteGroupValues([1,2],tx).should.be.rejectedWith('Not all group values requested for delete were found')
        })

        it('fails to delete group values', ()=>{
            batchRemoveStub.rejects()

            return groupValueService.batchDeleteGroupValues([1,2],tx).should.be.rejected
        })

    })
})