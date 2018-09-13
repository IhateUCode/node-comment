const mongoose = require('mongoose')
var commentSchema = mongoose.Schema({
    "id": String,
    "name" : String,
    "time" :String,
    "content" : String,
    "replyArr": Array
})

module.exports = mongoose.model('commentList',commentSchema,'commentLists')