const { calculate, formItems } = require('../../utils/fitness')
const { buildReport } = require('../../utils/report')
const runtime = require('../../utils/runtime')
const { callXpay } = require('../../utils/xpay')

const emptyValues = () => ({
  height: '', weight: '', vital: '', sprint: '', flexibility: '', rope: '',
  situps: '', shuttle: '', jump: '', strength: '', endurance: '', knowledge: ''
})

const samples = {
  '4': {
    male: { height: '135', weight: '31', vital: '2200', sprint: '9.5', flexibility: '10', rope: '120', situps: '32' },
    female: { height: '133', weight: '29', vital: '1750', sprint: '9.8', flexibility: '14', rope: '132', situps: '34' }
  },
  '6': {
    male: { height: '150', weight: '42', vital: '2700', sprint: '8.8', flexibility: '10', rope: '145', situps: '38', shuttle: '1:45' },
    female: { height: '150', weight: '39', vital: '2250', sprint: '9.2', flexibility: '14', rope: '150', situps: '40', shuttle: '1:58' }
  },
  '8': {
    male: { height: '168', weight: '56', vital: '3200', sprint: '8.8', flexibility: '9.5', jump: '205', strength: '11', endurance: '4:18', knowledge: '82' },
    female: { height: '160', weight: '50', vital: '2600', sprint: '9.1', flexibility: '15', jump: '178', strength: '42', endurance: '4:16', knowledge: '82' }
  }
}

function toViewResult(calculation, grade) {
  if (!calculation.complete) return { complete: false }
  return {
    ...calculation,
    bmiText: calculation.bmi.toFixed(1),
    standardText: calculation.standard.toFixed(1),
    nationalText: calculation.national.toFixed(1),
    bonusText: `+${calculation.bonus}`,
    processText: calculation.process === null ? '待机考' : calculation.process.toFixed(1),
    hasProcess: grade === '8',
    detailItems: calculation.items.map(item => ({ ...item, contributionText: item.contribution.toFixed(1) }))
  }
}

