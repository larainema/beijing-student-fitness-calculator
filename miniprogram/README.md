# 北京体测成绩助手 - 微信小程序

这是当前网页计算器的原生微信小程序版本，使用用户提供的 AppID：`wx21df37352e34d7e5`。

## 可直接使用的资料

- 名称：北京体测成绩助手
- 备选名称：北京体测成绩工具
- 介绍：北京四、六、八年级学生体测成绩估算工具，支持男女生项目、附加分与统测折算。
- 头像：[`assets/avatar.png`](assets/avatar.png)，1254 × 1254 像素、天空蓝背景，适合圆形裁切。

## 本地预览

1. 打开微信开发者工具。
2. 选择“导入项目”，目录选择本 `miniprogram/` 文件夹。
3. AppID 已在 `project.config.json` 配置。不要把 AppSecret 写入项目文件。
4. 使用“编译”预览基础计算器；支付开关默认关闭。

## 上线前的云开发与支付步骤

1. 在微信公众平台完成小程序认证、备案及服务类目配置。
2. 在微信开发者工具开通 CloudBase 环境，并将环境 ID 填入 `utils/runtime.js` 的 `cloudEnv`。
3. 在 CloudBase 数据库创建 `fitness_orders` 集合，禁止客户端直接读写订单。
4. 完成微信支付商户号与小程序 AppID 的绑定，并确认“一次完整成绩报告”的支付产品与审核路径。
5. 按 [`cloudfunctions/README.md`](cloudfunctions/README.md) 设置云函数环境变量、部署函数，并完成真实金额测试。
6. 测试支付回调和退款/客服流程后，才将 `utils/runtime.js` 的 `paymentEnabled` 改为 `true`，重新提审小程序。

## 隐私边界

基础计算在设备端进行。订单云函数只接收产品编码，不接收身高、体重或体测成绩。若未来的付费报告要发送成绩到服务端，必须先增加单独的敏感信息告知与同意页面、短期留存策略和删除入口。

## 校验

无需 npm 依赖。可以运行以下命令检查核心计算文件：

```bash
node --check miniprogram/utils/fitness.js
```

## CI 上传工具

项目将微信官方 `miniprogram-ci` 锁定为本地开发依赖。安装后可验证命令：

```bash
npm install
npm run ci -- --help
```

通过 CI 上传体验版或正式版时，需要从微信公众平台生成上传密钥。密钥文件不得提交、不得发送到聊天中；本目录的 `.gitignore` 已忽略常见私钥文件名。具体参数以[微信小程序 CI 文档](https://developers.weixin.qq.com/miniprogram/dev/devtools/ci.html)为准。
