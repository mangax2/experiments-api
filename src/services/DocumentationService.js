import _ from 'lodash'
import cf from 'aws-cloudfront-sign'
import HttpUtil from './utility/HttpUtil'
// import config from '../../config'

class DocumentationService {
  static getImage(topic, imageName) {
    const cookies = DocumentationService.setCloudfrontCookies()

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

    return HttpUtil.get(`http://dcb6g58iy3guq.cloudfront.net/${imageName}`, headers)
  }

  static getDoc(topic) {
    const headers = [{
      headerName: 'Accept',
      headerValue: 'text/plain',
    }]

    return HttpUtil.get(`https://s3.amazonaws.com/cosmos-us-east-1-285453578300/documentation/${topic}/DefineVariables.md`, headers)
  }

  static setCloudfrontCookies() {
    // const cloudfrontSubdomain = config.env === 'prod' ? 'd3bzd7kp2f0z7x' :  'd314r7pqlabn8g'
    // const cloudfrontHostname = config.env === 'prod'
    // ? 'streaming-cf.velocity.ag'
    // : 'streaming-cf.velocity-np.ag'
    // const cookieDomain = config.env === 'prod' ? '.velocity.ag' : '.velocity-np.ag'
    // const keypairId = config.env === 'prod' ? 'APKAIHRRFBXPNPA3BWNQ' : 'APKAIDNVPE572RTKAYCQ'
    // console.info(res)

    // const urlName = 'dcb6g58iy3guq.cloudfront.net/*'
    // const options = {
    //   expireTime: new Date().getTime() + (4 * 60 * 60 * 1000),
    //   keypairId: 'APKAIDNVPE572RTKAYCQ',
    //  privateKeyPath: '/Users/kmccl/projects/ghe/experiments-api/src/pk-APKAIDNVPE572RTKAYCQ.pem',
    // }
    // const signedCookies = cf.getSignedCookies(urlName, options)

    const urlName = 'http://dcb6g58iy3guq.cloudfront.net/*'
    const options = {
      expireTime: new Date().getTime() + (4 * 60 * 60 * 1000),
      keypairId: 'APKAIDNVPE572RTKAYCQ',
      privateKeyPath: '/Users/kmccl/projects/ghe/experiments-api/src/pk-APKAIDNVPE572RTKAYCQ.pem',
    }
    const signedCookies = cf.getSignedCookies(urlName, options)

    // console.log(signedCookies)

    // for (const cookieId in signedCookies) {
    //   console.log(cookieId)
      // res.cookie(cookieId, signedCookies[cookieId], {
      //   domain: cookieDomain,
      //   path: cookiePath,
        // secure: true,
        // httpOnly: true,
      // })
    // }

    return signedCookies

    // console.log(signedCookies)
  }
}

module.exports = DocumentationService
