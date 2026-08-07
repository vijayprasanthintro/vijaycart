const express = require('express');
const router = express.Router();

// Health check - GET /api/health
// Used to verify the frontend can reach the backend. No sensitive data.
router.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'VijayCart API is running'
    });
});

module.exports = router;
