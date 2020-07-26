const request = require('request')
const fs = require('fs')
const config = require('../config');
const corpid = config.corpid;
const corpsecret = config.corpsecret;
const crypto = require('crypto');

const getToken = async () => {
  let tokenInfo = fs.existsSync('token_info.json')
    ? JSON.parse(fs.readFileSync('token_info.json', 'utf-8'))
    : null
  let expires_time = tokenInfo ? tokenInfo.expires_time : ''
  let cache_access_token =
    tokenInfo && tokenInfo.access_token ? tokenInfo.access_token : ''
  if (
    parseInt(Date.now() / 1000) > expires_time + 3600 ||
    tokenInfo == null ||
    cache_access_token === ''
  ) {
    let tokenInfoNew = await new Promise(function (resolve, reject) {
      request.get(
        `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${corpid}&corpsecret=${corpsecret}`,
        function (error, response, body) {
          if (!error && response.statusCode === 200) {
            resolve(body)
          }
          reject(error)
        }
      )
    })
    tokenInfoNew = JSON.parse(tokenInfoNew)
    cache_access_token = tokenInfoNew.access_token
    expires_time = parseInt(Date.now() / 1000)
    fs.writeFileSync(
      'token_info.json',
      JSON.stringify({
        access_token: cache_access_token,
        expires_time: expires_time,
      })
    )
    return { access_token: cache_access_token, expires_time: expires_time }
  } else {
    return tokenInfo
  }
};

const getTicket = async () => {
  const token = (await getToken()).access_token;
  let ticket;
  let ticketInfo = fs.existsSync('ticket_info.json')
    ? JSON.parse(fs.readFileSync('ticket_info.json', 'utf-8'))
    : null
  let expires_time = ticketInfo ? ticketInfo.expires_time : ''
  let cache_ticket =
    ticketInfo && ticketInfo.ticket_token ? ticketInfo.ticket_token : ''
  if (
    parseInt(Date.now() / 1000) > expires_time + 3600 ||
    ticketInfo == null ||
    cache_ticket === ''
  ) {
    let ticketInfoNew = await new Promise(function (resolve, reject) {
      request.get(
        `https://qyapi.weixin.qq.com/cgi-bin/get_jsapi_ticket?access_token=${token}`,
        function (error, response, body) {
          if (!error && response.statusCode === 200) {
            resolve(body)
          }
          reject(error)
        }
      )
    })
    ticketInfoNew = JSON.parse(ticketInfoNew)
    cache_ticket = ticketInfoNew.ticket
    expires_time = parseInt(Date.now() / 1000)
    fs.writeFileSync(
      'ticket_info.json',
      JSON.stringify({
        ticket_token: cache_ticket,
        expires_time: expires_time,
      })
    )
    ticket = { ticket_token: cache_ticket, expires_time: expires_time }
  } else {
    ticket = ticketInfo
  }
  return ticket;
}

// sha1加密
function sha1(str) {
  let shasum = crypto.createHash("sha1")
  shasum.update(str)
  str = shasum.digest("hex")
  return str
}

function createTimestamp() {
  return parseInt(new Date().getTime() / 1000) + ''
}

function createNonceStr() {
  return Math.random().toString(36).substr(2, 15)
}

function raw(args) {
  var keys = Object.keys(args)
  keys = keys.sort()
  var newArgs = {}
  keys.forEach(function (key) {
    newArgs[key.toLowerCase()] = args[key]
  })

  var string = ''
  for (var k in newArgs) {
    string += '&' + k + '=' + newArgs[k]
  }
  string = string.substr(1)
  return string
}

class SignatureCtl{

  index = async (ctx)=>{
    const ticket = (await getTicket()).ticket_token;
    const URL = ctx.query.url;
    const ret = {
      jsapi_ticket: ticket,
      nonceStr: createNonceStr(),
      timestamp: createTimestamp(),
      url: URL
    };
    const string = raw(ret)
    ret.signature = sha1(string)
    ret.corpid = config.corpid;
    ctx.body = ret;
  }
}

module.exports = new SignatureCtl();
