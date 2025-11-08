const express = require('express');
const router = express.Router();
const sensorController = require('../controllers/sensor');

router.get('/', sensorController.getAll);
router.post('/', sensorController.create);

module.exports = router;