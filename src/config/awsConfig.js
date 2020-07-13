const localAwsConfig = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  lambdaName: 'cosmos-group-generation-lambda-dev',
}
const awsConfig = process.env.AWS_CONFIG
  ? JSON.parse(process.env.AWS_CONFIG)
  : localAwsConfig

export default awsConfig
