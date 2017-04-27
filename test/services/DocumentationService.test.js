import cf from 'aws-cloudfront-sign'
import { mock, mockResolve } from '../jestUtil'
import DocumentationService from '../../src/services/DocumentationService'
import config from '../../config'
import VaultUtil from '../../src/services/utility/VaultUtil'
import HttpUtil from '../../src/services/utility/HttpUtil'

describe('DocumentationService', () => {

  describe('getCloudFrontCookies', () => {
    it('returns cookies when they already exist and are not expired', () => {
      DocumentationService.cookies = {}
      DocumentationService.cookieExpire = 999999999999999
      cf.getSignedCookies = mock()

      expect(DocumentationService.getCloudfrontCookies()).toEqual({})
      expect(cf.getSignedCookies).not.toHaveBeenCalled()
    })

    it('calls getSignedCookie when cookies are undefined, and sets cookieExpire to 0 when it is' +
      ' undefined', () => {
      DocumentationService.cookies = undefined
      DocumentationService.cookieExpire = undefined

      cf.getSignedCookies = mock({})

      const result = DocumentationService.getCloudfrontCookies()

      expect(result).toEqual({})
      expect(cf.getSignedCookies).toHaveBeenCalled()
    })

    it('calls getSignedCookie for prod', () => {
      DocumentationService.cookies = undefined
      DocumentationService.cookieExpire = 999999999999999
      config.env = 'prod'
      VaultUtil.cloudFrontKeyPair = ''
      VaultUtil.cloudFrontSecret = ''
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
        expect(HttpUtil.get).toHaveBeenCalledWith('http://dcb6g58iy3guq.cloudfront.net/topic/image', headers)
      })
    })
  })

  describe('getDoc', () => {
    it('calls getCloudfrontCookies and HttpUtil get', () => {
      DocumentationService.getCloudfrontCookies = mock({header: 'value', header2: 'value2'})
      HttpUtil.get = mockResolve()
      const headers = [{headerName: 'Accept', headerValue: 'text/plain'}, {headerName: 'Cookie', headerValue: 'header=value; header2=value2'}]

      return DocumentationService.getDoc('topic', 'doc.md').then(() => {
        expect(HttpUtil.get).toHaveBeenCalledWith('http://dcb6g58iy3guq.cloudfront.net/topic/doc.md', headers)
      })
    })
  })
})