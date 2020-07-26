const path = require('path');
const axios = require('axios');
const config = require('../config');
const ACCESS_KEY = config.ACCESS_KEY;
const SECRET_KEY = config.SECRET_KEY;
const EASYOPS_OPEN_API_HOST = config.EASYOPS_OPEN_API_HOST;
const EASYOPS_OPEN_DOMAIN = config.EASYOPS_OPEN_DOMAIN;
const uploadUrl = '/flowable_service/api/flowable_service/v1/file';
const submitUrl = '/flowable_service/api/flowable_service/v1/process_instance'
const crypto = require('crypto');
const fs = require('fs');
const FormData = require('form-data');
const request = require('request');

function sha1(key,msg) {
  return crypto.createHmac('sha1', key)
    .update(msg)
    .digest('hex');
}

function md5(content){
  return crypto.createHash('md5')
    .update(content)
    .digest('hex');
}

function handleUploadFile(ctx,file,filePath){
  const reader = fs.createReadStream(file.path);
  const fileResource = `${filePath}/${file.name}`;
  const writeStream = fs.createWriteStream(fileResource);
  if (!fs.existsSync(filePath)) {
    fs.mkdir(filePath, (err) => {
      if (err) {
        throw new Error(err);
      } else {
        reader.pipe(writeStream);
        ctx.body = {
          url: `/${file.name}`,
          code: 0,
          message: '上传成功'
        };
      }
    });
  } else {
    reader.pipe(writeStream);
    ctx.body = {
      url: `/${file.name}`,
      code: 0,
      message: '上传成功'
    };
  }
}

function stringToSign(expires,method,type,bodyContent,url,h) {
  let _method = method;
  let _contentType = "application/json";
  let _body = bodyContent ? md5(bodyContent) : "";

  if(type === 'UPLOAD'){
    _contentType = h['content-type'];
  }

  return _method + "\n" +
    url + "\n" +
    "\n" +
    _contentType + "\n" +
    _body + "\n" +
    expires + "\n" +
    ACCESS_KEY;
}

function uploadFile(ctx){
  const files = ctx.request.files.file;
  const filePath = path.join(__dirname, '../static/upload');
  if(files && files.length > 0){
    for (let file of files) {
      handleUploadFile(ctx,file,filePath);
    }
  }else{
    handleUploadFile(ctx,files,filePath);
  }
}

const upload = async (ctx, fileContent)=>{
  const formData = new FormData();
  const file = fs.readFileSync(fileContent.file.path);
  formData.append('file', file);
  const headers = formData.getHeaders();
  const buffer = formData.getBuffer();

  formData.getLength(async (err,length)=>{
    if(err) return ;
    headers['content-length'] = length;
    const expires = String(Date.now()).substring(0,10);
    const SIGN = stringToSign(expires,"POST","UPLOAD",buffer,uploadUrl,headers);
    const signature = sha1(SECRET_KEY,SIGN);
    return axios.post(`http://${EASYOPS_OPEN_DOMAIN}${uploadUrl}?accesskey=${ACCESS_KEY}&signature=${signature}&expires=${expires}`,formData,{headers}).then(res=>{
      return res;
    }).catch(e=>{
      const err = new Error(e.response.data.error);
      err.status = e.response.status;
      err.expose = true;
      throw err;
    });
  });
}

async function submitForm (ctx,submitData) {
  const expires = String(Date.now()).substring(0,10)
  const data = submitData;
  const SIGN = stringToSign(expires,"POST","",Buffer.from(JSON.stringify(data)),submitUrl);
  const signature = sha1(SECRET_KEY,SIGN);
  return axios({
    method: 'post',
    url: `http://${EASYOPS_OPEN_DOMAIN}${submitUrl}?accesskey=${ACCESS_KEY}&signature=${signature}&expires=${expires}`,
    data: data,
    headers:{
      "content-type":"application/json"
    }
  }).then((res)=>{
    return res
  })
    .catch((e)=>{
      const err = new Error(e.response.data.error);
      err.status = e.response.status;
      err.expose = true;
      throw err;
    })
}

class UploadCtl{
  index = async (ctx)=>{
    uploadFile(ctx);
  }

  submit = async (ctx) =>{
    try {
      // const data = await submitForm(ctx,ctx.request.body);
      const data = await upload(ctx,ctx.request.files);
      ctx.body = {
        code: data.status,
        msg: data.statusText
      }
    }catch (e) {
      ctx.throw(e);
    }
  }
}

module.exports = new UploadCtl();
