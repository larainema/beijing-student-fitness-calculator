# 虚拟支付云函数（0.2.0）

一份详细成绩报告属于数字化内容，0.2.0 使用小程序**虚拟支付**，不使用普通
`wx.requestPayment` 或商户号 CloudPay。前端只发送商品编码和一次性登录 code；身高、
体重、体测成绩及完整报告均只在设备内存中处理。

## 上线前必须完成

1. 在小程序后台的“支付与交易 → 虚拟支付”开通能力，创建并发布价格为 1 元的
   “详细成绩报告（单次）”道具。
2. 开通 CloudBase 环境；新建 `fitness_orders` 集合，关闭客户端读写权限，仅允许云函数读写。
3. 在三个云函数的环境变量中设置下列值，**不得**写入源码、开发者工具配置或 Git：

   ```text
   VIRTUAL_PAYMENT_ENABLED=true
   WECHAT_APP_ID=小程序 AppID
   WECHAT_APP_SECRET=小程序 AppSecret
   VIRTUAL_PAY_APP_KEY=虚拟支付现网 AppKey
   VIRTUAL_PAY_OFFER_ID=虚拟支付 OfferID
   VIRTUAL_REPORT_PRODUCT_ID=已发布道具的 ProductID
   ```

4. 部署 `createReportOrder`、`claimReport` 与 `payCallback`。为 `payCallback` 配置虚拟
   支付的发货、退款通知；此回调只能通过平台消息推送触发，不能由客户端直接调用。
5. 完成 iOS 的小程序简称与 IAP 配置，并在正式环境以 1 元真实订单验证：支付、发货通知、
   查单兜底、报告解锁和退款通知。
6. 最后才将 [`utils/runtime.js`](../utils/runtime.js) 中的 `paymentEnabled` 改为 `true`，
   上传新的体验版并重新提审。

## 订单与发货原则

- `createReportOrder` 只生成唯一订单号和虚拟支付双签名；金额和 ProductID 均在服务端固定。
- `payCallback` 以平台订单号幂等发货；客户端的支付 success 回调不会直接解锁报告。
- `claimReport` 会在回调延迟时向平台查单，只有确认已支付/已发货才授予报告权益。
- 退款通知会将订单标记为已退款；iOS 的退款需按 App Store 流程处理。

## 隐私边界

订单库只保存 OpenID、商品编码、订单号、金额和状态。不要将学生的成绩、身高、体重、
报告内容、sessionKey、AppSecret 或 AppKey 写入订单、日志或客服记录。
