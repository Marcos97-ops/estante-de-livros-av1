/**
 * Todas as rotas de livros exigem JWT — só o middleware `autenticar`
 * decide quem entra; a checagem de "é o dono?" fica no controller.
 */
const { Router } = require('express');
const livroController = require('../controllers/livroController');
const autenticar = require('../middlewares/auth');

const router = Router();

router.use(autenticar);

router.get('/', livroController.listar);
router.post('/', livroController.criar);
router.put('/:id', livroController.atualizar);
router.delete('/:id', livroController.remover);

module.exports = router;
