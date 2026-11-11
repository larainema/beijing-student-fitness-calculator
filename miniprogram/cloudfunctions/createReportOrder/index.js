const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// The catalog and price live on the server. Never accept an amount from a client.
const CATALOG = {
  'fitness-detail-report-v1': {
    title: '北京体测完整成绩报告（单次）',
    priceFen: 100
  }
}

function createOutTradeNo() {
  return `FIT${Date.now()}${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`
}

exports.main = async event => {
  const product = CATALOG[event.productCode]
  if (!product) throw new Error('UNSUPPORTED_PRODUCT')

  const { OPENID, ENV } = cloud.getWXContext()
  const outTradeNo = createOutTradeNo()
  const paymentEnabled = process.env.PAYMENT_ENABLED === 'true'
  const merchantId = process.env.WECHAT_PAY_MCHID
  const envId = process.env.CLOUDBASE_ENV_ID || ENV

  await db.collection('fitness_orders').add({
    data: {
      outTradeNo,
      openid: OPENID,
      productCode: event.productCode,
      amountFen: product.priceFen,
      title: product.title,
      status: 'pending',
      createdAt: db.serverDate()
    }
  })

  // This guard intentionally makes real collection impossible before the
  // merchant relationship and the platform-approved payment product are ready.
  if (!paymentEnabled || !merchantId || !envId) {
    throw new Error('PAYMENT_NOT_CONFIGURED')
  }

  const response = await cloud.cloudPay.unifiedOrder({
    body: product.title,
    outTradeNo,
    spbillCreateIp: '127.0.0.1',
    subMchId: merchantId,
    totalFee: product.priceFen,
    envId,
    functionName: 'payCallback'
  })

  if (!response.payment) throw new Error('PAYMENT_ORDER_FAILED')
  return { outTradeNo, payment: response.payment }
}
