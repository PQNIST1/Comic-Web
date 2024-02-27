var User = require('../models/user');
const bcrypt = require('bcrypt');
async function index(req, res, next) {
    const user = await User.findById(req.session.userId)
    res.render('session/change',{user:user});
}
async function create(req, res , next) {
  let user = await User.findById(req.session.userId)
  let newPassword = req.body.password ? req.body.password : user.password
  let newuser =  {
    name : req.body.name,
    password : newPassword,
    email :req.body.email
  }
  user = await User.findByIdAndUpdate(req.session.userId,newuser);  
  res.redirect('/info') 
}

module.exports = {
    index,
    create
}