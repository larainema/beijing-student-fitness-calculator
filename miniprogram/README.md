# 缇杞体测 - 微信小程序

面向北京四、六、八年级学生的体质健康测试成绩估算工具，使用 AppID
`wx21df37352e34d7e5`。0.2.0 新增本地生成的详细成绩报告，以及为 1 元单次报告准备的
微信虚拟支付接入。

## 已实现

- 四、六、八年级男女生项目、附加分和统测折算；
- 天空蓝界面与小程序头像（[`assets/avatar.jpg`](assets/avatar.jpg)，512 × 512 像素）；
- 详细报告：单项评分、权重、优先提升项与下一评分档目标；
- 体测数据仅在当前设备内存中计算，订单服务不接收成绩或报告内容；
- 虚拟支付下单、发货回调和查单兜底代码，默认关闭，不能在未配置时收款。

## 本地预览

1. 打开微信开发者工具，选择“导入项目”，目录选本 `miniprogram/` 文件夹。
2. AppID 已在 `project.config.json` 配置。不要把 AppSecret 写入项目文件。
3. 使用“编译”预览基础计算器和本地详细报告；支付开关默认关闭。

## 0.2.0 详细报告与虚拟支付

1. 在微信公众平台完成小程序认证、备案、工具类目和虚拟支付能力开通。
2. 在微信开发者工具开通 CloudBase 环境，并将环境 ID 填入 `utils/runtime.js` 的 `cloudEnv`。
3. 在 CloudBase 数据库创建 `fitness_orders` 集合，禁止客户端直接读写订单。
4. 依照 [`cloudfunctions/README.md`](cloudfunctions/README.md) 创建价格为 1 元的虚拟支付道具，配置密钥、部署云函数并设置发货通知。
5. 测试真实的小额订单、支付回调、查单兜底和售后流程后，才将 `utils/runtime.js` 的 `paymentEnabled` 改为 `true`，重新提审小程序。

## 隐私边界

基础计算与报告在设备内存中进行。订单云函数只接收产品编码和一次性登录 code，不接收身高、
体重、体测成绩或报告内容。若未来的付费报告要发送成绩到服务端，必须先增加单独的敏感信息
告知与同意页面、短期留存策略和删除入口。

## 校验

安装依赖后运行：

```bash
npm test
npm run ci -- --help
```

上传时建议附加 `--enable-minify`，以压缩 WXML、WXSS 与 JavaScript。

## CI 上传工具

项目将微信官方 `miniprogram-ci` 锁定为本地开发依赖。通过 CI 上传体验版或正式版时，需要从
微信公众平台生成上传密钥。密钥文件不得提交、不得发送到聊天中；本目录的 `.gitignore` 已忽略
常见私钥文件名。具体参数以[微信小程序 CI 文档](https://developers.weixin.qq.com/miniprogram/dev/devtools/ci.html)为准。
