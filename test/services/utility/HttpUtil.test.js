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
})

