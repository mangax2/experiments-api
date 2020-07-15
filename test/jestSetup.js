import '@babel/polyfill'

jest.setTimeout(1000)
beforeEach(() => { expect.hasAssertions() })

console.info = jest.fn()
console.error = jest.fn()
console.warn = jest.fn()

beforeEach(() => {
  expect.hasAssertions() // Tests should fail if expect not reached
})
