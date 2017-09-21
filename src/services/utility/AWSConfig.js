import AWS from 'aws-sdk'
import config from '../../../config'

AWS.config.update({
  accessKeyId: config.AWS_ACCESS_KEY_ID,
  secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
  region: 'us-east-1',
})

export default AWS
