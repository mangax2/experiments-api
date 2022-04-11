const {
  AWS_REGION,
  NP_AWS_ACCOUNT_ID,
  NP_REPO_NAME,
  PROD_AWS_ACCOUNT_ID,
  PROD_FARGATE_STACK_NAME,
} = require('./build-constants')

module.exports = {
  appParameters: {
    cpu: '2048',
    memory: '4GB',
    appName: 'exp-api-prod',
    instanceCount: 6,
    healthCheckPath: '/ping',
    healthCheckGracePeriod: 25,
    loadBalancingAlgorithmType: 'least_outstanding_requests',
    taskRoleName: 'experiments-api-prod-role',
    environmentVars: {
      VAULT_ENV: 'prod',
    },
  },
  autoScaling: {
    enabled: true,
    maxInstances: 20,
    scalingPolicies: [
      {
        scaleBy: 'CPU',
        targetValue: 70,
        scaleInCooldown: 600,
        scaleOutCooldown: 60,
      },
      {
        scaleBy: 'Memory',
        targetValue: 50,
        scaleInCooldown: 300,
        scaleOutCooldown: 60,
      },
      {
        scaleBy: 'RequestCount',
        targetValue: 150,
        scaleInCooldown: 600,
        scaleOutCooldown: 60,
      },
    ],
  },
  aws: {
    accountId: PROD_AWS_ACCOUNT_ID,
    fargateStackName: PROD_FARGATE_STACK_NAME,
    region: AWS_REGION,
  },
  datadog: {
    enabled: true,
    apiKeyArn: `arn:aws:ssm:${AWS_REGION}:${PROD_AWS_ACCOUNT_ID}:parameter/datadog-api-key`,
    environment: 'prod',
  },
  docker: {
    image: `${NP_AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${NP_REPO_NAME}:${process.env.VERSION}`,
    ecrLifecyclePolicyFile: 'build-scripts/lifecycle-policy.json',
  },
}
