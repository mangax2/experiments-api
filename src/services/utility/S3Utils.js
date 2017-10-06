import AWS from './AWSConfig'

const s3 = new AWS.S3({ apiVersion: '2006-03-01' })

export default ({ Bucket, Key }) => s3.getObject({ Bucket, Key }).promise()

