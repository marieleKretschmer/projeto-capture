const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/getUser', authMiddleware, authController.getUser);
router.get('/perfil', authMiddleware, authController.getProfile);
router.put('/perfil', authMiddleware, authController.updateProfile);
router.delete('/perfil', authMiddleware, authController.deleteAccount);

module.exports = router;