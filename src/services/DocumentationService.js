import AWSUtil from './utility/AWSUtil'
import VaultUtil from './utility/VaultUtil'

const { setErrorCode } = require('@monsantoit/error-decorator')()

// Error Codes 14XXXX
class DocumentationService {
  @setErrorCode('142000')
  static getDoc(fileName) {
    return AWSUtil.getFileFromS3(VaultUtil.awsDocumentationBucketName, `documentation/${fileName}`)
      .then(result => result.Body.toString())
  }
}

module.exports = DocumentationService
