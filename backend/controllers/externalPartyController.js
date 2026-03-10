const ExternalParty = require('../models/ExternalParty');
const Transaction = require('../models/Transaction');
const { validationResult } = require('express-validator');

// Create a new external party
exports.createExternalParty = async (req, res) => {
  try {
    console.log('📝 Creating external party for user:', req.userId);
    console.log('Request body:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const partyData = {
      ...req.body,
      createdBy: req.userId
    };

    console.log('Party data to save:', partyData);
    
    const party = new ExternalParty(partyData);
    await party.save();
    
    console.log('✅ External party created successfully:', party._id);

    res.status(201).json({
      message: 'External party created successfully',
      party
    });
  } catch (error) {
    console.error('❌ Create external party error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get all external parties for the user
exports.getExternalParties = async (req, res) => {
  try {
    console.log('📋 Fetching external parties for user:', req.userId);
    
    const parties = await ExternalParty.find({ 
      createdBy: req.userId,
      isActive: true 
    }).sort({ createdAt: -1 });

    console.log(`✅ Found ${parties.length} external parties`);
    console.log('Parties data:', JSON.stringify(parties, null, 2));
    
    res.json(parties);
  } catch (error) {
    console.error('❌ Get external parties error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message 
    });
  }
};

// Search external parties
exports.searchExternalParties = async (req, res) => {
  try {
    const { query } = req.query;
    console.log('🔍 Searching external parties with query:', query, 'for user:', req.userId);
    
    if (!query) {
      console.log('No query provided, returning empty array');
      return res.json([]);
    }

    console.log('Building search query...');
   // In the searchExternalParties function, update the tags part:
const searchQuery = {
  createdBy: req.userId,
  isActive: true,
  $or: [
    { name: { $regex: query, $options: 'i' } },
    { email: { $regex: query, $options: 'i' } },
    { companyName: { $regex: query, $options: 'i' } },
    { contactPerson: { $regex: query, $options: 'i' } },
    { phone: { $regex: query, $options: 'i' } },
    { tags: { $in: [new RegExp(query, 'i')] } }
  ]
};
    
    console.log('MongoDB query:', JSON.stringify(searchQuery, null, 2));
    
    const parties = await ExternalParty.find(searchQuery).limit(20);

    console.log(`✅ Found ${parties.length} matching external parties`);
    console.log('Search results:', JSON.stringify(parties, null, 2));
    
    res.json(parties);
  } catch (error) {
    console.error('❌ Search external parties error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message 
    });
  }
};

// Get single external party
exports.getExternalParty = async (req, res) => {
  try {
    console.log('🔍 Fetching external party:', req.params.id, 'for user:', req.userId);
    
    const party = await ExternalParty.findOne({
      _id: req.params.id,
      createdBy: req.userId
    });

    if (!party) {
      console.log('❌ External party not found');
      return res.status(404).json({ message: 'External party not found' });
    }

    console.log('✅ External party found:', party._id);
    res.json(party);
  } catch (error) {
    console.error('❌ Get external party error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message 
    });
  }
};

// Update external party
exports.updateExternalParty = async (req, res) => {
  try {
    console.log('📝 Updating external party:', req.params.id);
    console.log('Update data:', req.body);
    
    const party = await ExternalParty.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.userId },
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!party) {
      console.log('❌ External party not found for update');
      return res.status(404).json({ message: 'External party not found' });
    }

    console.log('✅ External party updated successfully:', party._id);
    res.json({
      message: 'External party updated successfully',
      party
    });
  } catch (error) {
    console.error('❌ Update external party error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message 
    });
  }
};

// Delete external party (soft delete)
exports.deleteExternalParty = async (req, res) => {
  try {
    console.log('🗑️ Deleting external party:', req.params.id);
    
    const party = await ExternalParty.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.userId },
      { isActive: false, updatedAt: Date.now() },
      { new: true }
    );

    if (!party) {
      console.log('❌ External party not found for deletion');
      return res.status(404).json({ message: 'External party not found' });
    }

    console.log('✅ External party deleted successfully:', party._id);
    res.json({ message: 'External party deleted successfully' });
  } catch (error) {
    console.error('❌ Delete external party error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message 
    });
  }
};

// Get all transactions with a specific external party
exports.getPartyTransactions = async (req, res) => {
  try {
    const partyId = req.params.id;
    console.log('📊 Fetching transactions for external party:', partyId, 'user:', req.userId);
    
    const transactions = await Transaction.find({
      createdBy: req.userId,
      $or: [
        { lender: partyId, lenderModel: 'ExternalParty' },
        { borrower: partyId, borrowerModel: 'ExternalParty' }
      ]
    })
    .sort({ createdAt: -1 });

    console.log(`✅ Found ${transactions.length} transactions`);

    // Calculate balance with this party
    let balance = 0;
    transactions.forEach(t => {
      if (t.lender && t.lender.toString() === partyId && t.lenderModel === 'ExternalParty' && t.status === 'pending') {
        balance += t.amount;
      } else if (t.borrower && t.borrower.toString() === partyId && t.borrowerModel === 'ExternalParty' && t.status === 'pending') {
        balance -= t.amount;
      }
    });

    console.log('💰 Calculated balance:', balance);

    res.json({
      transactions,
      balance
    });
  } catch (error) {
    console.error('❌ Get party transactions error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message 
    });
  }
};