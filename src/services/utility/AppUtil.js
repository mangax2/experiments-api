class AppUtil {
    static createPostResponse(data) {
        return data.map(d=> this.createResponseElements(d.id))
    }

    static createResponseElements(id) {
        return {
            'status': 201,
            'message' : 'Resource created',
            'id': id
        }
    }
}

module.exports = AppUtil