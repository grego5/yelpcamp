var db = require('mongoose');
db.connect(process.env.DATABASEURL + '/yelpapp', {useNewUrlParser: true});

var cgSchema = new db.Schema({
	author: {
		id: {
			type: db.Schema.Types.ObjectId,
			ref: 'User'
		},
		username: String,
	},
	name: String,
	image: String,
	info: String,
	cost: Number,
	date: {type: Date, default: Date.now},
	comments: [{
		type: db.Schema.Types.ObjectId,
		ref: 'Comment',
	}],
});

module.exports = db.model('Camp', cgSchema);