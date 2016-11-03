import db from '../db/DbManager'

function transactional(transactionName) {
    return function(target, property, descriptor) {
        const wrappedFunction = descriptor.value
        descriptor.value = function() {
            const lastParameter = arguments.length > 0 ? arguments[arguments.length - 1] : undefined
            if (!lastParameter) {
                return db.tx(transactionName, (tx) => {
                    return wrappedFunction.apply(this, [tx])
                })
            } else {
                if (lastParameter.tx) {
                    return wrappedFunction.apply(this, arguments)
                } else {
                    return db.tx(transactionName, (tx) => {
                        const newArguments = []
                        for (let i = 0; i < arguments.length; i++) {
                            newArguments.push(arguments[i])
                        }
                        newArguments.push(tx)
                        return wrappedFunction.apply(this, newArguments)
                    })
                }
            }
        }
        return descriptor
    }
}

module.exports = transactional