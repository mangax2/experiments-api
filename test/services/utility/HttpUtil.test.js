import { mock } from '../../jestUtil'
import agent from 'superagent'
import HttpUtil from '../../../src/services/utility/HttpUtil'

describe('HttpUtil', () => {

  describe('setHeaders', () => {
    it('sets headers of the httpCall', () => {
      const httpCall = {set: mock()}

      HttpUtil.setHeaders(httpCall, [
        {headerName: 'testHeader', headerValue: 'testValue'},
        {headerName: 'testHeader2', headerValue: 'testValue2'}
        ])

      expect(httpCall.set).toHaveBeenCalledTimes(2)
      expect(httpCall.set).lastCalledWith('testHeader2', 'testValue2')
    })
  })

  describe('get', () => {
    it('calls setHeaders and agent.get', () => {
      HttpUtil.setHeaders = mock()
      agent.get = mock({})

      HttpUtil.get('testUrl', [])

      expect(HttpUtil.setHeaders).toHaveBeenCalledWith({}, [])
      expect(agent.get).toHaveBeenCalledWith('testUrl')
    })
  })

  describe('post', () => {
    it('calls setHeaders and agent.post', () => {
      const httpCall = {send: mock()}
      HttpUtil.setHeaders = mock(httpCall)
      agent.post = mock({})

      HttpUtil.post('testUrl', [], {})

      expect(HttpUtil.setHeaders).toHaveBeenCalledWith({}, [])
      expect(agent.post).toHaveBeenCalledWith('testUrl')
      expect(httpCall.send).toHaveBeenCalledWith({})
    })
  })

  describe('put', () => {
    it('calls setHeaders and agent.put', () => {
      const httpCall = {send: mock()}
      HttpUtil.setHeaders = mock(httpCall)
      agent.put = mock({})

      HttpUtil.put('testUrl', [], {})

      expect(HttpUtil.setHeaders).toHaveBeenCalledWith({}, [])
      expect(agent.put).toHaveBeenCalledWith('testUrl')
      expect(httpCall.send).toHaveBeenCalledWith({})
    })
  })

  describe('delete', () => {
    it('calls setHeaders and agent.put', () => {
      const httpCall = {send: mock()}
      HttpUtil.setHeaders = mock(httpCall)
      agent.delete = mock({})

      HttpUtil.delete('testUrl', [])

      expect(HttpUtil.setHeaders).toHaveBeenCalledWith({}, [])
      expect(agent.delete).toHaveBeenCalledWith('testUrl')
    })
  })

  describe('getErrorMessageForLogs', () => {
    it('returns Unauthorized if status is 401', () => {
      expect(HttpUtil.getErrorMessageForLogs({status: 401})).toEqual('Unauthorized')
    })

    it('returns Unable to retrieve error message if err is not defined', () => {
      expect(HttpUtil.getErrorMessageForLogs()).toEqual('Unable to retrieve error message.')
    })

    it('returns an array of error messages', () => {
      const err = {response: {text: '[{"errorMessage": "test"},{"errorMessage": "test2"}]'}}

      expect(HttpUtil.getErrorMessageForLogs(err)).toEqual('test,test2')
    })

    it('returns errorMessage', () => {
      expect(HttpUtil.getErrorMessageForLogs({response: {text: '{"errorMessage": "test"}'}})).toEqual('test')
    })

    it('returns default if error is not array, nor is errorMessage defined', () => {
      expect(HttpUtil.getErrorMessageForLogs({response: {text: '{}'}})).toEqual('Unable to retrieve error message.')
    })

    it('returns default if error has no response', () => {
      expect(HttpUtil.getErrorMessageForLogs({})).toEqual('Unable to retrieve error message.')
    })
  })
})

