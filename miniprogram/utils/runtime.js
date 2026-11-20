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
  productCode: 'fitness-detail-report-v2',
  priceFen: 100,
  minBaseLibrary: '4.4.8'
}
