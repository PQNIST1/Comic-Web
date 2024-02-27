var express = require('express');
var router = express.Router();
var middwareSession = require('../middware/redirect_home')

/* GET users listing. */
router.get('/',middwareSession.redirectLogin,middwareSession.redirectRegister, function(req, res, next) {
  res.send('respond with a resource');
});

module.exports = router;
