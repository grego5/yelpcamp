var db = require('mongoose');
db.connect(process.env.databaseurl + '/yelpapp', {useNewUrlParser: true});

userSchema = new db.Schema({
	uername: {type: String, require: true},
	email: {type: String, require: true},
	date: {type: Date, default: Date.now},
	password: {type: String, require: true},
});

userSchema.plugin(require('passport-local-mongoose'));

module.exports = db.model('User', userSchema);