Page({
  data: {
    appIntro: '北京四、六、八年级学生体测成绩估算工具，支持男女生项目、附加分与统测折算。',
    avatar: '/assets/avatar.jpg',
    grade: '8',
    sex: 'male',
    grades: [{ key: '4', label: '四年级' }, { key: '6', label: '六年级' }, { key: '8', label: '八年级' }],
    sexes: [{ key: 'male', label: '男生' }, { key: 'female', label: '女生' }],
    values: emptyValues(),
    formItems: formItems('8', 'male'),
    result: { complete: false },
    paymentEnabled: runtime.paymentEnabled,
    virtualPaymentSupported: false,
    reportUnlocked: false,
    termsAccepted: false,
    pendingOrderNo: '',
    loadingPayment: false
  },

  onLoad() {
    this.setData({ virtualPaymentSupported: typeof wx.requestVirtualPayment === 'function' })
    this.refreshCalculation()
  },

  onGradeTap(event) {
    this.setData({
      grade: event.currentTarget.dataset.grade,
      reportUnlocked: false,
      termsAccepted: false,
      pendingOrderNo: ''
    }, () => this.refreshCalculation())
  },

  onSexTap(event) {
    this.setData({
      sex: event.currentTarget.dataset.sex,
      reportUnlocked: false,
      termsAccepted: false,
      pendingOrderNo: ''
    }, () => this.refreshCalculation())
  },

  onFieldInput(event) {
    const key = event.currentTarget.dataset.key
    this.setData({
      [`values.${key}`]: event.detail.value,
      reportUnlocked: false,
      termsAccepted: false,
      pendingOrderNo: ''
    }, () => this.refreshCalculation())
  },

  useSample() {
    this.setData({
      values: { ...emptyValues(), ...samples[this.data.grade][this.data.sex] },
      reportUnlocked: false,
      termsAccepted: false,
      pendingOrderNo: ''
    }, () => this.refreshCalculation())
  },

  clearValues() {
    this.setData({
      values: emptyValues(),
      reportUnlocked: false,
      termsAccepted: false,
      pendingOrderNo: ''
    }, () => this.refreshCalculation())
  },

  refreshCalculation() {
    const { grade, sex, values } = this.data
    const result = toViewResult(calculate({ grade, sex, values }), grade)
    this.setData({ formItems: formItems(grade, sex), result })
  },

  prepareReportDraft() {
    const calculation = calculate({
      grade: this.data.grade,
      sex: this.data.sex,
      values: this.data.values
    })
    if (!calculation.complete) throw new Error('INCOMPLETE_CALCULATION')
    const report = buildReport({ grade: this.data.grade, sex: this.data.sex, calculation })
    getApp().globalData.reportDraft = report
    return report
  },

  toggleTerms() {
    this.setData({ termsAccepted: !this.data.termsAccepted })
  },

  openServiceTerms() {
    wx.navigateTo({ url: '/pages/service/service' })
  },

  openDetailedReport() {
    try {
      this.prepareReportDraft()
      wx.navigateTo({ url: '/pages/report/report' })
    } catch (error) {
      wx.showToast({ title: '请先完成全部必测项目', icon: 'none' })
    }
  },

  unlockReport() {
    if (!this.data.result.complete) {
      wx.showToast({ title: '请先完成本年级全部统测项目', icon: 'none' })
      return
    }
    if (this.data.reportUnlocked) {
      this.openDetailedReport()
      return
    }
    if (!this.data.termsAccepted) {
      wx.showToast({ title: '请先阅读并同意服务说明', icon: 'none' })
      return
    }
    this.prepareReportDraft()
    if (this.data.pendingOrderNo) {
      this.claimReport(this.data.pendingOrderNo)
      return
    }
    if (!this.data.paymentEnabled) {
      wx.showModal({
        title: '付费报告准备中',
        content: '基础成绩计算全程在本机完成。待虚拟支付道具、云开发环境和发货回调配置完成后，方可支付 1 元解锁详细报告。',
        showCancel: false
      })
      return
    }
    if (!this.data.virtualPaymentSupported) {
      wx.showModal({
        title: '请升级微信',
        content: `当前微信版本不支持虚拟支付，请升级到支持该能力的版本后重试。`,
        showCancel: false
      })
      return
    }
    this.createVirtualPayment()
  },

  createVirtualPayment() {
    this.setData({ loadingPayment: true })
    wx.login({
      success: loginResult => {
        if (!loginResult.code) {
          this.setData({ loadingPayment: false })
          wx.showToast({ title: '无法创建支付会话，请重试', icon: 'none' })
          return
        }
        // The integration function creates exactly the payment signatures.
        // It does not unlock a report: the normal cloud function below first
        // records a server-verified order, then claimReport verifies payment.
        callXpay('/xpay/create_order', {
          code: loginResult.code,
          productId: runtime.productId,
          goodsPrice: runtime.priceFen,
          buyQuantity: 1
        }).then(xpayResponse => {
          if (!xpayResponse || xpayResponse.code !== 0 || !xpayResponse.data) {
            this.setData({ loadingPayment: false })
            wx.showToast({ title: (xpayResponse && xpayResponse.msg) || '暂时无法创建订单', icon: 'none' })
            return
          }
          const payment = xpayResponse.data
          wx.cloud.callFunction({
            name: 'createReportOrder',
            data: {
              productCode: runtime.productCode,
              signData: payment.signData,
              paySig: payment.paySig
            },
            success: response => {
              const { outTradeNo } = response.result || {}
              if (!outTradeNo) {
                this.setData({ loadingPayment: false })
                wx.showToast({ title: '订单登记失败，请稍后重试', icon: 'none' })
                return
              }
              this.setData({ pendingOrderNo: outTradeNo })
              // Do not parse and stringify signData: its original byte order
              // is part of the payment signature.
              wx.requestVirtualPayment({
                signData: payment.signData,
                paySig: payment.paySig,
                signature: payment.signature,
                mode: payment.mode,
                success: () => this.claimReport(outTradeNo),
                fail: error => {
                  this.setData({ loadingPayment: false })
                  const cancelled = /cancel/i.test(error.errMsg || '')
                  wx.showToast({ title: cancelled ? '已取消支付' : '支付未完成', icon: 'none' })
                }
              })
            },
            fail: error => {
              this.setData({ loadingPayment: false })
              wx.showToast({ title: error.errMsg || '订单登记失败，请稍后重试', icon: 'none' })
            }
          })
        }).catch(error => {
          this.setData({ loadingPayment: false })
          wx.showToast({ title: error.message || '暂时无法创建订单', icon: 'none' })
        })
      },
      fail: () => {
        this.setData({ loadingPayment: false })
        wx.showToast({ title: '无法创建支付会话，请重试', icon: 'none' })
      }
    })
  },

  claimReport(outTradeNo) {
    wx.cloud.callFunction({
      name: 'claimReport',
      data: { outTradeNo },
      success: response => {
        if (response.result && response.result.entitled) {
          this.setData({ reportUnlocked: true, pendingOrderNo: '', loadingPayment: false })
          wx.showToast({ title: '报告已解锁', icon: 'success' })
          setTimeout(() => this.openDetailedReport(), 350)
        } else {
          this.setData({ loadingPayment: false, pendingOrderNo: outTradeNo })
          wx.showToast({ title: '正在确认支付，可稍后点击确认', icon: 'none' })
        }
      },
      fail: () => {
        this.setData({ loadingPayment: false, pendingOrderNo: outTradeNo })
        wx.showToast({ title: '支付确认失败，可稍后重试', icon: 'none' })
      }
    })
  }
})
