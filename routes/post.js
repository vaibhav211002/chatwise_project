const mongoose = require('mongoose');
mongoose.connect("mongodb://localhost:27017/connect")
const PostModel = new mongoose.Schema({
    postid: String,
    text: String,
    Doc: Date,
    name:String,
    comments: [{
        text: String,
        createdBy: String,
      }],
});
module.exports = mongoose.model('Post' , PostModel);