# 虚拟支付云函数（0.2.0）

一份详细成绩报告属于数字化内容，0.2.0 使用小程序**虚拟支付**，不使用普通
`wx.requestPayment` 或商户号 CloudPay。前端只发送商品编码和一次性登录 code；身高、
体重、体测成绩及完整报告均只在设备内存中处理。

## 上线前必须完成

1. 在小程序后台的“支付与交易 → 虚拟支付”开通能力，创建并发布价格为 1 元的
   “详细成绩报告（单次）”道具。
2. 开通 CloudBase 环境；新建 `fitness_orders` 集合，关闭客户端读写权限，仅允许云函数读写。
3. 在业务云函数的环境变量中设置下列值，**不得**写入源码、开发者工具配置或 Git：

   ```text
   VIRTUAL_PAYMENT_ENABLED=true
   WECHAT_APP_ID=小程序 AppID
   WECHAT_APP_SECRET=小程序 AppSecret
   VIRTUAL_PAY_APP_KEY=虚拟支付现网 AppKey
   VIRTUAL_PAY_OFFER_ID=虚拟支付 OfferID
   VIRTUAL_REPORT_PRODUCT_ID=已发布道具的 ProductID
   VIRTUAL_PAY_ENV=0
   ```

4. 在 CloudBase「集成中心」创建小程序虚拟支付集成，选择系统内置回调；将其生成的回调
   地址、Token、EncodingAESKey 以 JSON + 安全模式配置到小程序后台的“发货推送配置”。
   集成会生成 HTTP 云函数，名称已配置在 [`utils/runtime.js`](../utils/runtime.js)。
5. 部署更新后的 `createReportOrder` 与 `claimReport`。`createReportOrder` 只登记由集成
   中心签名的固定 1 元道具订单，`claimReport` 仅在服务端向虚拟支付平台查单确认后发放。
6. 完成 iOS 的小程序简称与 IAP 配置，并在正式环境以 1 元真实订单验证：支付、发货推送、
   查单兜底、报告解锁和退款通知。
7. 最后才将 [`utils/runtime.js`](../utils/runtime.js) 中的 `paymentEnabled` 改为 `true`，
   上传新的体验版并重新提审。

`VIRTUAL_PAY_ENV=0` 表示正式环境，且必须配套现网 AppKey；仅在开发者工具内调试时才可
临时改为 `1` 并换成沙箱 AppKey。沙箱不能用于真机预览或正式发布。`createReportOrder`
需要 `VIRTUAL_PAYMENT_ENABLED`、`WECHAT_APP_ID`、`VIRTUAL_PAY_APP_KEY`、
`VIRTUAL_PAY_OFFER_ID`、`VIRTUAL_REPORT_PRODUCT_ID` 与 `VIRTUAL_PAY_ENV`；`claimReport`
还需要 `WECHAT_APP_SECRET` 以便服务端查单。

## 订单与发货原则

- 集成中心 HTTP 云函数生成双签名；客户端不会自行构造、修改或重新序列化 `signData`。
- `createReportOrder` 会验证签名、道具 ID、金额、数量、环境和订单号后才写入订单库。
- 客户端的支付 success 回调不会直接解锁报告；`claimReport` 会在服务端查单后才授予权益。
- 退款通知由集成中心托管回调接收；iOS 的退款需按 App Store 流程处理。

## 隐私边界

订单库只保存 OpenID、商品编码、订单号、金额和状态。不要将学生的成绩、身高、体重、
报告内容、sessionKey、AppSecret 或 AppKey 写入订单、日志或客服记录。
