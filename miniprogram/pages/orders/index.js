const statusText = {
  pending: '待支付确认',
  delivered: '已交付',
  refunded: '已退款'
}

function formatTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = part => String(part).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function presentOrder(order) {
  const outTradeNo = String(order.outTradeNo || '')
  return {
    ...order,
    amountText: `¥${(Number(order.amountFen || 0) / 100).toFixed(2)}`,
    statusText: statusText[order.status] || '处理中',
    orderSuffix: outTradeNo ? outTradeNo.slice(-8) : '—',
    createdText: formatTime(order.createdAt)
  }
}

Page({
  data: {
    loading: true,
    orders: []
  },

  onLoad() {
    this.loadOrders()
  },

  onPullDownRefresh() {
    this.loadOrders(() => wx.stopPullDownRefresh())
  },

  loadOrders(done) {
    this.setData({ loading: true })
    wx.cloud.callFunction({
      name: 'listReportOrders',
      success: response => {
        const orders = (response.result && response.result.orders) || []
        this.setData({ orders: orders.map(presentOrder), loading: false })
      },
      fail: () => {
        this.setData({ loading: false })
        wx.showToast({ title: '订单加载失败，请稍后重试', icon: 'none' })
      },
      complete: () => {
        if (typeof done === 'function') done()
      }
    })
  }
})
