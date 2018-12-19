var Camp 		= require('../models/Camp'),
	 Comment   	= require('../models/Comment'),
	 multer		= require('multer');

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
			if (req.user.isAdmin || req.user._id.equals(obj.author.id)){
				next();
			} else {
				req.flash('error', 'Request is not authorized');
				res.redirect('/camps');
			};
		};
	};
};

var storage = multer.diskStorage({
	filename: function(req, file, callback){
		callback(null, Date.now() + file.originalname);
	}
});

var imageFilter = function(req, file, callback){
	if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)){
		return callback(new Error('Only image files are allowed'), false);
	}
	callback(null, true);
};

var upload = function(req, res, next){
	multer({storage: storage, fileFilter: imageFilter})
	.single('image')(req, res, function(err){
		if (err) {
			req.flash('error', err.message);
			return res.redirect('back');
		}
		next();
	})
}


module.exports = {
	isLoggedIn: isLoggedIn,
	isAuthorized: isAuthorized,
	upload: upload
}