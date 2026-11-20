const cloud = require('wx-server-sdk')
const crypto = require('crypto')
const https = require('https')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// Price and product code are fixed on the server. The product ID itself is
// assigned after the matching virtual-payment item has been published in MP.
const CATALOG = {
  'fitness-detail-report-v2': {
    title: '缇杞体测详细成绩报告（单次）',
    priceFen: 100
  }
}

function createOutTradeNo() {
  return `FIT${Date.now()}${crypto.randomBytes(5).toString('hex').toUpperCase()}`
}

function hmacSha256(key, content) {
  return crypto.createHmac('sha256', key).update(content).digest('hex')
}

function requestJson(url, { method = 'GET', body } = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : ''
    const request = https.request(url, {
      method,
      timeout: 8000,
      headers: payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}
    }, response => {
      let text = ''
      response.on('data', chunk => { text += chunk })
      response.on('end', () => {
        try {
          const result = JSON.parse(text || '{}')
          if (response.statusCode < 200 || response.statusCode >= 300) {
            reject(new Error(`WECHAT_HTTP_${response.statusCode}`))
            return
          }
          resolve(result)
        } catch (error) {
          reject(new Error('WECHAT_RESPONSE_INVALID'))
        }
      })
    })
    request.on('timeout', () => request.destroy(new Error('WECHAT_REQUEST_TIMEOUT')))
    request.on('error', () => reject(new Error('WECHAT_REQUEST_FAILED')))
    if (payload) request.write(payload)
    request.end()
  })
}

async function sessionForLoginCode({ appId, appSecret, loginCode }) {
  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${encodeURIComponent(appId)}&secret=${encodeURIComponent(appSecret)}&js_code=${encodeURIComponent(loginCode)}&grant_type=authorization_code`
  const response = await requestJson(url)
  if (!response.session_key || !response.openid) throw new Error('LOGIN_SESSION_UNAVAILABLE')
  return response
}

function virtualPaymentConfig(appId) {
  const enabled = process.env.VIRTUAL_PAYMENT_ENABLED === 'true'
  const appKey = process.env.VIRTUAL_PAY_APP_KEY
  const offerId = process.env.VIRTUAL_PAY_OFFER_ID
  const productId = process.env.VIRTUAL_REPORT_PRODUCT_ID
  const appSecret = process.env.WECHAT_APP_SECRET
  const configuredAppId = process.env.WECHAT_APP_ID
  const paymentEnv = Number(process.env.VIRTUAL_PAY_ENV || '0')
  if (!enabled || !appKey || !offerId || !productId || !appSecret || !configuredAppId) {
    throw new Error('VIRTUAL_PAYMENT_NOT_CONFIGURED')
  }
  if (configuredAppId !== appId) throw new Error('APPID_CONFIGURATION_MISMATCH')
  if (paymentEnv !== 0 && paymentEnv !== 1) throw new Error('VIRTUAL_PAYMENT_ENV_INVALID')
  return { appKey, offerId, productId, appSecret, paymentEnv }
}

exports.main = async event => {
  const product = CATALOG[event.productCode]
  const loginCode = String(event.loginCode || '')
  if (!product) throw new Error('UNSUPPORTED_PRODUCT')
  if (!loginCode || loginCode.length > 512) throw new Error('LOGIN_CODE_REQUIRED')

  const { OPENID, APPID } = cloud.getWXContext()
  if (!OPENID || !APPID) throw new Error('USER_CONTEXT_UNAVAILABLE')
  const config = virtualPaymentConfig(APPID)
  const loginSession = await sessionForLoginCode({
    appId: APPID,
    appSecret: config.appSecret,
    loginCode
  })
  if (loginSession.openid !== OPENID) throw new Error('LOGIN_SESSION_MISMATCH')

  const outTradeNo = createOutTradeNo()
  const signData = JSON.stringify({
    offerId: config.offerId,
    buyQuantity: 1,
    env: config.paymentEnv,
    currencyType: 'CNY',
    productId: config.productId,
    goodsPrice: product.priceFen,
    outTradeNo,
    attach: JSON.stringify({ productCode: event.productCode })
  })

  await db.collection('fitness_orders').add({
    data: {
      outTradeNo,
      openid: OPENID,
      productCode: event.productCode,
      productId: config.productId,
      amountFen: product.priceFen,
      title: product.title,
      paymentChannel: 'virtual-payment',
      paymentEnvironment: config.paymentEnv,
      status: 'pending',
      createdAt: db.serverDate()
    }
  })

  return {
    outTradeNo,
    payment: {
      signData,
      paySig: hmacSha256(config.appKey, `requestVirtualPayment&${signData}`),
      signature: hmacSha256(loginSession.session_key, signData),
      mode: 'short_series_goods'
    }
  }
}
