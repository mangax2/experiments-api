import cf from 'aws-cloudfront-sign'
import HttpUtil from './utility/HttpUtil'
// import config from '../../config'

class DocumentationService {
  static getImage(topic, imageName) {
    // const cookies = DocumentationService.setCloudfrontCookies()

    const headers = [{
      headerName: 'Accept',
      headerValue: 'image/png',
    },
    {
      headerName: 'Cookie',
      headerValue: 'CloudFront-Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiZGNiNmc1OGl5M2d1cS5jbG91ZGZyb250Lm5ldC8qIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNDkzMjQ2OTI5fX19XX0_; CloudFront-Signature=AugN8SfXx7QoUP-6TXjoBTy3KSYs7VO99ckQewm0CAQBRtuA-8JoirXNP5WYZnstTNOeWmdudAkrobok7F-dgivVKSxlsWspqOAuXaWWR7PfQeyUP4Fo1YTXL2dy5rY7ICTNWXA5o-WG6biQHCG~LdAiM4JXaqUPeIywamZGEU0WJYObuUh42-C2UlwTbXRE1lIEKLmz-HWOMo~vS8anNOj5OAG-5rZMo1hYkdjglAU3o6OYdP1RSj57gR~5jBwJM73Xr0-6qFyjpOeEEvHJ8HzL3t7Fz2R2wLnLQ1b1vp-t9y6-IlEsepJmXwr4lefVAhB8LtUJvxCeAbqR8YGwoA__; CloudFront-Key-Pair-Id=APKAIDNVPE572RTKAYCQ',
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
