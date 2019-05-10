const api = require('../../utils/request');

Page({
  data: {
    address: '香格大厦',
    paidAmount: 10,
    paymentTime: '2018-09-08 10.30',
    paymentId: 2,
    isPay: 1,
    chargeTime: '1小时32分钟',
    electricity: '1000'
  },
  onLoad(options) {
    var orderId = options.orderId
    console.log(orderId)
    api.post("/charging/getOrderChargedList",
      {
        "orderId": orderId
      }).then(res => {
        console.log(res)
        this.setData({ address: res.address, paidAmount: res.paidAmount, paymentTime: res.paymentTime, paymentId: res.paymentId, isPay: res.isPay, electricity: res.electricity })
        console.log("获取交易明细成功")
      }).catch(error => {
        console.log("获取交易明细失败")
        console.log(error)

      })

  },
});
