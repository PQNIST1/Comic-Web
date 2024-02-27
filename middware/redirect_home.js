function redirectLogin(req, res ,next) {
    if(req.session.userId) {
        next();
    } else {
        res.redirect('/login');
    }
}

function redirectRegister(req, res ,next) {
    if(req.session.userId) {
        next();
    } else {
        res.redirect('/register');
    }
}

function redirectHome(req, res, next){
    if(req.session.userId){
        res.redirect('/')
    } else {
        next();
    }
}

function middwareHome(req, res, next){
    if(!req.session.userId){
        res.redirect('/login');
        return;
    } else {
        next();
    }
}

module.exports = {
    redirectLogin,
    redirectHome,
    redirectRegister,
    middwareHome
}