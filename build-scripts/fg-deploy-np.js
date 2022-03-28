const {
  AWS_REGION,
  NP_AWS_ACCOUNT_ID,
  NP_FARGATE_STACK_NAME,
  NP_REPO_NAME,
} = require('./build-constants')
const packageJSON = require('../package.json')

const coreConfig = {
  appParameters: {
    cpu: '512',
    memory: '4GB',
    appName: NP_REPO_NAME,
    instanceCount: 6,
    healthCheckPath: '/ping',
    healthCheckGracePeriod: 25,
    taskRoleName: 'experiments-api-np-role',
    environmentVars: {
      VAULT_ENV: 'np',
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
          scaleBy: 'RequestCount',
          targetValue: 100,
          scaleInCooldown: 600,
          scaleOutCooldown: 60,
        },
      ],
    },
  },
  aws: {
    accountId: NP_AWS_ACCOUNT_ID,
    fargateStackName: NP_FARGATE_STACK_NAME,
    region: AWS_REGION,
  },
  datadog: {
    enabled: true,
    apiKeyArn: `arn:aws:ssm:${AWS_REGION}:${NP_AWS_ACCOUNT_ID}:parameter/datadog-api-key`,
    environment: 'nonprod',
  },
  docker: {
    ecrPolicyFile: 'build-scripts/ecr-policy-np.json',
  },
}

if (process.env.VERSION) {
  coreConfig.docker.image = `${NP_AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${NP_REPO_NAME}:${process.env.VERSION}`
} else {
  coreConfig.docker.tags = [packageJSON.version]
}

module.exports = coreConfig
