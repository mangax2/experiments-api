import log4js from 'log4js'

log4js.getLogger = jest.fn(() => {
  return {
    debug: jest.fn(),
    info: jest.fn(),
    fatal: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  }
})

console.info = jest.fn()
console.error = jest.fn()