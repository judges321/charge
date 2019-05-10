const api = require('../../utils/request');
const app = getApp()

Page({
  data: {
    items: [

    ]
  },
  toDetail(e) {
    console.log(e)

    my.navigateTo({
      url: '../rechargeDetail/rechargeDetail?orderId=' + this.data.items[e.index].orderId
    })
  },
  onLoad() {
    api.post("/order/getOrderList",
      {
        "userId": app.globalData.userInfo.userId,
      }).then(res => {
        console.log(res)
        this.setData({ items: res })
        console.log("获取交易明细成功")
      }).catch(error => {
        console.log("获取交易明细成功")
        console.log(error)
      })
  },
});
