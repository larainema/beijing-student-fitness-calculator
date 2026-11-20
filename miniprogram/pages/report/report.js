Page({
  data: { report: null },

  onLoad() {
    const report = getApp().globalData.reportDraft
    if (!report) {
      wx.showModal({
        title: '报告已失效',
        content: '详细报告仅保存在本次使用会话中，请返回重新计算。',
        showCancel: false,
        complete: () => wx.navigateBack()
      })
      return
    }
    this.setData({ report })
  },

  contactService() {
    // The native contact entry keeps after-sales requests inside WeChat and
    // avoids collecting a student's score or contact details in this page.
  }
})
