const api = require('../../utils/request');
const app = getApp()

Page({
  data: {
    items: [
      { orderType: '1', paidAmount: "2.00元", createTime: "2018-08-29 15:30:00", paymentId: '1' },
      { orderType: '2', paidAmount: "2.00元", createTime: "2018-08-29 15:30:00", paymentId: '2' },
    ],
    userInfo: {
      avatar: "/img/personal_head.png",
      phone: "13750846912",
      nickName: "Carpe Diem"
    },
   itemsThumb: [
      {
       thumb: '/img/recharge.png',
        title: '交易明细',
        arrow: true,
      }
    ]
  },
  onLoad() {
    console.log(app.globalData.userInfo)
    this.setData({
      userInfo : app.globalData.userInfo
    })
  },
  toRechargeRecord: function() {
    my.navigateTo({
      url: '../rechargeRecord/rechargeRecord'
    })
  }
});
