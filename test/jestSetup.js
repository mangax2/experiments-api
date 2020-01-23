import log4js from 'log4js'
import '@babel/polyfill'

log4js.getLogger = jest.fn(() => ({
  debug: jest.fn(),
  info: jest.fn(),
  fatal: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}))

jest.setTimeout(1000)

console.info = jest.fn()
console.error = jest.fn()
console.warn = jest.fn()
