const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const externalPartyController = require('../controllers/externalPartyController');
const auth = require('../middleware/auth');

// Debug middleware for this router
console.log('⚙️  Initializing external parties routes...');

// Log all requests to this router
router.use((req, res, next) => {
  console.log(`📌 External Parties Router: ${req.method} ${req.originalUrl}`);
  console.log('   Params:', req.params);
  console.log('   Query:', req.query);
  console.log('   Body:', req.body);
  next();
});

// All routes require authentication
router.use(auth);

// Validation rules
const partyValidation = [
  body('name').notEmpty().trim().withMessage('Name is required'),
  body('type').isIn(['individual', 'corporate', 'organization', 'other']).withMessage('Valid type is required'),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().trim(),
  body('companyName').optional().trim(),
  body('contactPerson').optional().trim()
];

// Routes
console.log('   📍 Registering POST /');
router.post('/', partyValidation, externalPartyController.createExternalParty);

console.log('   📍 Registering GET /');
router.get('/', externalPartyController.getExternalParties);

console.log('   📍 Registering GET /search');
router.get('/search', externalPartyController.searchExternalParties);

console.log('   📍 Registering GET /:id');
router.get('/:id', externalPartyController.getExternalParty);

console.log('   📍 Registering PUT /:id');
router.put('/:id', partyValidation, externalPartyController.updateExternalParty);

console.log('   📍 Registering DELETE /:id');
router.delete('/:id', externalPartyController.deleteExternalParty);

console.log('   📍 Registering GET /:id/transactions');
router.get('/:id/transactions', externalPartyController.getPartyTransactions);

console.log('✅ External parties routes initialized');

module.exports = router;