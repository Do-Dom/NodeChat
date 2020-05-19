const SocketIO = require('socket.io');
const axios = require('axios');

module.exports = (server, app, sessionMiddleware) => {
	const io = SocketIO(server, {path: '/socket.io' });

	app.set('io', io);
	const room = io.of('/room');
	const chat = io.of('/chat');
	io.use((socket, next) => {
		sessionMiddleware(socket.request, socket.request.res, next);
	});
	room.on('connection', (socket) => {
		console.log('Connect on room namespace');
		socket.on('disconnect', () =>{
			console.log('Connection Finished on room namespace')
		});
	});

	chat.on('connection', (socket) => {
		console.log('Connect on chat namespace');
		const req = socket.request;
		const {headers:{referer}} = req;
		const roomId = referer
			.split('/')[referer.split('/').length-1]
			.replace(/\?.+/, '');
		socket.join(roomId);
		socket.to(roomId).emit('join', {
			user: 'system',
			chat: `Enter User : ${req.session.color}`,
		});
		socket.on('disconnect', ()=>{
			console.log('Connection Finished on chat namespace');
			socket.leave(roomId);
			const currentRoom = socket.adapter.rooms[roomId];
			const userCount = currentRoom ? currentRoom.length : 0;
			if(userCount === 0) {
				axios.delete(`http://localhost:8005/room/${roomId}`)
					.then(()=>{
						console.log('Delete Room Request Success' );
					})
					.catch((error) => {
						console.error(error);
					});
			} else {
				socket.to(roomId).emit('exit', {
					user: 'system',
					chat: `Exit User : ${req.session.color}`,
				});
			}
		});
	});
};
