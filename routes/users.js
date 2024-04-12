const mongoose = require('mongoose');
const { post } = require('.');
const bcrypt = require('bcrypt');

mongoose.connect("mongodb://localhost:27017/connect")
const userSchema = new mongoose.Schema({
  userid: String,
  username: String,
  password: String,
  postlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], 
  requests: [{ type: mongoose.Schema.Types.ObjectId, ref : 'User' }], 
  received_request: [{ type: mongoose.Schema.Types.ObjectId , ref : 'User'}] 
});
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
      return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
      throw new Error(error);
  }
};
const UserModel = mongoose.model('User' , userSchema);
module.exports = UserModel ;