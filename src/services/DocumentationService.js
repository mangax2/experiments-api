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

    return HttpUtil.get(`http://dcb6g58iy3guq.cloudfront.net/${topic}/${imageName}`, headers)
  }

  static getDoc(topic, fileName) {
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

    return HttpUtil.get(`http://dcb6g58iy3guq.cloudfront.net/${topic}/${fileName}`, headers)
  }

  static getCloudfrontCookies() {
    const keyPairId = config.env === 'local' ? 'APKAIDNVPE572RTKAYCQ' : VaultUtil.cloudFrontKeyPair
    const privateKeyPath = config.env === 'local' ? `./src/pk-${keyPairId}.pem` : undefined
    const privateKeyString = config.env === 'local' ? undefined : VaultUtil.cloudFrontSecret
    const url = config.env === 'prod' ? '' : 'http://dcb6g58iy3guq.cloudfront.net/*'

    const options = {
      expireTime: new Date().getTime() + (4 * 60 * 60 * 1000),
      keypairId: keyPairId,
    }

    if (privateKeyPath) {
      console.info('This should not be getting hit!')
      options.privateKeyPath = privateKeyPath
    } else {
      options.privateKeyString = privateKeyString
      options.privateKeyString.replace(/\\n/g, '\n')
    }

    console.info(options)
    console.info(privateKeyString)

    return cf.getSignedCookies(url, options)
  }
}

module.exports = DocumentationService
