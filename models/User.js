var db = require('mongoose');
db.connect(process.env.DATABASEURL + '/yelpapp', {useNewUrlParser: true});

userSchema = new db.Schema({
	username: {type: String, unique: true, required: true},
	email: {type: String, unique: true, required: true},
	date: {type: Date, default: Date.now},
	password: {type: String},
	resetPasswordToken: String,
	resetPasswordExpires: Date,
	isAdmin: {type: Boolean, default: false}
});

userSchema.plugin(require('passport-local-mongoose'));

module.exports = db.model('User', userSchema);