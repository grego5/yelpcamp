var request = require('request'),
	faker 	= require('faker'),
	User 	= require('./models/User'),
	Comment = require('./models/Comment'),
	Camp 	= require('./models/Camp');

User.deleteMany({}, function(err){
	(err) ? console.log(err) : createUsers(5, 'pwdpwd', function (users){
		Camp.deleteMany({}, function(err){
			(err) ? console.log(err) : createCamps(10, users);
		});
	});
});

function createUsers(n, password, callback){
	var newUser = {
		username: faker.internet.userName(),
		email: faker.internet.email(),
	}
	User.register(newUser, password, function(err, user){
		if (err) console.log(err);
		else {
			console.log('User "' + user.username + '" has been created');
			n--;
			if (n>0){
				createUsers(n, password, callback);
			} else if (callback){
				User.find({}, function(err, users){
					if (err) console.log(err);
					else {
						callback(users);
					}
				});
			};
		};
	});
}

function createCamps(campNum, users){
	var url = 'https://api.unsplash.com/photos/random';
	url += '?client_id=b9102e3c37e2f31447ac9652ff66d614cf3418cdcd0f894dff840561d2041551';
	url += '&query=forest%20camping&count='+campNum+'&orientation=squarish';

	request(url, function (error, data, body){
		if (!error && data.statusCode === 200){
			var images = JSON.parse(body);
			for(var i=0; i<campNum; i++){
				var j = Math.floor(Math.random()*users.length);
			 	var camp = new Camp({
					author: {
						id: users[j]._id,
						username: users[j].username,
					},
					name: faker.random.word(),
					image: images[i].urls.small,
					info: faker.lorem.paragraphs(),
				});
				var n = Math.floor(Math.random()*5)+1;
				addComments(n, camp, users);
				console.log(camp.name + ' has been created'
				+ ' with ' + n + (n + n>1 ? ' comments' : ' comment'));
			};
		} else {
			res.send("There was an error " + error);
		}
	});
}

function addComments(n, camp, users){
	var text = '';
	var c = Math.floor(Math.random()*10)+1;
	for (var i=0; i<c; i++) text += faker.random.words() + ' ';
	
	c = Math.floor(Math.random()*users.length);
	
	Comment.create({
		author: {
			id: users[c]._id,
			username: users[c].username,
		},
		text: text,
	}, function(err, comment){
		if (err){ 
			console.log(err);
			return false;
		} else { 
			camp.comments.push(comment);
			camp.save(function(err, camp){
				if (err) {
					console.log(err);
				} else {
					n--;
					if (n>0) addComments(n, camp, users);
				};
			});
		};
	});
}