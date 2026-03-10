const Transaction = require('../models/Transaction');
const User = require('../models/User');
const ExternalParty = require('../models/ExternalParty');

exports.createTransaction = async (req, res) => {
  try {
    const { 
      description, 
      amount, 
      type, 
      otherPartyId, 
      otherPartyType, // 'user' or 'external'
      dueDate, 
      notes,
      category,
      tags 
    } = req.body;

    let lender, borrower, lenderModel, borrowerModel;

    if (type === 'lend') {
      // Current user is lending
      lender = req.userId;
      lenderModel = 'User';
      borrower = otherPartyId;
      borrowerModel = otherPartyType === 'user' ? 'User' : 'ExternalParty';
    } else {
      // Current user is borrowing
      lender = otherPartyId;
      lenderModel = otherPartyType === 'user' ? 'User' : 'ExternalParty';
      borrower = req.userId;
      borrowerModel = 'User';
    }

    // Validate other party exists
    if (otherPartyType === 'user') {
      const user = await User.findById(otherPartyId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
    } else {
      const party = await ExternalParty.findOne({ 
        _id: otherPartyId, 
        createdBy: req.userId,
        isActive: true 
      });
      if (!party) {
        return res.status(404).json({ message: 'External party not found' });
      }
    }

    const transaction = new Transaction({
      description,
      amount,
      type,
      lender,
      lenderModel,
      borrower,
      borrowerModel,
      createdBy: req.userId,
      dueDate,
      notes,
      category,
      tags
    });

    await transaction.save();

    // Populate based on models
    await transaction.populate('lender', 'name email companyName');
    await transaction.populate('borrower', 'name email companyName');

    res.status(201).json({
      message: 'Transaction created successfully',
      transaction
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const { status, type, category } = req.query;
    
    // Build query
    const query = {
      createdBy: req.userId
    };

    if (status) query.status = status;
    if (type) query.type = type;
    if (category) query.category = category;
    
    const transactions = await Transaction.find(query)
      .populate('lender', 'name email companyName type')
      .populate('borrower', 'name email companyName type')
      .sort({ createdAt: -1 });

    // Separate into borrowed and lent
    const borrowed = transactions.filter(t => t.borrower._id.toString() === req.userId);
    const lent = transactions.filter(t => t.lender._id.toString() === req.userId);

    // Calculate balances
    const totalBorrowed = borrowed.reduce((sum, t) => sum + t.amount, 0);
    const totalLent = lent.reduce((sum, t) => sum + t.amount, 0);
    const pendingBorrowed = borrowed
      .filter(t => t.status === 'pending')
      .reduce((sum, t) => sum + t.amount, 0);
    const pendingLent = lent
      .filter(t => t.status === 'pending')
      .reduce((sum, t) => sum + t.amount, 0);

    // Group by party type
    const byPartyType = {
      users: transactions.filter(t => 
        (t.lenderModel === 'User' && t.lender._id.toString() !== req.userId) ||
        (t.borrowerModel === 'User' && t.borrower._id.toString() !== req.userId)
      ),
      external: transactions.filter(t => 
        t.lenderModel === 'ExternalParty' || t.borrowerModel === 'ExternalParty'
      )
    };

    res.json({
      transactions,
      summary: {
        totalBorrowed,
        totalLent,
        pendingBorrowed,
        pendingLent,
        netBalance: totalLent - totalBorrowed
      },
      byPartyType
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('lender', 'name email companyName type')
      .populate('borrower', 'name email companyName type');

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Check if user is involved
    if (transaction.createdBy.toString() !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(transaction);
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateTransactionStatus = async (req, res) => {
  try {
    const { status } = req.body;
    console.log('📝 Update transaction status request:');
    console.log('  - Transaction ID:', req.params.id);
    console.log('  - New Status:', status);
    console.log('  - User ID:', req.userId);
    
    const transaction = await Transaction.findById(req.params.id);
    console.log('  - Transaction found:', transaction ? 'Yes' : 'No');

    if (!transaction) {
      console.log('  ❌ Transaction not found');
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Log transaction details
    console.log('  - Transaction details:');
    console.log('    * Lender ID:', transaction.lender.toString());
    console.log('    * Borrower ID:', transaction.borrower.toString());
    console.log('    * CreatedBy:', transaction.createdBy.toString());
    console.log('    * Current Status:', transaction.status);
    console.log('    * Type:', transaction.type);

    // Check if user is involved in the transaction
    const isLender = transaction.lender.toString() === req.userId;
    const isBorrower = transaction.borrower.toString() === req.userId;
    const isCreator = transaction.createdBy.toString() === req.userId;
    
    console.log('  - User roles:');
    console.log('    * Is Lender:', isLender);
    console.log('    * Is Borrower:', isBorrower);
    console.log('    * Is Creator:', isCreator);

    if (!isLender && !isBorrower && !isCreator) {
      console.log('  ❌ User not part of this transaction');
      return res.status(403).json({ 
        message: 'Access denied - You are not part of this transaction',
        debug: {
          userId: req.userId,
          lenderId: transaction.lender.toString(),
          borrowerId: transaction.borrower.toString(),
          createdBy: transaction.createdBy.toString()
        }
      });
    }

    // Allow either party to mark as settled
    if (status === 'settled') {
      transaction.status = status;
      transaction.settledDate = Date.now();
      console.log('  ✅ Transaction marked as settled');
    } else {
      // For other status changes
      transaction.status = status;
      console.log('  ✅ Transaction status updated to:', status);
    }

    await transaction.save();
    console.log('  ✅ Transaction saved successfully');

    // Determine who marked it
    const markedBy = isLender ? 'lender' : isBorrower ? 'borrower' : 'creator';
    
    res.json({
      message: `Transaction marked as ${status} by ${markedBy}`,
      transaction
    });
  } catch (error) {
    console.error('❌ Update transaction error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message 
    });
  }
};