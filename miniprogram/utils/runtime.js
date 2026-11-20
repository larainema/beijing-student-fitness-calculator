/**
 * Production deployment settings.
 *
 * Keep `cloudEnv` empty until a CloudBase environment has been created and
 * linked to this AppID. Do not put merchant API keys, certificates, AppSecret
 * or personal data in this file or in the mini-program bundle.
 */
module.exports = {
  cloudEnv: 'tiqi-fitness-prod-d3dcyb8e5fd44c',
  // A detailed report is a digital service. Enable only after the Mini Program
  // virtual-payment product, CloudBase secrets and delivery callback are live.
  paymentEnabled: false,
  paymentMode: 'virtual-payment',
  // Created and managed by CloudBase Integration Center. Its generated name
  // is bound to the callback domain, so it must not be renamed in the console.
  virtualPaymentFunction: 'tiqi-virtual-payment-e70w07es-demo-scfweb',
  productCode: 'fitness-detail-report-v2',
  productId: 'fitness_detail',
  priceFen: 100,
  minBaseLibrary: '4.4.8'
}
