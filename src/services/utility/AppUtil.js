'use strict'
 class AppUtil {

     static createPostResponse(data) {
         return data.map(d=> this.createResponseElements(d.id))
     }

     static createResponseElements(id) {
            const responseObj = {
                'status': 201,
                'message' : "Resource created",
                 "id": id
        }
        return responseObj
      }
}



module.exports = AppUtil