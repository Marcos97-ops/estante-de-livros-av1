const { Router } = require('express');
const categoriaController = require('../controllers/categoriaController');

const router = Router();

router.get('/', categoriaController.listar);

module.exports = router;
