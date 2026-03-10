const User = require('../models/User');
const Transaction = require('../models/Transaction'); // Add this line

exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.json([]);
    }

    const users = await User.find({
      $and: [
        { _id: { $ne: req.userId } },
        {
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    })
    .select('name email')
    .limit(10);

    res.json(users);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addFriend = async (req, res) => {
  try {
    const { friendId } = req.body;

    const friend = await User.findById(friendId);
    if (!friend) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = await User.findById(req.userId);
    
    if (user.friends.includes(friendId)) {
      return res.status(400).json({ message: 'User is already your friend' });
    }

    user.friends.push(friendId);
    await user.save();

    res.json({ message: 'Friend added successfully' });
  } catch (error) {
    console.error('Add friend error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getFriends = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate('friends', 'name email');

    res.json(user.friends);
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getFriendTransactions = async (req, res) => {
  try {
    const friendId = req.params.friendId;
    
    const transactions = await Transaction.find({
      $or: [
        { lender: req.userId, borrower: friendId },
        { lender: friendId, borrower: req.userId }
      ]
    })
    .populate('lender', 'name email')
    .populate('borrower', 'name email')
    .sort({ createdAt: -1 });

    // Calculate balance with this friend
    let balance = 0;
    transactions.forEach(t => {
      if (t.lender._id.toString() === req.userId && t.status === 'pending') {
        balance += t.amount;
      } else if (t.borrower._id.toString() === req.userId && t.status === 'pending') {
        balance -= t.amount;
      }
    });

    res.json({
      transactions,
      balance
    });
  } catch (error) {
    console.error('Get friend transactions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};