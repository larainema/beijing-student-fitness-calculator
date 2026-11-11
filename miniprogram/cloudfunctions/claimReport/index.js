const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async event => {
  const { OPENID } = cloud.getWXContext()
  const result = await db.collection('fitness_orders').where({
    outTradeNo: event.outTradeNo,
    openid: OPENID,
    status: 'paid'
  }).get()

  if (!result.data.length) return { entitled: false }
  const order = result.data[0]
  await db.collection('fitness_orders').doc(order._id).update({
    data: { claimedAt: db.serverDate() }
  })
  return { entitled: true, productCode: order.productCode }
}
