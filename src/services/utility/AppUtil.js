class AppUtil {
    static createPostResponse(data) {
        return data.map(d=> this.createResponseElements(d.id,201,'Resource created'))
    }

    static createPutResponse(data) {
        return data.map(d=> this.createResponseElements(d.id,200,'Resource updated'))
    }

    static createResponseElements(id,code,message) {
        return {
            'status': code,
            'message' : message,
            'id': id
        }
    }
}

module.exports = AppUtil