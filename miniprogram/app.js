const runtime = require('./utils/runtime')

App({
  onLaunch() {
    if (runtime.cloudEnv && wx.cloud) {
      wx.cloud.init({ env: runtime.cloudEnv, traceUser: true })
    }
  },
  globalData: { runtime }
})
