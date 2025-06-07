const express = require('express');
const router = express.Router();
const multer = require('multer');
const authMiddleware = require('../middleware/authMiddleware');
const ocrController = require('../controllers/ocrController');

const upload = multer({ dest: 'uploads/' });

router.get('/listOcr', authMiddleware, ocrController.listOcr)
router.post('/upload', authMiddleware, upload.single('image'), ocrController.processImage);
router.post('/save', authMiddleware, ocrController.saveOCR);
router.get('/:id', authMiddleware, ocrController.getOCRById);
router.put('/update/:id', authMiddleware, ocrController.updateOCR);
router.delete('/:id', authMiddleware, ocrController.deleteOCR);


module.exports = router;
