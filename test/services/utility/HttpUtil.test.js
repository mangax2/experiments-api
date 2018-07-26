import agent from 'superagent'
import { mock, mockResolve, mockReject } from '../../jestUtil'
import HttpUtil from '../../../src/services/utility/HttpUtil'

describe('HttpUtil', () => {
  beforeEach(() => {
    expect.hasAssertions()
  })

  describe('setHeaders', () => {
    test('sets headers of the httpCall', () => {
      const httpCall = { set: mock() }

      HttpUtil.setHeaders(httpCall, [
        { headerName: 'testHeader', headerValue: 'testValue' },
        { headerName: 'testHeader2', headerValue: 'testValue2' },
      ])

      expect(httpCall.set).toHaveBeenCalledTimes(2)
      expect(httpCall.set).lastCalledWith('testHeader2', 'testValue2')
    })
  })

  describe('get', () => {
    test('calls setHeaders and agent.get', () => {
      HttpUtil.setHeaders = mockResolve()
      agent.get = mock({})

      HttpUtil.get('testUrl', [])

      expect(HttpUtil.setHeaders).toHaveBeenCalledWith({}, [])
      expect(agent.get).toHaveBeenCalledWith('testUrl')
    })
  })

  describe('getWithRetry', () => {
    test('calls setHeaders and agent.get', () => {
      HttpUtil.setHeaders = mockResolve()
      agent.get = mock({})

      return HttpUtil.getWithRetry('testUrl', []).then(() => {
        expect(HttpUtil.setHeaders).toHaveBeenCalledWith({}, [])
        expect(agent.get).toHaveBeenCalledWith('testUrl')
      })
    })

    test('calls setHeaders 3 times in case of error', () => {
      HttpUtil.setHeaders = mockReject('error')
      agent.get = mock({})

      return HttpUtil.getWithRetry('testUrl', []).then(() => {}, (error) => {
        expect(HttpUtil.setHeaders).toHaveBeenCalledWith({}, [])
        expect(agent.get).toHaveBeenCalledWith('testUrl')
        expect(agent.get.mock.calls.length).toBe(3)
        expect(error).toBe('error')
      })
    })
  })

  describe('patch', () => {
    test('calls setHeaders and agent.patch', () => {
      const httpCall = { send: mockResolve() }
      HttpUtil.setHeaders = mock(httpCall)
      agent.patch = mock({})

      HttpUtil.patch('testUrl', [], {})

      expect(HttpUtil.setHeaders).toHaveBeenCalledWith({}, [])
      expect(agent.patch).toHaveBeenCalledWith('testUrl')
      expect(httpCall.send).toHaveBeenCalledWith({})
    })
  })

  describe('post', () => {
    test('calls setHeaders and agent.post', () => {
      const httpCall = { send: mockResolve() }
      HttpUtil.setHeaders = mock(httpCall)
      agent.post = mock({})

      HttpUtil.post('testUrl', [], {})

      expect(HttpUtil.setHeaders).toHaveBeenCalledWith({}, [])
      expect(agent.post).toHaveBeenCalledWith('testUrl')
      expect(httpCall.send).toHaveBeenCalledWith({})
    })
  })

  describe('put', () => {
    test('calls setHeaders and agent.put', () => {
      const httpCall = { send: mockResolve() }
      HttpUtil.setHeaders = mock(httpCall)
      agent.put = mock({})

      HttpUtil.put('testUrl', [], {})

      expect(HttpUtil.setHeaders).toHaveBeenCalledWith({}, [])
      expect(agent.put).toHaveBeenCalledWith('testUrl')
      expect(httpCall.send).toHaveBeenCalledWith({})
    })
  })

  describe('delete', () => {
    test('calls setHeaders and agent.put', () => {
      const httpCall = { send: mock() }
      HttpUtil.setHeaders = mockResolve(httpCall)
      agent.delete = mock({})

      HttpUtil.delete('testUrl', [])

      expect(HttpUtil.setHeaders).toHaveBeenCalledWith({}, [])
      expect(agent.delete).toHaveBeenCalledWith('testUrl')
    })
  })

  describe('getErrorMessageForLogs', () => {
    test('returns Unauthorized if status is 401', () => {
      expect(HttpUtil.getErrorMessageForLogs({ status: 401 })).toEqual('Unauthorized')
    })

    test('returns Unable to retrieve error message if err is not defined', () => {
      expect(HttpUtil.getErrorMessageForLogs()).toEqual('Unable to retrieve error message.')
    })

    test('returns an array of error messages', () => {
      const err = { response: { text: '[{"errorMessage": "test"},{"errorMessage": "test2"}]' } }

      expect(HttpUtil.getErrorMessageForLogs(err)).toEqual('test,test2')
    })

    test('returns errorMessage', () => {
      expect(HttpUtil.getErrorMessageForLogs({ response: { text: '{"errorMessage": "test"}' } })).toEqual('test')
    })

    test('returns default if error is not array, nor is errorMessage defined', () => {
      expect(HttpUtil.getErrorMessageForLogs({ response: { text: '{}' } })).toEqual('Unable to retrieve error message.')
    })

    test('returns default if error has no response', () => {
      expect(HttpUtil.getErrorMessageForLogs({})).toEqual('Unable to retrieve error message.')
    })
  })
})
