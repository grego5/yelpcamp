var express 	= require('express'),
	 router 	= new express.Router(),
	 passport 	= require('passport'),
	 User 		= require('../models/User');

//home
router.get('/', function(req, res){ 
	res.redirect('/camps');
});

router.get('/register', function(req, res){
	res.render('register');
});

router.post('/register', function(req, res){
	User.register(new User({
		username: req.body.username,
		email: req.body.email,
	}), req.body.password, function(err, user){
		if (err) {
			return res.render('register', {error: err.message});
		};
		passport.authenticate('local')(req, res, function() { res.redirect('/camps')});
	});
});

router.get('/login', function(req, res){
	res.render('login');
});

router.post('/login', passport.authenticate('local', {
	failureRedirect: '/login',
	successRedirect: '/camps'
}), function(req, res){});

router.get('/logout', function(req, res){
	req.flash('info', 'See you later, ' + req.user.username);
	req.logout();
	res.redirect('/camps');
});

module.exports = router;