import _ from 'lodash'
import cf from 'aws-cloudfront-sign'
import HttpUtil from './utility/HttpUtil'
import VaultUtil from './utility/VaultUtil'
import config from '../../config'
import { setErrorCode } from '../decorators/setErrorDecorator'

// Error Codes 14XXXX
class DocumentationService {
  @setErrorCode('141000')
  static getImage(topic, imageName) {
    const cookies = DocumentationService.getCloudfrontCookies()

    const cloudFrontCookies = _.map(cookies, (value, key) => `${key}=${value}`)
    const joinedCookies = cloudFrontCookies.join('; ')

    const headers = [{
      headerName: 'Accept',
      headerValue: 'image/png',
    },
    {
      headerName: 'Cookie',
      headerValue: joinedCookies,
    }]

    return HttpUtil.get(`http://dcb6g58iy3guq.cloudfront.net/experiments/images/${topic}/${imageName}`, headers)
  }

  @setErrorCode('142000')
  static getDoc(fileName) {
    const cookies = DocumentationService.getCloudfrontCookies()

    const cloudFrontCookies = _.map(cookies, (value, key) => `${key}=${value}`)
    const joinedCookies = cloudFrontCookies.join('; ')

    const headers = [{
      headerName: 'Accept',
      headerValue: 'text/markdown',
    },
    {
      headerName: 'Cookie',
      headerValue: joinedCookies,
    }]

    return HttpUtil.get(`http://dcb6g58iy3guq.cloudfront.net/experiments/${fileName}`, headers)
  }

  @setErrorCode('143000')
  static getCloudfrontCookies() {
    const keyPairId = config.env === 'local' ? 'APKAIDNVPE572RTKAYCQ' : VaultUtil.cloudFrontKeyPair
    const url = config.env === 'local' ? 'http://dcb6g58iy3guq.cloudfront.net/*' : VaultUtil.cloudFrontUrl

    const options = {
      expireTime: new Date().getTime() + (4 * 60 * 60 * 1000),
      keypairId: keyPairId,
    }

    if (config.env === 'local') {
      options.privateKeyPath = `./src/pk-${keyPairId}.pem`
    } else {
      const b = Buffer.from(VaultUtil.cloudFrontPrivateKey, 'base64')
      options.privateKeyString = b.toString()
    }

    return cf.getSignedCookies(url, options)
  }
}

module.exports = DocumentationService
