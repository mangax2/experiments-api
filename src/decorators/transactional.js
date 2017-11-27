import db from '../db/DbManager'

/** *
 * This is the implementation of the @Transactional decorator.  This decorator will wrap a function
 * and act as a proxy to that function providing the following behavior:
 *
 * 1. If no arguments were passed, the decorator will create a new transaction using the supplied
 * transaction name and pass it to the wrapped function.
 *
 * 2. If arguments were passed, the last parameter will be examined to determine whether it is
 * valid transaction.  This is determined by checking whether it is an object that has 'tx' as a
 * valid property.
 *
 *      a. If the last parameter is a valid transaction, it is passed into the wrapped function.
 *      b. If the last parameter is not a valid transaction, a new one will be created with the
 *      supplied transaction name, appended to the end of the argument list, and passed into the
 * wrapped function.
 *
 * @param transactionName If a transaction does not exist and a new one needs to be created, it
 *   will be given this name.
 * @returns {Function}
 */
function transactional(transactionName) {
  return function (target, property, descriptor) {
    const wrappingFunction = (bindingFunction => function () {
      const lastParameter = arguments.length > 0 ? arguments[arguments.length - 1] : undefined
      if (lastParameter === undefined) {
        // Fat arrow necessary to preserve this
        return db.tx(transactionName, tx => bindingFunction(this, [tx]))
      }
      if (lastParameter.tx) {
        return bindingFunction(this, arguments)
      }
      // Fat arrow necessary to preserve this
      return db.tx(transactionName, (tx) => {
        const newArguments = []
        for (let i = 0; i < arguments.length; i += 1) {
          newArguments.push(arguments[i])
        }
        newArguments.push(tx)
        return bindingFunction(this, newArguments)
      })
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

export default transactional
