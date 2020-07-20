import AWS from 'aws-sdk'
import { mock } from '../../jestUtil'
import AWSUtil from '../../../src/services/utility/AWSUtil'

describe('AWSUtil', () => {
  describe('createLambda', () => {
    test('creates an AWS.Lambda object', () => {
      expect(AWSUtil.createLambda()).toBeInstanceOf(AWS.Lambda)
    })
  })

  describe('createS3', () => {
    test('creates an AWS.S3 object', () => {
      expect(AWSUtil.createS3()).toBeInstanceOf(AWS.S3)
    })
  })

  describe('configure', () => {
    test('calls AWS.config.update with the parameters', () => {
      AWS.config.update = mock()

      AWSUtil.configure('key', 'secret')

      expect(AWS.config.update).toBeCalledWith({ accessKeyId: 'key', secretAccessKey: 'secret', region: 'us-east-1' })
    })
  })

  describe('callLambda', () => {
    test('calls the lambda with the correct parameters and returns the response', () => {
      let sentParams
      AWSUtil.createLambda = mock({
        invoke: (params, callback) => {
          sentParams = params
          callback(undefined, { data: 'present' })
        },
      })

      return AWSUtil.callLambda('name', 'payload', 'notRequestResponse').then((data) => {
        expect(sentParams).toEqual({
          FunctionName: 'name',
          Payload: 'payload',
          InvocationType: 'notRequestResponse',
        })
        expect(data).toEqual({ data: 'present' })
      })
    })

    test('rejects with the error if the lambda returns an error', () => {
      AWSUtil.createLambda = mock({ invoke: (params, callback) => callback({ errorMessage: 'error' }) })

      return AWSUtil.callLambda().catch((error) => {
        expect(error).toEqual({ errorMessage: 'error' })
      })
    })

    test('rejects with the data if the lambda returns a data with a FuncationError ', () => {
      AWSUtil.createLambda = mock({ invoke: (params, callback) => callback(undefined, { FunctionError: 'error' }) })

      return AWSUtil.callLambda().catch((error) => {
        expect(error).toEqual({ FunctionError: 'error' })
      })
    })
  })

  describe('getFileFromS3', () => {
    test('calls the s3 with the correct parameters and returns the response', () => {
      let sentParams
      AWSUtil.createS3 = mock({
        getObject: (params, callback) => {
          sentParams = params
          callback(undefined, { Body: 'present' })
        },
      })

      return AWSUtil.getFileFromS3('bucket', 'path').then((data) => {
        expect(sentParams).toEqual({
          Bucket: 'bucket',
          Key: 'path',
        })
        expect(data).toEqual({ Body: 'present' })
      })
    })

    test('rejects with the error if the s3 returns an error', () => {
      AWSUtil.createS3 = mock({ getObject: (params, callback) => callback({ errorMessage: 'error' }) })

      return AWSUtil.getFileFromS3().catch((error) => {
        expect(error).toEqual({ errorMessage: 'error' })
      })
    })
  })
})
