var express 	  = require('express'),
	 app 		 	  = express(),
	 db 			  = require('mongoose'),
	 passport 	  = require('passport'),
	 localStategy = require('passport-local'),
 	 flash		  = require('connect-flash');

var User = require('./models/User');

db.connect(process.env.databaseurl + '/yelpapp', {useNewUrlParser: true});

app.set('view engine', 'ejs');
app.use(require('body-parser').urlencoded({extended: true}));
app.use(express.static('public'));
app.use(require('method-override')('_method'));
app.use(require('express-session')({
	secret: process.env.SESSION_SECRET,
	resave: false,
	saveUninitialized: false,
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
	res.locals.title = 'Yelp Camp';
	res.locals.session = req.user ? req.user : null;
	res.locals.success   = req.flash('success');
	res.locals.info   = req.flash('info');
	res.locals.error   = req.flash('error');
	next();
});

			//========//
			// ROUTES //
			//========//

app.use(require('./routes'));
app.use('/camps',  require('./routes/camps'));
app.use('/camps/:id/comment', require('./routes/comments'));

app.get('*', function(req, res){
	res.render('error404');
});

app.listen(process.env.PORT, process.env.IP, function(){
	console.log('Running node on address ' + process.env.IP + ':' + process.env.PORT);
});