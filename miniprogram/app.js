const runtime = require('./utils/runtime')

App({
  onLaunch() {
    if (runtime.cloudEnv && wx.cloud) {
      wx.cloud.init({ env: runtime.cloudEnv, traceUser: true })
    }
  },
  globalData: {
    runtime,
    // Detailed reports are deliberately held in memory only. Scores, height and
    // weight are not written to storage or sent to the payment service.
    reportDraft: null
  }
})
