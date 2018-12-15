var db = require('mongoose');
db.connect(process.env.DATABASEURL + '/yelpapp', {useNewUrlParser: true});

userSchema = new db.Schema({
	uername: {type: String},
	email: {type: String},
	date: {type: Date, default: Date.now},
	password: {type: String},
	isAdmin: {type: Boolean, default: false}
});

userSchema.plugin(require('passport-local-mongoose'));

module.exports = db.model('User', userSchema);