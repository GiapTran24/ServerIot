const express = require('express');
const router = express.Router();
const sensorDataController = require('../controllers/sensorData');

router.get('/', sensorDataController.getAll);
router.post('/', sensorDataController.create);
router.delete('/:id', sensorDataController.delete);

module.exports = router;