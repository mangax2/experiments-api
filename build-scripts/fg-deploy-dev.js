const {
  AWS_REGION,
  NP_AWS_ACCOUNT_ID,
  NP_FARGATE_STACK_NAME,
} = require('./build-constants')

module.exports = {
  appParameters: {
    cpu: '512',
    memory: '4GB',
    appName: 'exp-api-dev',
    instanceCount: 2,
    healthCheckPath: '/ping',
    healthCheckGracePeriod: 25,
    loadBalancingAlgorithmType: 'least_outstanding_requests',
    taskRoleName: 'experiments-api-dev-role',
    environmentVars: {
      VAULT_ENV: 'dev',
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
    accountId: NP_AWS_ACCOUNT_ID,
    fargateStackName: NP_FARGATE_STACK_NAME,
    region: AWS_REGION,
  },
  datadog: {
    enabled: true,
    apiKeyArn: `arn:aws:ssm:${AWS_REGION}:${NP_AWS_ACCOUNT_ID}:parameter/datadog-api-key`,
    environment: 'develop',
  },
  docker: {
    ecrLifecyclePolicyFile: 'build-scripts/lifecycle-policy.json',
  },
}
