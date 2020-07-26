const Router = require('koa-router');
const router = new Router();
const {index} = require('../controllers/signature');

router.get('/sign', index);

module.exports = router;
