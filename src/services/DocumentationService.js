import _ from 'lodash'
import cf from 'aws-cloudfront-sign'
import HttpUtil from './utility/HttpUtil'
import VaultUtil from './utility/VaultUtil'
import config from '../../config'

class DocumentationService {
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
      const b = new Buffer(VaultUtil.cloudFrontPrivateKey, 'base64')
      options.privateKeyString = b.toString()
    }

    return cf.getSignedCookies(url, options)
  }
}

module.exports = DocumentationService
