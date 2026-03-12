const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
description: {
  type: String,
  required: false,  // Change to false
  trim: true,
  default: 'Transaction'
},
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['borrow', 'lend'],
    required: true
  },
  // Can be either a registered user or an external party
  lender: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'lenderModel',
    required: true
  },
  lenderModel: {
    type: String,
    enum: ['User', 'ExternalParty'],
    required: true
  },
  borrower: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'borrowerModel',
    required: true
  },
  borrowerModel: {
    type: String,
    enum: ['User', 'ExternalParty'],
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'settled', 'overdue'],
    default: 'pending'
  },
  dueDate: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
  },
  settledDate: {
    type: Date
  },
  category: {
    type: String,
    enum: ['personal', 'business', 'other'],
    default: 'personal'
  },
  tags: [{
    type: String,
    trim: true
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
transactionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);