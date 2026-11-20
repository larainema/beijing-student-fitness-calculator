const cloud = require('wx-server-sdk')
const crypto = require('crypto')
const https = require('https')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
let accessTokenCache = { value: '', expiresAt: 0 }

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
          if (response.statusCode < 200 || response.statusCode >= 300) return reject(new Error(`WECHAT_HTTP_${response.statusCode}`))
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

function paymentConfig(appId) {
  const configuredAppId = process.env.WECHAT_APP_ID
  const appSecret = process.env.WECHAT_APP_SECRET
  const appKey = process.env.VIRTUAL_PAY_APP_KEY
  if (process.env.VIRTUAL_PAYMENT_ENABLED !== 'true' || !configuredAppId || !appSecret || !appKey) {
    throw new Error('VIRTUAL_PAYMENT_NOT_CONFIGURED')
  }
  if (configuredAppId !== appId) throw new Error('APPID_CONFIGURATION_MISMATCH')
  return { configuredAppId, appSecret, appKey }
}

async function accessToken(config) {
  if (accessTokenCache.value && accessTokenCache.expiresAt > Date.now()) return accessTokenCache.value
  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${encodeURIComponent(config.configuredAppId)}&secret=${encodeURIComponent(config.appSecret)}`
  const response = await requestJson(url)
  if (!response.access_token) throw new Error('ACCESS_TOKEN_UNAVAILABLE')
  accessTokenCache = {
    value: response.access_token,
    expiresAt: Date.now() + Math.max(60, Number(response.expires_in || 7200) - 120) * 1000
  }
  return accessTokenCache.value
}

async function deliverOrder(order) {
  if (order.status === 'delivered') return true
  await db.collection('fitness_orders').doc(order._id).update({
    data: { status: 'delivered', deliveredAt: db.serverDate() }
  })
  return true
}

exports.main = async event => {
  const outTradeNo = String(event.outTradeNo || '')
  if (!/^FIT[A-Z0-9]{16,29}$/.test(outTradeNo)) throw new Error('ORDER_NUMBER_INVALID')
  const { OPENID, APPID } = cloud.getWXContext()
  if (!OPENID || !APPID) throw new Error('USER_CONTEXT_UNAVAILABLE')

  const local = await db.collection('fitness_orders').where({ outTradeNo, openid: OPENID }).get()
  if (!local.data.length) return { entitled: false }
  const order = local.data[0]
  if (order.status === 'delivered') return { entitled: true, productCode: order.productCode }
  if (order.status === 'refunded') return { entitled: false, refunded: true }

  const config = paymentConfig(APPID)
  const queryBody = { openid: OPENID, env: 0, order_id: outTradeNo }
  const bodyText = JSON.stringify(queryBody)
  const token = await accessToken(config)
  const paySig = hmacSha256(config.appKey, `/xpay/query_order&${bodyText}`)
  const response = await requestJson(`https://api.weixin.qq.com/xpay/query_order?access_token=${encodeURIComponent(token)}&pay_sig=${encodeURIComponent(paySig)}`, {
    method: 'POST',
    body: queryBody
  })
  if (response.errcode && response.errcode !== 0) throw new Error('ORDER_QUERY_FAILED')

  const status = Number(response.order && response.order.status)
  if (status === 2 || status === 4) {
    await deliverOrder(order)
    return { entitled: true, productCode: order.productCode }
  }
  if (status === 5 || status === 8) {
    await db.collection('fitness_orders').doc(order._id).update({ data: { status: 'refunded', refundedAt: db.serverDate() } })
  }
  return { entitled: false }
}
