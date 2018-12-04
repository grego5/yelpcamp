var Camp 		= require('../models/Camp'),
	 Comment   	= require('../models/Comment');

var isLoggedIn = function(req, res, next){
	if (req.isAuthenticated()) next();
	else { 
		req.flash('error', 'You must log in first');
		res.redirect('/login');
	}
};

var isAuthorized = function(req, res, next){
	if (req.params.cid) {
		Comment.findOne({_id: req.params.cid}, function(err, comment){
			check(err, comment);
		});
	} else {
		Camp.findOne({_id: req.params.id}, function(err, camp){
			check(err, camp)
		});
	};

	function check(err, obj){
		if (err || !obj) { 
			req.flash('error', 'Request is not found');
			res.redirect('/camps');
		} else {
			console.log(JSON.stringify(obj));
			if (req.user._id.equals(obj.author.id)){
				next();
			} else {
				req.flash('error', 'Request is not authorized');
				res.redirect('/camps');
			};
		};
	};
};

module.exports = {
	isLoggedIn: isLoggedIn,
	isAuthorized: isAuthorized,
}