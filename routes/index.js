var express 	= require('express'),
	 router 	= new express.Router(),
	 passport 	= require('passport'),
	 Camp		= require('../models/Camp'),
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
}), function(req, res){
	req.flash('success', 'You\'re logged in')
	res.redirect('/camps')
});

router.get('/logout', function(req, res){
	req.flash('info', 'See you later, ' + req.user.username);
	req.logout();
	res.redirect('/camps');
});

router.get('/profile/:id', function(req, res){
	Camp.find().where('author.id').equals(req.params.id).exec(function(err, camps){
		if (err || !camps) {
			req.flash('error', 'Profile is not found');
			res.redirect('/camps');
		} else {
			res.render('profile', {camps: camps});
		}
	})
})

module.exports = router;