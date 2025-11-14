const express = require('express');
const router = express.Router();
const sensorDataController = require('../controllers/sensorData');

router.get('/', sensorDataController.getAll);
router.post('/', sensorDataController.createFromDevice);
router.get('/latest/:id', sensorDataController.getLatest);
router.get('/history', sensorDataController.getHistory);
router.get('/filter', sensorDataController.getFilteredData);
// router.post('/', sensorDataController.create);
router.delete('/:id', sensorDataController.delete);

module.exports = router;