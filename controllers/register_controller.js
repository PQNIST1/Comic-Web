var User = require('../models/user');
const bcrypt = require('bcrypt');
function index(req, res, next) {
    res.render('session/register');
}
async function create(req, res , next) {
    const name = req.body.fullname;
	const email = req.body.email.toLowerCase();
	const user = await User.findOne({email: email});
    const password = req.body.password;
	if (user!= null){
        return res.render('session/register');
    }
	else {
		const newUser = {
            name: name,
			email: email,
			password: password
		};
		const createUser = await User.create(newUser);
		if (!createUser) {
			return res.render('session/register');
		} 
        req.session.userId = createUser._id;
		const returnTo = req.session.returnTo || '/';
		delete req.session.returnTo;
		res.redirect(returnTo);
    } 
    
    
}

module.exports = {
    index,
    create
}