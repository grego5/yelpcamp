var express   	= require('express'),
	 router    	= new express.Router(),
    sanitizer 	= require('sanitizer'),
    mw			= require('../middleware'),
	 Camp 	  	= require('../models/Camp');

//home
router.get('/', function(req, res){
	Camp.find({}, function(err, camps){
		(err) ? console.log(err) : res.render('campgrounds/gallery', {camps: camps});
	}).limit(8);
});

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

	Camp.create(newCamp, function(err, camp){
		if (err) {
			req.flash('error', 'Request could not be completed');
			res.redirect('/camps');
		} else {
			req.flash('success', 'Campground "'+ camp.name +'" has been created');
			res.redirect('/camps');
		};
	});
});

//put update camp
router.put('/:id', mw.isLoggedIn, mw.isAuthorized, function(req, res){
	req.body.camp.info = sanitizer.sanitize(req.body.camp.info);
	var campId = req.params.id;

	Camp.findOneAndUpdate({_id: campId}, req.body.camp, function(err, camp){
		if (err) {
			req.flash('error', 'Request could not be completed');
			res.redirect('/camps');
		} else {
			req.flash('success', 'Changes are saved');
			res.redirect('/camps/' + campId);
		};
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