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
      headerValue: 'text/plain',
    },
    {
      headerName: 'Cookie',
      headerValue: joinedCookies,
    }]

    return HttpUtil.get(`http://dcb6g58iy3guq.cloudfront.net/${topic}/${fileName}`, headers)
  }

  static getCloudfrontCookies() {
    if (!this.cookieExpire) {
      this.cookieExpire = 0
    }

    if (!this.cookies || new Date().getTime() > this.cookieExpire) {
      // const cloudfrontSubdomain = config.env === 'prod' ? 'd3bzd7kp2f0z7x' :  'd314r7pqlabn8g'
      // const cloudfrontHostname = config.env === 'prod'
      // ? 'streaming-cf.velocity.ag'
      // : 'streaming-cf.velocity-np.ag'
      // const cookieDomain = config.env === 'prod' ? '.velocity.ag' : '.velocity-np.ag'
      // const keypairId = config.env === 'prod' ? 'APKAIHRRFBXPNPA3BWNQ' : 'APKAIDNVPE572RTKAYCQ'

      const keyPairId = config.env === 'local' ? 'APKAIDNVPE572RTKAYCQ' : VaultUtil.cloudFrontKeyPair
      const privateKeyPath = config.env === 'local' ? `./src/pk-${keyPairId}.pem` : undefined
      const privateKeyString = config.env === 'local' ? undefined : VaultUtil.cloudFrontSecret
      const url = config.env === 'prod' ? '' : 'http://dcb6g58iy3guq.cloudfront.net/*'

      const options = {
        expireTime: new Date().getTime() + (4 * 60 * 60 * 1000),
        keypairId: keyPairId,
      }

      if (privateKeyPath) {
        options.privateKeyPath = privateKeyPath
      } else {
        options.privateKeyString = privateKeyString
      }

      const signedCookies = cf.getSignedCookies(url, options)

      this.cookies = signedCookies
      // Set expire time for 3 hours even though signed cookie lives for 4. For safety
      this.cookieExpire = new Date().getTime() + (3 * 60 * 60 * 1000)
      return signedCookies
    }
    return this.cookies
  }

}

module.exports = DocumentationService
