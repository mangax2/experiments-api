import { mockResolve } from '../jestUtil'
import DocumentationService from '../../src/services/DocumentationService'
import AWSUtil from '../../src/services/utility/AWSUtil'

describe('DocumentationService', () => {
  describe('getDoc', () => {
    test('calls getFileFromS3 and returns the body', () => {
      AWSUtil.getFileFromS3 = mockResolve({ Body: 'sample file contents' })

      return DocumentationService.getDoc('doc.md').then((result) => {
        expect(AWSUtil.getFileFromS3).toHaveBeenCalledWith('bucketName', 'documentation/experiments/doc.md')
        expect(result).toEqual('sample file contents')
      })
    })
  })
})
