const mongoose = require('mongoose');

const { MONGO_ID, MONGO_PASSWORD, NODE_ENV } = process.env;
const MONGO_URL = `mongodb://${MONGO_ID}:${MONGO_PASSWORD}@localhost:27017/admin`;

module.exports = () =>{
	const connect = () => {
		if(NODE_ENV !== 'production') {
			mongoose.set('debug', true);
		}
		mongoose.connect(MONGO_URL, {
			dbName: 'gifchat',
		}, (error) => {
			if(error) {
				console.log('Mongo DB Connection Error', error);
			} else {
				console.log('Mongo DB Connection Success');
			}
		});
	};
	connect();

	mongoose.connection.on('error', (error) => {
		console.error('Mongo DB Connection Error', error);
	});
	mongoose.connection.on('disconnected', () => {
		console.error('Mongo DB Connection Finished. Retry Connect.');
		connect();
	});

	require('./chat');
	require('./room');
};
