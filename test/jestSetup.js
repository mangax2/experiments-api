import '@babel/polyfill'
import lodash from 'lodash'
import configurator from '../src/configs/configurator'
import apiUrls from './configs/apiUrls'
import kafkaConfig from './configs/kafkaConfig'
import coreSource from './configs/coreSource'

const configs = {
  urls: apiUrls,
  kafka: kafkaConfig,
  ...coreSource,
}

configurator.get = path => (lodash.get(configs, path) ?? path.split('.').pop())

jest.setTimeout(1000)

console.info = jest.fn()
console.error = jest.fn()
console.warn = jest.fn()

beforeEach(() => {
  expect.hasAssertions() // Tests should fail if expect not reached
})

afterEach(() => {
  jest.clearAllMocks()
})
