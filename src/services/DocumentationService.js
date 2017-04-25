import HttpUtil from './utility/HttpUtil'

class DocumentationService {
  static getImage() {
    const headers = [{
      headerName: 'Accept',
      headerValue: 'image/png',
    }]

    return HttpUtil.get('https://s3.amazonaws.com/cosmos-us-east-1-285453578300/documentation/velocity.png', headers)
  }
}

module.exports = DocumentationService
