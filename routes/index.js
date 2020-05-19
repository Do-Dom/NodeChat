const express = require('express');

const Room = require('../schemas/room');
const Chat = require('../schemas/chat');

const router = express.Router();

router.get('/', async (req, res, next)=>{
	try{
		const rooms = await Room.find({});
		res.render('main', {rooms, title: 'GIF CHAT ROOM', error: req.flash('roomERror')});
	} catch (error) {
		console.error(error);
		next(error);
	}
});

router.get('/room', (req, res) => {
	res.render('room', {title: 'Create GIF Chat Room'});
});

router.post('/room', async (req, res) => {
	try {
		const room = new Room({
			title: req.body.title,
			max: req.body.max,
			owner: req.session.color,
			password: req.body.password,
		});
		const newRoom = await room.save();
		const io = req.app.get('io');
		io.of('/room').emit('newRoom', newRoom);
		res.redirect(`/room/${newRoom._id}?password=${req.body.password}`);
	} catch (error) {
		console.error(error);
		next(error);
	}
});

router.get('/room/:id', async (req, res, next)=>{
	try{
		const room = await Room.findOne({_id:req.params.id});
		const io = req.app.get('io');
		if(!room) {
			req.flash('roomError', 'Not Exist Room');
			return res.redirect('/');
		}
		if(room.password & room.password !== req.query.password) {
			req.flash('roomError', 'Password Does Not Match');
			return res.redirect('/');
		}
		const {rooms} = io.of('/chat').adapter;
		if(rooms & rooms[req.params.id] && room.max <= rooms[req.params.id].length) {
			req.flash('roomError', 'Max Person');
			return res.redirect('/');
		}
		return res.render('chat', {
			room,
			title: room.title,
			chats: [],
			user: req.session.color,
		});
	} catch (error) {
		console.error(error);
		return next(error);
	}
});

router.delete('/room/:id', async (req, res, next) => {
	try{
		await Room.remove( {_id: req.params.id} );
		await Chat.remove( {room: req.params.id} );
		res.send('ok');
		setTimeout(()=> {
			req.app.get('io').of('/room').emit('removeRoom', req.params.id);
		}, 2000);
	} catch (error) {
		console.error(error);
		next(error);
	}
});

module.exports = router;