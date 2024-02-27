var User = require('../models/user');

async function index(req, res, next) {
    res.render('session/index');
}


async function create(req, res , next) {
    
    var {email, password} = req.body;
    if(!email || !password){
        return res.render('session/index')
    }

    var user = await User.findOne({email:email});
    if(!user) {
        return res.render('session/index');
    }
    if(user.password != password) {
        return res.render('session/index');
    }
    req.session.userId = user._id;
    const returnTo = req.session.returnTo || '/';
    delete req.session.returnTo;
    res.redirect(returnTo);
}

function destroy(req, res, next){
    res.clearCookie("ssid")
    const returnTo = req.session.returnTo || '/';
    delete req.session.returnTo;
    res.redirect(returnTo);
}

module.exports = {
    index,
    create,
    destroy
}