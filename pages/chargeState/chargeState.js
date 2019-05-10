var mqtt = require('../../utils/mqtt');
import util from '../../utils/util'
const api = require('../../utils/request');
const app = getApp()

Page({
  data: {
    canvasShow: false,
    chargeProgress: 20,
    balance: "",
    show: true,
    orderId: null,
    chargeList: {
      paidAmount: 0
    },
    interval: "",
  },
  onShow() {


    var i = this
    var IMEI = this.data.chargeList.chargedPileId

    // var close_topic = "charge/" + IMEI + "/CloseOkNum";
    // var send_topic = "charge/" + IMEI + "/SendNum";
    // var client;
    // if(i.data.client!=null){
    //   client = i.data.client
    // }else{
    //   client = mqtt.connect('mys://admin:Xr7891122@www.p99.store:8099/mqtt');
    //   i.setData({client:client})
    // }

    // client.subscribe(close_topic);
    // client.subscribe(send_topic);

    // client.on('message', function(topic, message) {
    //   var U8Cmd = Array.from(message)
    //   if (topic === send_topic) {
    //     i.readSendNumCmd(U8Cmd)
    //   }
    //   if (topic === close_topic && U8Cmd[5] == chargeList.portId) {
    //     i.readCloseOkNumCmd(U8Cmd);
    //   }
    // })

    this.getAccessToken()
    
    var chargeList = my.getStorageSync({key:'chargeList'}).data
    if (chargeList.state = 5 & chargeList.chargingEndTime != null & chargeList.chargingEndTime != undefined) {
      var chargeTime = chargeList.chargingEndTime - chargeList.chargingBeginTime;
      chargeList.chargeTime = Math.floor(chargeTime / 60 / 1000 );
    } else {
      var currTime = Date.parse(new Date());; //当前时间 
      var chargeTime = currTime + 20000 - chargeList.chargingBeginTime;
      chargeList.chargeTime = Math.floor(chargeTime / 60 / 1000 );
    }

    if (chargeList.priceMethod == 1) {
      chargeList.paidAmount = chargeList.electricity * chargeList.chargingPrice + 20
    } else if (chargeList.priceMethod == 2) {
      chargeList.paidAmount =  Math.floor(chargeList.chargeTime / 30 ) * chargeList.chargingPrice + 20
    }
    this.setData({ chargeList: chargeList })

    if (chargeList.status == 5) {
      i.setData({ show: false, canvasShow: true, chargeProgress: 100 })
    }
    
    var interval = setInterval(function() {
      api.get('/charging/current/chargedList', {}).then(res => {
        if (res == null) {
          i.setData({ chargeList: res })
          setTimeout(function() {
            my.reLaunch({
              url: '/pages/index/index',
            })
          }, 200)
        } else {
          chargeList = res
        }
      }).catch(error => {
        console.log(error)
        if(error.returnCode == "20001")
        {
          setTimeout(function(){
            wx.reLaunch({
              url:'/pages/index/index'
            })
          },200)
        }
      })
      i.updateChargeTime(chargeList)
    }, 1000)

    i.setData({interval:interval})

    // 页面渲染完成
    console.log(i.data.chargeList)


  },
  endCharge: function() {
    var i = this
    console.log("endCharge")
    i.setData({ show: false, canvasShow: true })

    var IMEI = this.data.chargeList.chargedPileId
    var U8Cmd = this.createCloseNumCmd(this.data.chargeList.portId);
    var buf1 = new Buffer(U8Cmd);
    var setTransfer_topic = "charge/" + IMEI + "/OpenNum";

    //todo 已下移到read，开发结束删除
    api.post("/charging/end",
      {
        "userId": my.getStorageSync({key:"userId"}).data,
        "paidAmount": this.data.chargeList.paidAmount,
        "chargeTime": this.data.chargeList.chargeTime,
        "pileId": this.data.chargeList.chargedPileId,
        "portId": this.data.chargeList.portId,
        "id": this.data.chargeList.id,
        "paymentId": 2,
        "orderType": 1,
      }).then(res => {
        console.log("end.....")
        console.log(res)
        var chargeList = res
        chargeList.orderId = res.orderId
        i.setData({ chargeList: chargeList })
      }).catch(error => {
        console.log(error)
      })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {
    var cxt_arc = my.createCanvasContext('canvasArc');//创建并返回绘图上下文context对象。
    cxt_arc.setLineWidth(6);
    cxt_arc.setStrokeStyle('#d2d2d2');
    cxt_arc.setLineCap('round')
    cxt_arc.beginPath();//开始一个新的路径
    cxt_arc.arc(106, 90, 75, 0, 2 * Math.PI, false);//设置一个原点(106,106)，半径为100的圆的路径到当前路径
    cxt_arc.stroke();//对当前路径进行描边
    cxt_arc.setLineWidth(6);
    cxt_arc.setStrokeStyle('#1CD0A3');
    cxt_arc.setLineCap('round')
    cxt_arc.beginPath();//开始一个新的路径
    cxt_arc.arc(106, 90, 75, -Math.PI * 1 / 2, Math.PI * (2 * this.data.chargeProgress / 100 - 0.5), false);
    cxt_arc.stroke();//对当前路径进行描边
    cxt_arc.draw();
  },
  onPullDownRefresh: function() {
    api.get('/charging/current/chargedList', {}).then(res => {
      if (res == null) {
        i.setData({ chargeList: res })        
        setTimeout(function() {
          my.reLaunch({
            url: '/pages/index/index',
          })
        }, 200)

      } else {
        i.setData({ chargeList: res })
      }
    }).catch(error => {
      console.log(error)
    })
  },

  createCloseNumCmd: function(portId) {
    var U8Cmd = new Array(9);
    U8Cmd[0] = 0x3C;  //
    U8Cmd[1] = 0x00; //类型空调
    U8Cmd[2] = 0x51; //类型空调
    U8Cmd[3] = 0XF0; //租赁模式
    U8Cmd[4] = 0X09; //数据长度
    U8Cmd[5] = 0X04;
    U8Cmd[6] = portId;
    U8Cmd[7] = 0X00;
    var totalNum = U8Cmd[0] + U8Cmd[1] + U8Cmd[2] + U8Cmd[3] + U8Cmd[4] + U8Cmd[5] + U8Cmd[6] + U8Cmd[7]
    var LNum = totalNum & 0x00ff;
    U8Cmd[8] = LNum;
    U8Cmd[9] = 0X46;
    return U8Cmd;
  },
  hideCharge: function() {
    this.setData({ show: true, canvasShow: false })
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */

  updateChargeTime: function(chargeList) {

    if (chargeList.state = 5 & chargeList.chargingEndTime != null & chargeList.chargingEndTime != undefined) {
      var chargeTime = chargeList.chargingEndTime - chargeList.chargingBeginTime;
      chargeList.chargeTime = Math.floor(chargeTime / 60 / 1000 );
    } else {
      var currTime = Date.parse(new Date());; //当前时间 
      var chargeTime = currTime + 20000 - chargeList.chargingBeginTime;
      chargeList.chargeTime = Math.floor(chargeTime / 60 / 1000 );
    }
    if (chargeList.priceMethod == 1) {
      chargeList.paidAmount = chargeList.electricity * chargeList.chargingPrice + 20
      this.setData({ chargeList: chargeList })
    } else if (chargeList.priceMethod == 2) {
      chargeList.paidAmount =  Math.floor(chargeList.chargeTime / 30 ) * chargeList.chargingPrice + 20
      this.setData({ chargeList: chargeList })
    }
    // console.log(this.data.chargeList)

  },

  readSendNumCmd: function(U8Cmd) {
    var i = this;

    var totalNum = U8Cmd[0] + U8Cmd[1] + U8Cmd[2] + U8Cmd[3] + U8Cmd[4] + U8Cmd[5] + U8Cmd[6] + U8Cmd[7] + U8Cmd[8] + U8Cmd[9] + U8Cmd[10] + U8Cmd[11] + U8Cmd[12] + U8Cmd[13] + U8Cmd[14] + U8Cmd[15] + U8Cmd[16] + U8Cmd[17];//从DatHead到MainWork的校验和高、低位
    if (U8Cmd[0] == 0X2B && U8Cmd[1] == 0x00 && U8Cmd[2] == 0x51) {
      // if (U8Cmd[0] == 0X3c && U8Cmd[1] == 0x00 && U8Cmd[2] == 0x51 && U8Cmd[3] == 0XF0 && U8Cmd[4] == 0X0A && U8Cmd[19] == 0x46) {
      var LNum = totalNum & 0x00ff;
      var portUse = U8Cmd[5];
      var chargeList = this.data.chargeList;
      api.get('/charging/current/chargedList', {}).then(res => {
        if (res == null) {
          i.setData({ chargeList: res })
          setTimeout(function() {
            my.reLaunch({
              url: '/pages/index/index',
            })
          }, 200)
        } else {
          chargeList = res
        }
      })
      chargeList.voltage = U8Cmd[6] * 256 + U8Cmd[7];
      chargeList.current = U8Cmd[8] * 256 + U8Cmd[9];
      chargeList.power = U8Cmd[10] * 256 + U8Cmd[11];
      chargeList.electricity = U8Cmd[12] * 256 + U8Cmd[13];
      chargeList.chargeTime = U8Cmd[14] * 256 + U8Cmd[15];
      chargeList.chargeState = U8Cmd[16];
      if (chargeList.state = 5 & chargeList.chargingEndTime != null & chargeList.chargingEndTime != undefined) {
        var chargeTime = chargeList.chargingEndTime - chargeList.chargingBeginTime;
        chargeList.chargeTime = Math.floor(chargeTime / 60 / 1000 );
      } else {
        var currTime = Date.parse(new Date());; //当前时间 
        var chargeTime = currTime + 20000 - chargeList.chargingBeginTime;
        chargeList.chargeTime = Math.floor(chargeTime / 60 / 1000 );
      }
      if (chargeList.priceMethod == 1) {
        chargeList.paidAmount = chargeList.electricity * chargeList.chargingPrice + 20
      } else if (chargeList.priceMethod == 2) {
        chargeList.paidAmount =  Math.floor(chargeList.chargeTime / 30 ) * chargeList.chargingPrice + 20
      }
    }

    if (portUse == chargeList.portId) {
      this.setData({ chargeList: chargeList })
    }
  },


  readCloseOkNumCmd: function(U8Cmd) {
    var totalNum = U8Cmd[0] + U8Cmd[1] + U8Cmd[2] + U8Cmd[3] + U8Cmd[4] + U8Cmd[5] + U8Cmd[6] + U8Cmd[7] + U8Cmd[8];
    var LNum = totalNum & 0x00ff;

    //if (U8Cmd[0] == 0X3c && U8Cmd[1] == 0x00 && U8Cmd[2] == 0x51 && U8Cmd[3] == 0XF0 && U8Cmd[4] == 0x0A && LNum === U8Cmd[8] && U8Cmd[9] == 0x46) { 
    if (U8Cmd[0] == 0X3c && U8Cmd[1] == 0x00 && U8Cmd[2] == 0x51 && U8Cmd[3] == 0XF0 && U8Cmd[4] == 0x0A && U8Cmd[9] == 0x46) {
      var portUse = U8Cmd[5];
      var chargeSucess = U8Cmd[6];
      if (chargeSucess == 0X00) {
        // api.post("/charging/end",
        //   {
        //     "userId": my.getStorageSync("userId"),
        //     "paidAmount": this.data.paidAmount,
        //     "pileId": this.data.chargedPileId,
        //     "portId": this.data.portId,
        //     "id": this.data.id,
        //     "paymentId": 2,
        //     "orderType": 1,
        //   }).then(res => {
        //     console.log(res)
        //     this.setData({ orderId: res.orderId })
        //   }).catch(error => {
        //     console.log(error)
        //   })
      } else if (chargeSucess == 0XFF) {
        my.showToast({
          title: "结束失败，请重试",
          icon: "success",
          duration: 2e3
        })
      } else {
        console.log("充电结束未知问题")
      }
    }
    console.log("充电结束数据格式问题")
  },
  getAccessToken() {
    my.getAuthCode({
      scopes: 'auth_user',
      fail: error => {
        console.error('getAuthCode', error);
      },
      success: (res) => {
        console.log("getAuthCode")
        // do login...
        // then
        my.getAuthUserInfo({
          fail: error => {
            console.error('getAuthUserInfo', error);
          },
          success: (userInfo) => {
            console.log(userInfo)

            api.post('/login/auth', { 'code': res.authCode, 'oAuthType': 'alipay' }).then(auth => {
              my.setStorageSync({
                key: 'access_token',
                data: auth.access_token
              })
              app.globalData.userInfo = userInfo
              app.globalData.userInfo.userId = auth.userId
            }).catch(error => {
              console.log(error)
            })
            this.setData({
              userInfo: userInfo,
              hasUserInfo: true,
            });
          },
        });


      },
    });
  },
  pay: function() {
    var i = this;
    var openid = my.getStorageSync({key:"openid"}).data
    console.log(openid)
    var orderId = i.data.chargeList.orderId
    if (orderId != null) {
      console.log(this.data.chargeList.orderId)
      api.post("/alipay/pay",
        {
          "orderId": i.data.chargeList.orderId,
          "openid": openid
        }).then(res => {
          my.hideToast();
          console.log(res)
          if ("1" == res.code) {
            // todo
            my.tradePay({
              tradeNO: res.tradeNO, // 调用统一收单交易创建接口（alipay.trade.create），获得返回字段支付宝交易号trade_no
              success: (res) => {
                i.setData({ chargeList: res })
                setTimeout(function() {
                  my.reLaunch({
                    url: '/pages/index/index',
                  })
                }, 200)
              },
              fail: (res) => {
                my.alert({
                  content: JSON.stringify(res),
                });
              }
            });

          } else if ("2" == res.code) {
            setTimeout(function() {
              my.showToast({
                title: "未产生费用",
                icon: "success",
                duration: 2e3
              });
              setTimeout(function() {
                my.reLaunch({
                  url: '/pages/index/index',
                })
              }, 200)
            }, 200)

          } else {
            my.showToast({
              title: "获取支付信息成功",
              icon: "success",
              duration: 2e3
            });
          }

        }).catch(error => {
          my.hideToast(), console.log(error), my.showToast({
            title: "状态异常，请下拉更新",
            icon: "success",
            duration: 2e3
          });
        })
    } else {
      api.get('/charging/current/chargedList', {}).then(res => {
        if (res == null) {
          i.setData({ chargeList: res })

          setTimeout(function() {
            my.reLaunch({
              url: '/pages/index/index',
            })
          }, 200)
        } else {
          i.setData({ chargeList: res })
        }
      }).catch(error => {
        console.log(error)
      })
    }
  },
  onUnload() {
    // 页面被关闭
    console.log("onUnload")
    clearInterval(this.data.interval)
  },
  onHide() {
    // 页面隐藏
  },
});
