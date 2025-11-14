const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/device');

router.get('/', deviceController.getAll);
router.get('/:id', deviceController.get);
router.post('/', deviceController.create);
router.put('/:id', deviceController.updateStatus);

module.exports = router;