const AWS = require('aws-sdk')

const invokeLambda = (lambda, params) => new Promise((resolve, reject) => {
  lambda.invoke(params, (error, data) => {
    if (error) {
      reject(error)
    } else if (data.FunctionError) {
      reject(data)
    } else {
      resolve(data)
    }
  })
})

class AWSUtil {
  configure = (accessKeyId, secretAccessKey) => {
    AWS.config.update({
      accessKeyId,
      secretAccessKey,
      region: 'us-east-1',
    })
  }

  callLambda = (functionName, payload, invocationType = 'RequestResponse') => {
    const lambda = this.createLambda()
    const params = {
      FunctionName: functionName,
      Payload: payload,
      InvocationType: invocationType,
    }

    return invokeLambda(lambda, params)
  }

  callLambdaLocal = /* istanbul ignore next */ (payload) => {
    const agent = require('superagent')
    return agent.post('http://localhost:4000/group-generation-lambda/local-test', payload).set('Content-Type', 'application/json')
  }

  createLambda = () => new AWS.Lambda()
}

module.exports = new AWSUtil()
