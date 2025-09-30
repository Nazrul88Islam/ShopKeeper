const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Inventory API is working' });
});

router.get('/', (req, res) => {
  res.status(200).json({ success: true, message: 'Get inventory - To be implemented', data: [] });
});

module.exports = router;