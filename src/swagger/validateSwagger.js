const swaggerTools = require('swagger-tools')
const swaggerDoc = require('./swagger')

function validateSwagger() {
  swaggerTools.specs.v2.validate(swaggerDoc, (err, result) => {
    if (err) {
      throw err
    }

    if (result && result.warnings.length > 0) {
      throw new Error(JSON.stringify(result.warnings))
    }
  })
}

function validateSwaggerRoutes(routerRoutes) {
  const _ = require('lodash')

  swaggerTools.specs.v2.resolve(swaggerDoc, (err, result) => {
    if (err) {
      throw err
    }

    if (!result) {
      console.warn('Error resolving swagger doc')
    } else {
      const swaggerRoutes = _.map(result.paths, (v, k) => k)
      const missingSwaggerRoutes = _.difference(routerRoutes, swaggerRoutes)
      const missingExpressRoutes = _.difference(swaggerRoutes, routerRoutes)

      if (missingSwaggerRoutes.length > 0) {
        console.warn('Missing Swagger Routes:')
        console.warn(missingSwaggerRoutes)
      }

      if (missingExpressRoutes.length > 0) {
        console.warn('Missing Express Routes:')
        console.warn(missingExpressRoutes)
      }
    }
  })

  return true
}

exports.default = validateSwagger()
exports.validateSwaggerRoutes = validateSwaggerRoutes
