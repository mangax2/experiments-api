import configurator from '../configs/configurator'
import AWSUtil from './utility/AWSUtil'

const aws = configurator.get('aws')
const { setErrorCode } = require('@monsantoit/error-decorator')()

// Error Codes 14XXXX
class DocumentationService {
  @setErrorCode('142000')
  static getDoc(fileName) {
    return AWSUtil.getFileFromS3(aws.documentationBucketName, `documentation/experiments/${fileName}`)
      .then(result => result.Body.toString())
  }
}

module.exports = DocumentationService
