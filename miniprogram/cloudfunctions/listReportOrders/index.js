const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// Order history is only available to the WeChat user who placed the order.
// Fitness scores and reports are deliberately never stored in this collection.
exports.main = async () => {
  const { OPENID } = cloud.getWXContext()
  if (!OPENID) throw new Error('USER_CONTEXT_UNAVAILABLE')

  const result = await db.collection('fitness_orders')
    .where({ openid: OPENID })
    .orderBy('createdAt', 'desc')
    .limit(50)
    .field({
      outTradeNo: true,
      title: true,
      amountFen: true,
      status: true,
      createdAt: true,
      paidAt: true,
      deliveredAt: true,
      refundedAt: true
    })
    .get()

  return { orders: result.data }
}
