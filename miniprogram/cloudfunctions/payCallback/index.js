const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

function unpack(event) {
  const payload = event && event.data ? event.data : event
  if (typeof payload !== 'string') return payload || {}
  try { return JSON.parse(payload) } catch (error) { return {} }
}

function callbackEvent(payload) {
  return payload.Event || payload.event || payload.EventType || payload.event_type || ''
}

function outTradeNo(payload) {
  return payload.OutTradeNo || payload.outTradeNo || payload.out_trade_no || ''
}

function platformOrderNo(payload) {
  const payment = payload.WeChatPayInfo || payload.wechatPayInfo || {}
  return payment.MchOrderNo || payment.mchOrderNo || payload.wx_order_id || ''
}

function productId(payload) {
  const goods = payload.GoodsInfo || payload.goodsInfo || {}
  return goods.ProductId || goods.productId || ''
}

function callbackAck() {
  return { ErrCode: 0, ErrMsg: 'success' }
}

exports.main = async event => {
  const context = cloud.getWXContext()
  // Client calls carry an OPENID. Delivery notifications are invoked by the
  // configured platform callback and must not be forgeable from the Mini Program.
  if (context.OPENID || context.FROM_OPENID) return callbackAck()

  const payload = unpack(event)
  const type = callbackEvent(payload)
  const tradeNo = outTradeNo(payload)
  if (!tradeNo) return callbackAck()

  const result = await db.collection('fitness_orders').where({ outTradeNo: tradeNo }).get()
  if (!result.data.length) return callbackAck()
  const order = result.data[0]

  if (type === 'xpay_goods_deliver_notify') {
    const receivedProductId = productId(payload)
    if (receivedProductId && receivedProductId !== order.productId) return callbackAck()
    if (order.status !== 'delivered') {
      await db.collection('fitness_orders').doc(order._id).update({
        data: {
          status: 'delivered',
          paidAt: db.serverDate(),
          deliveredAt: db.serverDate(),
          platformOrderNo: platformOrderNo(payload)
        }
      })
    }
    return callbackAck()
  }

  if (type === 'xpay_refund_notify' && (payload.RetCode === 0 || payload.RetCode === '0')) {
    await db.collection('fitness_orders').doc(order._id).update({
      data: { status: 'refunded', refundedAt: db.serverDate() }
    })
  }
  return callbackAck()
}
