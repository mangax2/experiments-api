import bluebird from 'bluebird'

let prefix = ''

function setErrorPrefix(errorPrefix) {
  prefix = errorPrefix
}

const getFullErrorCode = errorCode => `${prefix}${errorCode}`

function setErrorCode(errorCode) {
  return function (target, property, descriptor) {
    const addErrorCodeIfNotExist = (ex) => {
      if (!ex.errorCode) {
        ex.errorCode = getFullErrorCode(errorCode)
      }
      throw ex
    }

    const wrappingFunction = (bindingFunction => function () {
      try {
        const result = bindingFunction(this, arguments)
        if (Promise.resolve(result) === result || bluebird.resolve(result) === result) {
          return result.catch(addErrorCodeIfNotExist)
        }
        return result
      } catch (ex) {
        return addErrorCodeIfNotExist(ex)
      }
    })

    if (descriptor.value) {
      // This section handles traditional javascript functions [function (arg) { //logic }]
      const wrappedFunction = descriptor.value
      const bindingFunction = (thisRef, args) => wrappedFunction.apply(thisRef, args)
      descriptor.value = wrappingFunction(bindingFunction)
    } else {
      // This section handles arrow functions [(arg) => { //logic }]
      const originalInitializer = descriptor.initializer
      descriptor.initializer = function () {
        const functionToWrap = originalInitializer.call(this)
        const bindingFunction = (thisRef, args) => functionToWrap(...args)
        return wrappingFunction(bindingFunction)
      }
    }

    return descriptor
  }
}

module.exports = () => ({
  getFullErrorCode,
  setErrorCode,
  setErrorPrefix,
})
