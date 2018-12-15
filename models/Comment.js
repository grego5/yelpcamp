var db = require('mongoose');
db.connect(process.env.DATABASEURL + '/yelpapp', {useNewUrlParser: true});

var commentSchema = new db.Schema({
	author: {
		id: { 
			type: db.Schema.Types.ObjectId,
			ref: 'User',
		},
		username: String,
	},
	text: String,
	date: {type: Date, default: Date.now}
});

module.exports = db.model('Comment', commentSchema);