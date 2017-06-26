import cf from 'aws-cloudfront-sign'
import { mock, mockResolve } from '../jestUtil'
import DocumentationService from '../../src/services/DocumentationService'
import config from '../../config'
import VaultUtil from '../../src/services/utility/VaultUtil'
import HttpUtil from '../../src/services/utility/HttpUtil'

describe('DocumentationService', () => {

  describe('getCloudFrontCookies', () => {
    it('calls getSignedCookie' +
      ' undefined', () => {
      config.env = 'local'
      VaultUtil.cloudFrontKeyPair = ''
      VaultUtil.cloudFrontSecret = ''
      cf.getSignedCookies = mock({})

      const result = DocumentationService.getCloudfrontCookies()

      expect(result).toEqual({})
      expect(cf.getSignedCookies).toHaveBeenCalled()
    })

    it('calls getSignedCookie for prod', () => {
      config.env = 'prod'
      VaultUtil.cloudFrontKeyPair = ''
      VaultUtil.cloudFrontPrivateKey = ''
      cf.getSignedCookies = mock({})

      const result = DocumentationService.getCloudfrontCookies()
      expect(result).toEqual({})
      expect(cf.getSignedCookies).toHaveBeenCalled()
    })
  })

  describe('getImage', () => {
    it('calls getCloudfrontCookies and HttpUtil get', () => {
      DocumentationService.getCloudfrontCookies = mock({header: 'value', header2: 'value2'})
      HttpUtil.get = mockResolve()
      const headers = [{headerName: 'Accept', headerValue: 'image/png'}, {headerName: 'Cookie', headerValue: 'header=value; header2=value2'}]

      return DocumentationService.getImage('topic', 'image').then(() => {
        expect(HttpUtil.get).toHaveBeenCalledWith('http://dcb6g58iy3guq.cloudfront.net/experiments/images/topic/image', headers)
      })
    })
  })

  describe('getDoc', () => {
    it('calls getCloudfrontCookies and HttpUtil get', () => {
      DocumentationService.getCloudfrontCookies = mock({header: 'value', header2: 'value2'})
      HttpUtil.get = mockResolve()
      const headers = [{headerName: 'Accept', headerValue: 'text/markdown'}, {headerName: 'Cookie', headerValue: 'header=value; header2=value2'}]

      return DocumentationService.getDoc('doc.md').then(() => {
        expect(HttpUtil.get).toHaveBeenCalledWith('http://dcb6g58iy3guq.cloudfront.net/experiments/doc.md', headers)
      })
    })
  })
})