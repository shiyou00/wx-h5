## 服务器安装步骤
1. 安装 Node.js
2. 安装pm2
    - `npm install -g pm2`
3. 启动项目
    - 进入项目根目录
    - 安装包：`npm install`
    - 启动进程：`pm2 start app/index.js`
    - `pm2 list` 可以查看启动进程
4. 访问：`https://xxxx/index.html`

## 配置文件
`./app/config.js` 包含了所以可配置的KEY


## 资料
- [微信UI](http://jqweui.com/components)
- [企业微信开发文档](https://work.weixin.qq.com/api/doc/90000/90003/90556)


## 环境
http默认监听80端口，https默认监听443端口，原因是微信要求，也可在app/config文件中进行配置

## SSL
替换安全证书位置：`./cert/*`
