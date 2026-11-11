const { calculate, formItems } = require('../../utils/fitness')
const runtime = require('../../utils/runtime')

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
    avatar: '/assets/avatar.png',
    grade: '8',
    sex: 'male',
    grades: [{ key: '4', label: '四年级' }, { key: '6', label: '六年级' }, { key: '8', label: '八年级' }],
    sexes: [{ key: 'male', label: '男生' }, { key: 'female', label: '女生' }],
    values: emptyValues(),
    formItems: formItems('8', 'male'),
    result: { complete: false },
    paymentEnabled: runtime.paymentEnabled,
    reportUnlocked: false,
    loadingPayment: false
  },

  onLoad() {
    this.refreshCalculation()
  },

  onGradeTap(event) {
    this.setData({ grade: event.currentTarget.dataset.grade, reportUnlocked: false }, () => this.refreshCalculation())
  },

  onSexTap(event) {
    this.setData({ sex: event.currentTarget.dataset.sex, reportUnlocked: false }, () => this.refreshCalculation())
  },

  onFieldInput(event) {
    const key = event.currentTarget.dataset.key
    this.setData({ [`values.${key}`]: event.detail.value, reportUnlocked: false }, () => this.refreshCalculation())
  },

  useSample() {
    this.setData({ values: { ...emptyValues(), ...samples[this.data.grade][this.data.sex] }, reportUnlocked: false }, () => this.refreshCalculation())
  },

  clearValues() {
    this.setData({ values: emptyValues(), reportUnlocked: false }, () => this.refreshCalculation())
  },

  refreshCalculation() {
    const { grade, sex, values } = this.data
    const result = toViewResult(calculate({ grade, sex, values }), grade)
    this.setData({ formItems: formItems(grade, sex), result })
  },

  unlockReport() {
    if (!this.data.result.complete) {
      wx.showToast({ title: '请先完成本年级全部统测项目', icon: 'none' })
      return
    }
    if (!this.data.paymentEnabled) {
      wx.showModal({
        title: '付费报告准备中',
        content: '基础成绩计算全程在本机完成。待商户号、支付产品和云开发环境绑定完成后，可支付 1 元解锁完整报告。',
        showCancel: false
      })
      return
    }
    this.createPayment()
  },

  createPayment() {
    this.setData({ loadingPayment: true })
    wx.cloud.callFunction({
      name: 'createReportOrder',
      data: { productCode: runtime.productCode },
      success: response => {
        const { payment, outTradeNo } = response.result || {}
        if (!payment || !outTradeNo) throw new Error('支付参数不完整')
        wx.requestPayment({
          ...payment,
          success: () => this.claimReport(outTradeNo),
          fail: () => wx.showToast({ title: '支付未完成', icon: 'none' }),
          complete: () => this.setData({ loadingPayment: false })
        })
      },
      fail: error => {
        this.setData({ loadingPayment: false })
        wx.showToast({ title: error.errMsg || '暂时无法创建订单', icon: 'none' })
      }
    })
  },

  claimReport(outTradeNo) {
    wx.cloud.callFunction({
      name: 'claimReport',
      data: { outTradeNo },
      success: response => {
        if (response.result && response.result.entitled) {
          this.setData({ reportUnlocked: true })
          wx.showToast({ title: '报告已解锁', icon: 'success' })
        } else {
          wx.showToast({ title: '正在确认支付，请稍后重试', icon: 'none' })
        }
      },
      fail: () => wx.showToast({ title: '支付确认失败，请稍后重试', icon: 'none' })
    })
  }
})
