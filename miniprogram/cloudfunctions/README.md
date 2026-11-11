# CloudBase payment skeleton

The frontend ships with `paymentEnabled: false`, so it cannot collect money in
its current state. Keep it that way until the Mini Program's certification,
merchant binding and payment-product review are complete.

## Before enabling payment

1. Create and bind a CloudBase environment to the Mini Program AppID.
2. Create the `fitness_orders` collection. Client read/write access must be
   denied; only cloud functions should access orders.
3. Bind the approved merchant account in CloudBase's payment settings.
4. Confirm whether this paid digital report must use the platform's virtual
   payment route. Apply the route and callback shape required by that approval.
5. Set cloud-function environment variables, never source files:
   `PAYMENT_ENABLED=true`, `WECHAT_PAY_MCHID`, and `CLOUDBASE_ENV_ID`.
6. Deploy the three cloud functions and run a sandbox/production test order.
7. Only then set `paymentEnabled: true` in `utils/runtime.js` and submit a new
   Mini Program version for review.

## Privacy boundary

`createReportOrder` sends only a product code. The student's height, weight and
test results remain on the device for the basic calculation. If a future paid
report needs to upload scores, add a dedicated consent screen and a separate
server-side report function with short retention and deletion controls first.
