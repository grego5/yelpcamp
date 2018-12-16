var express 	= require('express'),
	 router 		= new express.Router(),
	 passport 	= require('passport'),
	 Camp			= require('../models/Camp'),
	 waterfall	= require('async/waterfall'),
	 nodemailer	= require('nodemailer'),
	 crypto		= require('crypto'),
	 User 		= require('../models/User');

	var smtpTransport = nodemailer.createTransport({
		host: 'in-v3.mailjet.com',
		port: 587,
		auth: {
			user: process.env.SMTP_USER,
			pass: process.env.SMTP_PASS,
		}
	});

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
		if (!user) {
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
});

router.get('/forgot', function(req, res){
	res.render('forgot')
});

router.post('/forgot', function(req, res, next){
	waterfall([
		function(done){
			crypto.randomBytes(20, function(err, buf){
				var token = buf.toString('hex');
				done(err, token);
			});
		},
		function(token, done){
			User.findOne({email: req.body.email}, function(err, user){
				if (!user) {
					req.flash('error', 'Account with that email address is not found')
					return res.redirect('/forgot');
				}

				user.resetPasswordToken = token;
				user.resetPasswordExpires = Date.now() + 360000;

				user.save(function(err){
					done(err, token, user);
				});
			});
		},
		function(token, user, done){
			var mailOptions = {
				to: user.email,
				from: 'noreply@gregos.net',
				subject: 'Password Reset',
				text: 'You are receiving this because you, (or someone), have requested to reset the password\n' +
					'Please click on the following link to complete the process\n' +
					'http://' + req.headers.host + '/reset/' + token + '\n\n' +
					'If you did not request this, just ignore this message'
			};
			smtpTransport.sendMail(mailOptions, function(err){
				if (err) {
					req.flash('err', err.message);
					return res.redirect('/forgot');
				}
				console.log('mail sent');
				req.flash('success', 'A reset link has been sent to ' + user.email);
				return res.redirect('/forgot');
			});
		},
	]);
});

router.get('/reset/:token', function(req, res){
	User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now()}}, function(err, user){
		if (!user){
			req.flash('error', 'Password reset link is invalid or expired');
			return res.redirect('/forgot');
		}
		res.render('reset', {token: req.params.token})
	})
})

router.post('/reset/:token', function(req, res){
	waterfall([
		function(done){
			if (req.body.password !== req.body.confirm) {
				req.flash('error', 'Passwords do not match');
				return res.redirect('back');
			}

			User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now()}}, function(err, user){
				if (!user){
					req.flash('error', 'Password reset link is invalid or expired');
					return res.redirect('/forgot');
				}
				done(err, user);
			});
		},
		function(user, done){
			user.setPassword(req.body.password, function(err){
				user.resetPasswordToken = undefined;
				user.resetPasswordExpires = undefined;

				user.save(function(err){
					req.logIn(user, function(err){
						done(err, user);
					})
				})
			})
		},
		function(user, done){
			var mailOptions = {
				to: user.email,
				from: 'noreply@gregos.net',
				subject: 'Your password has been changed',
				text: 'This is notification that the password for your account ' + user.email + ' has been changed'
			}
			smtpTransport.sendMail(mailOptions, function(err){
				if (err) {
					console.log(err);
					req.flash('error', err.message);
					return res.redirect('/camps');
				}
				req.flash('success', 'You password has been changed');
				return res.redirect('/camps');
			})
		},
	]);
});

module.exports = router;