class AppUtil {
  static createPostResponse(data) {
    return data.map(d => this.createResponseElements(d.id, 201, 'Resource created'))
  }

  static createPutResponse(data) {
    return data.map(d => this.createResponseElements(d.id, 200, 'Resource updated'))
  }

  static createResponseElements(id, code, message) {
    return {
      status: code,
      message,
      id,
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
