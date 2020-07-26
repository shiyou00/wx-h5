const Router = require('koa-router');
const router = new Router();
const {index,submit} = require('../controllers/upload');

router.post('/upload', index);

router.post('/submit', submit);

module.exports = router;
