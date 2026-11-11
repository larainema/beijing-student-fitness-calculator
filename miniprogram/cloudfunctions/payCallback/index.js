const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async event => {
  // CloudPay callback payload field names depend on the enabled payment product.
  // Verify the production callback payload in the CloudBase test environment
  // before publishing, then keep this handler idempotent.
  const payload = event.data || event
  const outTradeNo = payload.outTradeNo || payload.out_trade_no
  const paid = payload.returnCode === 'SUCCESS' || payload.trade_state === 'SUCCESS'

  if (!outTradeNo || !paid) return { errcode: 0 }

  const existing = await db.collection('fitness_orders').where({ outTradeNo }).get()
  if (!existing.data.length) return { errcode: 0 }

  const order = existing.data[0]
  if (order.status !== 'paid') {
    await db.collection('fitness_orders').doc(order._id).update({
      data: {
        status: 'paid',
        paidAt: db.serverDate(),
        transactionId: payload.transactionId || payload.transaction_id || ''
      }
    })
  }
  return { errcode: 0 }
}
