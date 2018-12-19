var express   	= require('express'),
	 router    	= new express.Router(),
	 waterfall	= require('async/waterfall'),
    sanitizer 	= require('sanitizer'),
	 mw			= require('../middleware'),
	 cloudinary = require('cloudinary'),
	 Camp 	  	= require('../models/Camp');

var geocoder = require('node-geocoder')({
		provider: 'google',
		httpAdapter: 'https',
		apiKey: process.env.GEOCODER_API_KEY,
		formatter: null
	});


cloudinary.config({
	cloud_name: process.env.CLOUDINARY_NAME,
	api_key: process.env.CLOUDINARY_KEY,
	api_secret: process.env.CLOUDINARY_PASS
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
router.post('/', mw.isLoggedIn, mw.upload, function(req, res){
	waterfall([
		function(done){
			var newCamp = req.body.camp;
			newCamp.author = {
				id: req.user._id,
				username: req.user.username
			}
			newCamp.info = sanitizer.sanitize(req.body.camp.info);

			if (req.file) {
				cloudinary.v2.uploader.upload(req.file.path, function(err, result){
					newCamp.image = result.secure_url;
					newCamp.imageId = result.public_id;
					if (err){
						req.flash('error', 'File upload failed');
						return res.redirect('/new');
					} 
					done(null, newCamp)
				})
			} else done(null, newCamp);
		}, 
		function(newCamp, done){
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
				done(null, newCamp);
			});
		},
		function(newCamp, done){
			Camp.create(newCamp, function(err, camp){
				if (err) {
					req.flash('error', 'Request could not be completed');
					res.redirect('/camps');
				} else {
					req.flash('success', 'Campground "'+ camp.name +'" has been created');
					res.redirect('/camps');
					done(null);
				};
			});
		},
	]);
});

//put update camp
router.put('/:id', mw.isLoggedIn, mw.isAuthorized, mw.upload, function(req, res){
	waterfall([
		function(done){
			Camp.findOne({_id: req.params.id}, function(err, camp){
				if (err) {
					req.flash('error', 'Request could not be completed');
					return res.redirect('/camps');
				};

				// if there's new image url, and the old one was hosted on cloudinary (had imageId), 
				// delete the old image from cloud and unset imageId
				if ((camp.imageId && camp.image !== req.body.camp.image) || req.file) {
					cloudinary.v2.api.delete_resources([camp.imageId]);
					camp.imageId = "";
				}
				camp.set(req.body.camp);
				camp.set({info: sanitizer.sanitize(req.body.camp.info)});
				done(null, camp);
			});
		},
		function(camp, done){
			if (req.file) {
				cloudinary.v2.uploader.upload(req.file.path, function(err, result){
					camp.set({
						image: result.secure_url,
						imageId: result.public_id
					});
					if (err){
						req.flash('error', 'File upload failed');
						return res.redirect('/new');
					} 
					done(null, camp)
				})
			} else {
				done(null, camp);
			}
		}, 
		function(camp, done){
			if (camp.map.address === req.body.location) {
				camp.set({map: camp.map});
				done(null, camp);
			} else {
				geocoder.geocode(req.body.location, function(err, data){
					if (err || !data.length) {
						req.flash('error', 'Location is not found');
						return res.redirect('back');
					};
					camp.set(
						{map: {
							lat: data[0].latitude,
							lng: data[0].longitude,
							address: data[0].formattedAddress
						}
					});
					done(null, camp);
				});
			}
		},
		function(camp, done){
			camp.save(function(err, camp){
				if (err) {
					req.flash('error', 'Request could not be completed');
					res.redirect('/camps');
				} else {
					req.flash('success', 'Changes are saved');
					res.redirect('/camps/' + camp._id);
				};
			});
			done(null);
		},
	]);
});

//delete camp
router.delete('/:id', mw.isLoggedIn, mw.isAuthorized, function(req, res, next){
	Camp.findByIdAndDelete(req.params.id, function(err, camp){
		if (err) {
			req.flash('error', 'Request could not be completed');
			res.redirect('/camps');
		}
		res.locals.camp = camp;
		next();
	});
}, function(req, res){
	var camp = res.locals.camp;
	if (camp.imageId) cloudinary.v2.api.delete_resources([camp.imageId]);
	req.flash('info', 'Campground "'+ camp.name +'"" has been removed');
	res.redirect('/camps');
});

module.exports = router;