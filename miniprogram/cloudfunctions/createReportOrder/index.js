const cloud = require('wx-server-sdk')
const crypto = require('crypto')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const CATALOG = {
  'fitness-detail-report-v2': {
    title: '缇杞体测详细成绩报告（单次）',
    priceFen: 100
  }
}

function hmacSha256(key, content) {
  return crypto.createHmac('sha256', key).update(content).digest('hex')
}

function signaturesMatch(actual, expected) {
  const actualBuffer = Buffer.from(String(actual), 'utf8')
  const expectedBuffer = Buffer.from(String(expected), 'utf8')
  return actualBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(actualBuffer, expectedBuffer)
}

function paymentConfig(appId) {
  const enabled = process.env.VIRTUAL_PAYMENT_ENABLED === 'true'
  const appKey = process.env.VIRTUAL_PAY_APP_KEY
  const offerId = String(process.env.VIRTUAL_PAY_OFFER_ID || '')
  const productId = String(process.env.VIRTUAL_REPORT_PRODUCT_ID || '')
  const configuredAppId = process.env.WECHAT_APP_ID
  const paymentEnv = Number(process.env.VIRTUAL_PAY_ENV || '0')
  if (!enabled || !appKey || !offerId || !productId || !configuredAppId) {
    throw new Error('VIRTUAL_PAYMENT_NOT_CONFIGURED')
  }
  if (configuredAppId !== appId) throw new Error('APPID_CONFIGURATION_MISMATCH')
  if (paymentEnv !== 0 && paymentEnv !== 1) throw new Error('VIRTUAL_PAYMENT_ENV_INVALID')
  return { appKey, offerId, productId, paymentEnv }
}

/**
 * The CloudBase integration creates the signing payload. This function checks
 * that the exact raw payload was signed by our virtual-payment AppKey before
 * persisting a local entitlement record. It never trusts price, product, or
 * order fields sent separately by the Mini Program.
 */
function verifiedPayment(event, config, product) {
  const signData = String(event.signData || '')
  const paySig = String(event.paySig || '')
  if (!signData || signData.length > 8192 || !paySig) throw new Error('PAYMENT_SIGNATURE_REQUIRED')
  const expectedPaySig = hmacSha256(config.appKey, `requestVirtualPayment&${signData}`)
  if (!signaturesMatch(paySig, expectedPaySig)) throw new Error('PAYMENT_SIGNATURE_INVALID')

  let payment
  try {
    payment = JSON.parse(signData)
  } catch (error) {
    throw new Error('PAYMENT_PAYLOAD_INVALID')
  }

  const outTradeNo = String(payment.outTradeNo || '')
  if (!/^[A-Za-z0-9_-]{8,128}$/.test(outTradeNo)) throw new Error('ORDER_NUMBER_INVALID')
  if (
    String(payment.offerId || '') !== config.offerId ||
    String(payment.productId || '') !== config.productId ||
    Number(payment.goodsPrice) !== product.priceFen ||
    Number(payment.buyQuantity) !== 1 ||
    Number(payment.env) !== config.paymentEnv
  ) {
    throw new Error('PAYMENT_PRODUCT_MISMATCH')
  }
  return { outTradeNo }
}

exports.main = async event => {
  const product = CATALOG[event.productCode]
  if (!product) throw new Error('UNSUPPORTED_PRODUCT')

  const { OPENID, APPID } = cloud.getWXContext()
  if (!OPENID || !APPID) throw new Error('USER_CONTEXT_UNAVAILABLE')
  const config = paymentConfig(APPID)
  const { outTradeNo } = verifiedPayment(event, config, product)

  const existing = await db.collection('fitness_orders').where({ outTradeNo }).get()
  if (existing.data.length) {
    const order = existing.data[0]
    if (order.openid !== OPENID || order.productCode !== event.productCode) {
      throw new Error('ORDER_ALREADY_REGISTERED')
    }
    return { outTradeNo, status: order.status }
  }

  await db.collection('fitness_orders').add({
    data: {
      outTradeNo,
      openid: OPENID,
      productCode: event.productCode,
      productId: config.productId,
      amountFen: product.priceFen,
      title: product.title,
      paymentChannel: 'virtual-payment',
      paymentProvider: 'cloudbase-integration',
      paymentEnvironment: config.paymentEnv,
      status: 'pending',
      createdAt: db.serverDate()
    }
  })
  return { outTradeNo, status: 'pending' }
}
