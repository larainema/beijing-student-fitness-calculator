const runtime = require('./runtime')

function parseBody(data) {
  if (typeof data !== 'string') return data || {}
  try {
    return JSON.parse(data)
  } catch (error) {
    throw new Error('XPAY_RESPONSE_INVALID')
  }
}

/**
 * Call the HTTP cloud function provisioned by CloudBase Integration Center.
 * The CloudBase gateway injects the Mini Program user context; no payment
 * credential or callback address is shipped in the client bundle.
 */
function callXpay(path, data) {
  return new Promise((resolve, reject) => {
    wx.cloud.callHTTPFunction({
      name: runtime.virtualPaymentFunction,
      config: { env: runtime.cloudEnv },
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      path,
      data,
      success: response => {
        try {
          resolve(parseBody(response.data))
        } catch (error) {
          reject(error)
        }
      },
      fail: error => reject(new Error(error.errMsg || 'XPAY_REQUEST_FAILED'))
    })
  })
}

module.exports = { callXpay }
