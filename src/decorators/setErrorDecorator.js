import bluebird from 'bluebird'

let prefix = ''

function setErrorPrefix(errorPrefix) {
  prefix = errorPrefix
}

const getFullErrorCode = errorCode => `${prefix}${errorCode}`

const addErrorCodeIfNotExist = (ex, errorCode) => {
  if (!ex.errorCode) {
    ex.errorCode = getFullErrorCode(errorCode)
  }
  throw ex
}

const wrappingFunction = ((errorCode, bindingFunction) => function () {
  try {
    const result = bindingFunction(this, arguments)
    if (Promise.resolve(result) === result || bluebird.resolve(result) === result) {
      return result.catch(err => addErrorCodeIfNotExist(err, errorCode))
    }
    return result
  } catch (err) {
    return addErrorCodeIfNotExist(err, errorCode)
  }
})

const addErrorHandling = (errorCode, functionToWrap) => {
  const bindingFunction = (thisRef, args) => functionToWrap(...args)
  return wrappingFunction(errorCode, bindingFunction)
}

function setErrorCode(errorCode) {
  return function (target, property, descriptor) {
    if (descriptor.value) {
      // This section handles traditional javascript functions [function (arg) { //logic }]
      const functionToWrap = descriptor.value
      const bindingFunction = (thisRef, args) => functionToWrap.apply(thisRef, args)
      descriptor.value = wrappingFunction(errorCode, bindingFunction)
    } else {
      // This section handles arrow functions [(arg) => { //logic }]
      const originalInitializer = descriptor.initializer
      descriptor.initializer = function () {
        const functionToWrap = originalInitializer.call(this)
        const bindingFunction = (thisRef, args) => functionToWrap(...args)
        return wrappingFunction(errorCode, bindingFunction)
      }
    }

    return descriptor
  }
}

module.exports = () => ({
  addErrorHandling,
  getFullErrorCode,
  setErrorCode,
  setErrorPrefix,
})
