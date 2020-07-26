const http = require("http");
const https = require("https");
const Koa = require('koa');
const app = new Koa();
const path = require('path');
const fs = require("fs");
const staticFunc = require('koa-static')
const routing = require('./routers/index');
const koaBody = require('koa-body');
const staticPath = './static';
const config = require("./config");

app.use(staticFunc(
  path.join( __dirname,  staticPath)
))

app.use(koaBody({
  multipart: true,
  formidable: {
    multipart: true,
    maxFileSize: 200*1024*1024    // 设置上传文件大小最大限制，默认2M
  }
}));

// 匹配路由
routing(app);

http.createServer(app.callback()).listen(config.HTTP_PORT,()=>{
  console.log(`程序已启动在${config.HTTP_PORT}端口`);
});


// const options = {
//   key: fs.readFileSync("./cert/chn.com.key", "utf8"), // 私钥
//   cert: fs.readFileSync("./cert/chn.com_public.crt", "utf8"), // 公钥
//   ca: fs.readFileSync("./cert/chn.com_chain.crt", "utf8") // 证书
// };

https.createServer(options, app.callback()).listen(config.HTTPS_PORT,()=>{
  console.log(`程序已启动在${config.HTTPS_PORT}端口`);
});
