var express = require('express');
var app = express.Router();
const {v4:uuidv4} = require('uuid');
const bcrypt = require('bcrypt');
const UserModel = require('./users');
const PostModel = require('./post') ;
 
const session = require('express-session');
app.use(session({
  secret: 'Hey',
  resave: false,
  saveUninitialized: true
}));

/* GET home page. */

app.get('/', function(req, res, next) {
  res.render('index');
});


app.get('/home' , async function(req,res,next){

  const userdata = await UserModel.findOne({ userid: req.session.key })
  .populate('postlist')
  .populate('requests')
  .populate('received_request')
  .populate('friends');

  let allusers = await UserModel.find();
 allusers = allusers.filter((val)=>{
    return val.userid !== req.session.key 
  })



  res.render('home' , {userdata,allusers});
} )


app.post('/home', async function(req,res,next){
  const id = uuidv4();
  const {content} = req.body ;
  
  const log_data = await UserModel.findOne({
    userid : req.session.key
  });

  const userpost = new PostModel({
    postid: id,
    text:content,
    name:log_data.username
  })

  await userpost.save();



  log_data.postlist.push(userpost);
  await log_data.save();
  res.redirect('home')
})

app.post('/signup' ,async function(req,res,next) {
  
  const {name , password} = req.body;

  let saltrounds = 10 ; 
  const hashedpass =await bcrypt.hash(password , saltrounds)

  const data = new UserModel({
    userid : uuidv4() ,
    username:name,
    password:hashedpass,
  })

  req.session.key = data.userid;
  await data.save();
  res.redirect('/home');

})



app.post('/sendrequest', async function(req,res,next){

  const currdata = await UserModel.findOne({
    userid : req.session.key
  });

  const frndata = await UserModel.findOne({
    userid : req.body.userid
  })
  currdata.requests.push(frndata);
  await currdata.save();
  frndata.received_request.push(currdata);
  await frndata.save();
  res.redirect('/home')
})

app.get('/LoginPage',function(req,res){
  req.session.destroy();
  res.render('login')
})

app.post('/LoginPage', async function(req,res){
  const { name, password } = req.body;

  try {
    const user = await UserModel.findOne({ username:name });
    if (!user) {
      res.redirect('LoginPage')
    }

    const isPasswordMatch = await user.comparePassword(password,user.password);

    if (!isPasswordMatch) {
      res.redirect('LoginPage')
    }
    req.session.key = user.userid;
    res.redirect('/home')
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
})

app.post('/requesthandling' , async function(req,res){

  const {user,str}= req.body;
  const deldata = await UserModel.findOne({
    userid:user
  })

  await UserModel.findOneAndUpdate(
    { userid: req.session.key },
    { $pull: { requests: deldata._id } },
    { new: true }
  );
  res.redirect('/home');

})

app.post('/reqreshandling' , async function(req,res){

  const data = await UserModel.findOne({
    userid:req.session.key
  })
  const datadd = await UserModel.findOne({
    userid:req.body.user
  })

  if(req.body.action=='accept'){


    data.friends.push(datadd._id);
    await data.save(); 

    await UserModel.findOneAndUpdate(
      { userid: req.session.key },
      { $pull: { received_request: datadd._id } },
      { new: true }
    )

    await UserModel.findOneAndUpdate(
      { userid: req.body.user },
      { $pull: { requests: data._id } },
      { new: true }
    )
  }
  else{

    await UserModel.findOneAndUpdate(
      { userid: req.session.key },
      { $pull: { received_request: datadd._id } },
      { new: true }
    );

    await UserModel.findOneAndUpdate(
      { userid:  datadd._id},
      { $pull: { requests: data._id } },
      { new: true }
    );
  }
  res.redirect('/home');
})

app.get('/feed' ,async function(req,res){

  const data = await UserModel.findOne({userid:req.session.key}).populate('friends')
  let postids = [];
  
  data.friends.forEach((friend) =>{
    let val = friend.postlist;
    postids = postids.concat(val);
  })

  console.log(postids);
  const posts = await PostModel.find({ _id: { $in: postids } });
  console.log('posts' , posts);

  res.render('feed',{posts})  

})



module.exports = app;
