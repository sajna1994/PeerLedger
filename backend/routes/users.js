const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/search', userController.searchUsers);
router.post('/friends', userController.addFriend);
router.get('/friends', userController.getFriends);
router.get('/:friendId/transactions', userController.getFriendTransactions);

module.exports = router;