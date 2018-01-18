class AppUtil {
  static createResponseElements(id, code, message) {
    return {
      id,
      status: code,
      message,
    }
  }

  static createPostResponse(data) {
    return data ? data.map(d => this.createResponseElements(d.id, 201, 'Resource created')) : []
  }

  static createPutResponse(data) {
    return data ? data.map(d => this.createResponseElements(d.id, 200, 'Resource updated')) : []
  }

  static createNoContentResponse() {
    return {
      status: 204,
    }
  }

  static createCompositePostResponse() {
    return {
      status: 200,
      message: 'SUCCESS',
    }
  }
}

module.exports = AppUtil
