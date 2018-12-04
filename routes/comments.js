var express 	= require('express'),
	 router  	= new express.Router({mergeParams: true}),
	 sanitizer  = require('sanitizer'),
	 mw			= require('../middleware'),
	 Camp 		= require('../models/Camp'),
	 Comment 	= require('../models/Comment');

//new comment form
router.get('/new', mw.isLoggedIn, function(req, res){
	Camp.findOne({_id: req.params.id}, function(err, camp){
		(err) ? console.log(err) : res.render('comments/new', {camp: camp});
	});
});

//create comment
router.post('/', mw.isLoggedIn, function(req, res){
	Camp.findOne({_id: req.params.id}, function(err, camp){
		(err) ? console.log(err) : addComment(req, res, camp, function(){
			res.redirect('/camps/' + camp._id);
		});
	});
});

router.get('/:cid/edit', mw.isLoggedIn, mw.isAuthorized, function(req, res){
	Comment.findOne({_id: req.params.cid}, function(err, comment){
		(err) ? console.log(err) : res.render('comments/edit', {
			camp_id: req.params.id, 
			comment: comment,
		});
	});
});

router.put('/:cid', mw.isLoggedIn, mw.isAuthorized, function(req, res){
	var text = sanitizer.sanitize(req.body.text);
	Comment.findOneAndUpdate({_id: req.params.cid}, {text: text}, function(err, comment){
		(err) ? console.log(err): res.redirect('/camps/' + req.params.id);
	});
});

router.delete('/:cid', mw.isLoggedIn, mw.isAuthorized, function(req, res){
	Comment.findOneAndDelete({_id: req.params.cid}, function(err, comment){
		(err) ? console.log(err) : res.redirect('/camps/' + req.params.id);
	});
});

function addComment(req, res, camp, callback){
	var comment = new Comment({
		author: {
			username: req.user.username,
			id: req.user._id,
		},
		text: sanitizer.sanitize(req.body.text),
	});
	comment.save(function(err, comment){
		if (err) console.log(err);
		else {
			camp.comments.push(comment);
			camp.save(function(err, camp){
				(err) ? console.log(err) : callback();
			});
		};
	});
}

module.exports = router;