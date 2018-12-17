var express   	= require('express'),
	 router    	= new express.Router(),
    sanitizer 	= require('sanitizer'),
	 mw			= require('../middleware'),
    waterfall  = require('async/waterfall'),
	 Camp 	  	= require('../models/Camp');

var geocoder = require('node-geocoder')({
		provider: 'google',
		httpAdapter: 'https',
		apiKey: process.env.GEOCODER_API_KEY,
		formatter: null
	});

function escapeRegex(text) {
	return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

//gallery + search
router.get('/', function(req, res, next){
	if (req.query.search){
		var regex = new RegExp(escapeRegex(req.query.search), 'gi');
		Camp.find({$or: [{name: regex}, {info: regex}, {"map.address": regex}] }, function(err, camps) {
			(err) ? console.log(err) : res.locals.camps = camps;
			next();
		}); 
	} else {
		Camp.find({}, function(err, camps){
			(err) ? console.log(err) : res.locals.camps = camps;
			next();
		}).limit(8);
	}	
}, function(req, res){
		res.render('campgrounds/gallery');
	}
);

//new camp form
router.get('/new', mw.isLoggedIn, function(req, res){
	res.render('campgrounds/new');
});

//show campground
router.get('/:id', function(req, res){
	Camp.findOne({_id: req.params.id}).populate('comments').exec(function(err, camp){
		if (err) {
			req.flash('error', 'Request is not found');
			res.redirect('/camps');
		} else  res.render('campgrounds/show', {camp: camp});
	});
});

//edit camp
router.get('/:id/edit', mw.isLoggedIn, mw.isAuthorized, function(req, res){
	Camp.findOne({_id: req.params.id}, function(err, camp){
		if (err) {
			req.flash('error', 'Request is not found');
			res.redirect('/camps');
		} else res.render('campgrounds/edit', {camp: camp});
	});
});

//create camp
router.post('/', mw.isLoggedIn, function(req, res){
	var newCamp = req.body.camp;
	newCamp.author = {
		id: req.user._id,
		username: req.user.username
	}
	newCamp.info = sanitizer.sanitize(req.body.camp.info);
	geocoder.geocode(req.body.location, function(err, data){
		if (err || !data.length) {
			req.flash('error', 'Location is not found');
			return res.redirect('back');
		};
		newCamp.map = {
			lat: data[0].latitude,
			lng: data[0].longitude,
			address: data[0].formattedAddress
		};
		Camp.create(newCamp, function(err, camp){
			if (err) {
				req.flash('error', 'Request could not be completed');
				res.redirect('/camps');
			} else {
				req.flash('success', 'Campground "'+ camp.name +'" has been created');
				res.redirect('/camps');
			};
		})
	})
});

//put update camp
router.put('/:id', mw.isLoggedIn, mw.isAuthorized, function(req, res){
	var newCamp = req.body.camp; 
	newCamp.info = sanitizer.sanitize(req.body.camp.info);
	var campId = req.params.id;
	geocoder.geocode(req.body.location, function(err, data){
		if (err || !data.length) {
			req.flash('error', 'Location is not found');
			return res.redirect('back');
		};
		newCamp.map = {
			lat: data[0].latitude,
			lng: data[0].longitude,
			address: data[0].formattedAddress
		};
		Camp.findOneAndUpdate({_id: campId}, newCamp, function(err, camp){
			if (err) {
				req.flash('error', 'Request could not be completed');
				res.redirect('/camps');
			} else {
				req.flash('success', 'Changes are saved');
				res.redirect('/camps/' + campId);
			};
		});
	});
});

//delete camp
router.delete('/:id', mw.isLoggedIn, mw.isAuthorized, function(req, res){
	Camp.findByIdAndDelete(req.params.id, function(err, camp){
		if (err) {
			req.flash('error', 'Request could not be completed');
			res.redirect('/camps');
		} else {
			req.flash('info', 'Campground "'+ camp.name +'"" has been removed');
			res.redirect('/camps');
		}
	});
});

module.exports = router;