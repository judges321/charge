const api = require('../../utils/request');
var mqtt = require('../../utils/mqtt');
import util from '../../utils/util'
var Paho = require('../../utils/paho-mqtt');
var client;
var interval = null;
var timer= null;
Page({
  data: {
    items: [
      { portId: 0, status: 99, value: '1号充电口', checked:false },
      { portId: 1, status: 99, value: '2号充电口', checked:false },
      { portId: 2, status: 99, value: '3号充电口', checked:false },
      { portId: 3, status: 99, value: '4号充电口', checked:false },
      { portId: 4, status: 99, value: '5号充电口', checked:false },
      { portId: 5, status: 99, value: '6号充电口', checked:false },
      { portId: 6, status: 99, value: '7号充电口', checked:false },
      { portId: 7, status: 99, value: '8号充电口', checked:false },
      { portId: 8, status: 99, value: '9号充电口', checked:false },
      { portId: 9, status: 99, value: '10号充电口', checked:false },
    ],
    portId: null,
    IMEI:null,
    buttonClicked:null,
    getStatus:false,
    openPortId:null,
    interval:null,
    timer: null,
    startLoading:false,
    alert:false,
    form:null,
    client:null,
  },

  showStartLoading: function () {
    my.showLoading({
      content: '开启中...'
    });
  },
  cancelStartLoading: function () {
    my.hideLoading();
  },
  onShow() {
    var i = this
    this.setData(
    {items: [
      { portId: 0, status: 99, value: '0号充电口', checked:false },
      { portId: 1, status: 99, value: '1号充电口', checked:false },
      { portId: 2, status: 99, value: '2号充电口', checked:false },
      { portId: 3, status: 99, value: '3号充电口', checked:false },
      { portId: 4, status: 99, value: '4号充电口', checked:false },
      { portId: 5, status: 99, value: '5号充电口', checked:false },
      { portId: 6, status: 99, value: '6号充电口', checked:false },
      { portId: 7, status: 99, value: '7号充电口', checked:false },
      { portId: 8, status: 99, value: '8号充电口', checked:false },
      { portId: 9, status: 99, value: '9号充电口', checked:false },
    ],
    })
    
    var IMEI = my.getStorageSync({ key: 'IMEI' }).data
    this.setData({IMEI : IMEI})
    
    // client = new Paho.Client('www.p99.store', 443, 'alipay-123jdsjjo')

    // var options = {
    //     cleanSession: false,
    //     useSSL: true,
    //     reconnect: true,
    //     userName: 'admin',
    //     password: 'Xr7891122',
    //     onSuccess: onConnect,
    //     // invocationContext: {
    //     //   host: 'www.p99.store',
    //     //   port: 8099,
    //     //   path: '/wss',
    //     //   clientId: 'alipay-123jdsjjo'
    //     // },
    //     // timeout: 30 * 1000,
    //     keepAliveInterval: 10,
    //     // mqttVersionExplicit:false,
    //     // mqttVersion: 4,
    // };
    // client.onConnectionLost = onConnectionLost
    // client.onMessageArrived = onMessageArrived
    // function onConnectionLost(responseObject) {
    //   var options = {
    //     cleanSession: false,
    //     useSSL: true,
    //     reconnect: true,
    //     userName: 'admin',
    //     password: 'Xr7891122',
    //     keepAliveInterval: 10,
    //     onSuccess: onConnect
    //   }
    //   console.log(client)
    //   client.connect(options);

    //   if (responseObject.errorCode !== 0)
    //     console.log("onConnectionLost:" + responseObject.errorMessage);
    // }
    // function onMessageArrived(message) {
    //   console.log("onMessageArrived:" + message.payloadString);
    //   client.disconnect();
    // }
    // function onConnect() {
    //   // Once a connection has been made, make a subscription and send a message.
    //   console.log("onConnect");
    //   var message = new Paho.Message("Hello");
    //   message.destinationName = 'charge/123';
    //   client.send(message);
    // }
    // client.connect(options);

    if(client!=null){
      client.end()
      client = mqtt.connect('mys://admin:Xr7891122@www.p99.store:8099/mqtt');
    }else{
      client = mqtt.connect('mys://admin:Xr7891122@www.p99.store:8099/mqtt');
    }
    var sendAllDataTopic = "charge/" + IMEI + "/SendAllData";
    var getAllDataTopic = "charge/" + IMEI + "/OpenNum";
    var openOkNumTopic = "charge/" + IMEI + "/OpenOkNum";    
    
    // var U8Cmd = this.sendAllData(true);
    // var buf1 = new Buffer(U8Cmd);
    // client.publish(getAllDataTopic, buf1)
    i.sendAllDataHttp(IMEI,true)

    client.subscribe(sendAllDataTopic);
    client.subscribe(openOkNumTopic);
        
    client.on('message', function(topic, message) {
      console.log(topic)
      console.log(message)
      if (topic == sendAllDataTopic) {
        i.readDataTransferCmd(message);
      } else if (topic == openOkNumTopic) {
        var openPort = i.data.openPortId
        //todo 获取充电口是否开启成功
        // 开始充电口不为空
        // if (openPort != null) {
        var userId = my.getStorageSync({key:"userId"}).data

        if (message[7] * 256 + message[8] == userId) {
          if (message[5] == openPort) {
            if (message[6] == 0x00) {
              // 开启成功 取消开启中的提示
              clearInterval(interval)
              clearTimeout(i.timer)
              i.startSuccess(openPort)
            } else {
              // todo 开启失败 弹窗提示 选中的充电口置null
              i.cancelStartLoading();
              clearTimeout(i.timer)
              my.alert({
                content: '开启充电器失败，请先连接充电器',
                showCancel: false,
                success: function(res) {
                    if (!i.data.getStatus) {
                      // var U8Cmd2 = i.sendAllData(false);
                      // var buf2 = new Buffer(U8Cmd2);
                      // client.publish(getAllDataTopic, buf2)
                      //todo 
                      i.sendAllDataHttp(IMEI,false)

                      setTimeout(function () {
                      my.showLoading({
                        content: '加载中',
                      })
                      },100)
                    }
                  
                }
              })
              i.setData({ openPortId: null })
            }
          }
        }
        else {
          // if (message[6] == 0x00) {
          //   // 开启成功 取消开启中的提示
          //   i.cancelStartLoading();
          //   clearTimeout(i.data.timer)
          //   my.alert({
          //     content: '该充电口已被其他人开启',
          //     showCancel: false,
          //     success: function(res) {
          //         if (!i.data.getStatus) {
          //           var U8Cmd2 = i.sendAllData(false);
          //           var buf2 = new Buffer(U8Cmd2);
          //           client.publish(getAllDataTopic, buf2)
          //           my.showLoading({
          //             content: '加载中',
          //           })
          //         }
                
          //     }
          //   })
          //   i.setData({ openPortId: null })

          // }
        }

        // }

      }
    })


    interval = setInterval(function () {
      console.log("66666")
      if(client!=null){
        client.end()
        client = mqtt.connect('mys://admin:Xr7891122@www.p99.store:8099/mqtt');
      }else{
        client = mqtt.connect('mys://admin:Xr7891122@www.p99.store:8099/mqtt');
      }
    client.subscribe(sendAllDataTopic);
    client.subscribe(openOkNumTopic);
        
    client.on('message', function(topic, message) {
      if (topic == sendAllDataTopic) {
        i.readDataTransferCmd(message);
      } else if (topic == openOkNumTopic) {
        var openPort = i.data.openPortId
        //todo 获取充电口是否开启成功
        // 开始充电口不为空
        // if (openPort != null) {
        var userId = my.getStorageSync({key:"userId"}).data

        if (message[7] * 256 + message[8] == userId) {
          if (message[5] == openPort) {
            if (message[6] == 0x00) {
              // 开启成功 取消开启中的提示
              clearInterval(interval)
              clearTimeout(i.timer)
              i.startSuccess(openPort)
            } else {
              // todo 开启失败 弹窗提示 选中的充电口置null
              i.cancelStartLoading();
              clearTimeout(i.timer)
              my.alert({
                content: '开启充电器失败，请先连接充电器',
                showCancel: false,
                success: function(res) {
                    if (!i.data.getStatus) {
                      //todo http 
                      
                      i.sendAllDataHttp(IMEI,false)
                      // var U8Cmd2 = i.sendAllData(false);
                      // var buf2 = new Buffer(U8Cmd2);
                      // client.publish(getAllDataTopic, buf2)
                      setTimeout(function () {
                      my.showLoading({
                        content: '加载中',
                      })
                      },100)
                    }
                  
                }
              })
              i.setData({ openPortId: null })
            }
          }
        }
        else {
          // if (message[6] == 0x00) {
          //   // 开启成功 取消开启中的提示
          //   i.cancelStartLoading();
          //   clearTimeout(i.data.timer)
          //   my.alert({
          //     content: '该充电口已被其他人开启',
          //     showCancel: false,
          //     success: function(res) {
          //         if (!i.data.getStatus) {
          //           var U8Cmd2 = i.sendAllData(false);
          //           var buf2 = new Buffer(U8Cmd2);
          //           client.publish(getAllDataTopic, buf2)
          //           my.showLoading({
          //             content: '加载中',
          //           })
          //         }
                
          //     }
          //   })
          //   i.setData({ openPortId: null })

          // }
        }

        // }

      }
    })
      api.get('/charging/current/chargedList', {}).then(res => {
          my.reLaunch({
            url: '/pages/chargeState/chargeState',
          })
            my.setStorageSync({
              key: 'chargeList',
              data: res
            })
      }).catch(error => {
        console.log(error)
      })
      console.log("77777")

      if (!i.data.getStatus) {
        //todo
        i.sendAllDataHttp(IMEI,false)
        // var U8Cmd2 = i.sendAllData(false);
        // var buf2 = new Buffer(U8Cmd2);
        // client.publish(getAllDataTopic, buf2)
      }else{
        // todo 定时获取充电口状态成功
      }
    }, 10000)
    console.log("33333")
    var pages = getCurrentPages();
    var prevPage = pages[pages.length - 2];  //上一个页面
    if (prevPage != null) {
      prevPage.setData({
        interval: interval
      });
    }
    console.log("44444")

    setTimeout(function () {
    my.showLoading({
      content: '加载中'
    })
    },500)
    console.log("55555")

  },

  openOkNum: function(portId) {
    var U8Cmd = new Array(9);
    U8Cmd[0] = 0x3C;  //
    U8Cmd[1] = 0x00; //类型空调
    U8Cmd[2] = 0x51; //类型空调
    U8Cmd[3] = 0XF0; //租赁模式
    U8Cmd[4] = 0X09; //数据长度
    U8Cmd[5] = 0X03;
    U8Cmd[6] = portId;
    U8Cmd[7] = 0x00;

    var totalNum = U8Cmd[0] + U8Cmd[1] + U8Cmd[2] + U8Cmd[3] + U8Cmd[4] + U8Cmd[5] + U8Cmd[6] + U8Cmd[7]
    var LNum = totalNum & 0x00ff;
    U8Cmd[8] = LNum;
    U8Cmd[9] = 0X46;
    return U8Cmd;
  },
  radioChange: function(e) {
    var items = this.data.items
    for (var i = 0; i < items.length; i++) {
      if (i == e.detail.value) {
        items[i].checked = true;
      } else {
        items[i].checked = false;
      }
    }
    this.setData({
      items: items,
      portId: e.detail.value
    })
    // var up = "items[" + e.detail.value + "].checked";//先用一个变量，把(info[0].gMoney)用字符串拼接起来
    // this.setData({
    //     [up]: true,
    //     portId: e.detail.value
    // })
  },

  sendAllData: function (isFirst) {
    var U8Cmd = new Array(9);
    U8Cmd[0] = 0x3C;  //
    U8Cmd[1] = 0x00; //类型空调
    U8Cmd[2] = 0x51; //类型空调
    U8Cmd[3] = 0XF0; //租赁模式
    U8Cmd[4] = 0X09; //数据长度
    U8Cmd[5] = 0X01;
    U8Cmd[6] = 0X00;
    if (isFirst){
      U8Cmd[7] = 0X01;
    }else{
      U8Cmd[7] = 0X00;
    }
    var totalNum = U8Cmd[0] + U8Cmd[1] + U8Cmd[2] + U8Cmd[3] + U8Cmd[4] + U8Cmd[5] + U8Cmd[6] + U8Cmd[7]
    var LNum = totalNum & 0x00ff;
    U8Cmd[8] = LNum;
    U8Cmd[9] = 0X46;
    return U8Cmd;
  },
  startSuccess: function (portId){
    var i = this
    var IMEI = this.data.IMEI
    var formId = this.data.formId
    // 开启充电口成功
    api.post('/charging/start', { 'IMEI': IMEI, 'portId': portId,'formId':formId}).then(res => {

      api.get('/charging/current/chargedList', {}).then(res => {
        console.log(res)
        setTimeout(function () {
          my.reLaunch({
            url: '/pages/chargeState/chargeState',
          })
        }, 200)       
        my.setStorageSync({
          key: 'chargeList',
          data: res
        })
      }).catch(error => {
        console.log(error)
      })

    }).catch(error => {
      console.log(error)
    })
  },
  startCharge: function () {
    var i = this
    // if(client!=null){
    //   client.end()
    //   client = mqtt.connect('mys://admin:Xr7891122@www.p99.store:8099/mqtt');
    // }else{
    //   client = mqtt.connect('mys://admin:Xr7891122@www.p99.store:8099/mqtt');
    // }
    var i = this
    this.timer = setTimeout(function () {
      i.cancelStartLoading();
      my.alert({
        content: '开启充电器超时,请重试',
        success: function (res) {
          // var getAllDataTopic = "charge/" + IMEI + "/OpenNum";
          // var U8Cmd2 = i.sendAllData(false);
          // var buf2 = new Buffer(U8Cmd2);
          // client.publish(getAllDataTopic, buf2)
          //todo 
          i.sendAllDataHttp(IMEI,false)
        }
      })
    }, 40000)

    var IMEI = my.getStorageSync({ key: 'IMEI' }).data
    if (i.data.portId != null && IMEI != null) {
      var portId = i.data.portId
      var userId = my.getStorageSync({ key: 'userId' }).data
      if (!i.data.buttonClicked) {
        util.buttonClicked(i)
        i.showStartLoading()
        //todo 是否开启成功
        i.setData({ openPortId: portId})
        // var openNumTopic = "charge/" + IMEI + "/OpenNum";
        // var U8Cmd = i.openNum(portId,userId);
        // var buf1 = new Buffer(U8Cmd);
        // client.publish(openNumTopic, buf1)
        i.openNumHttp(IMEI,portId,userId)
      }
    } else {
      my.showToast({
        content: "请先选择充电口",
        icon: "success",
        duration: 2e3
      });
    }
  },
  openState: function (U8Cmd) {
    // if (U8Cmd[0] == 0X3c && U8Cmd[1] == 0x00 && U8Cmd[2] == 0x51 && U8Cmd[3] == 0XF0 ) {
      var state = U8Cmd[6];
      if ( state == 0x00){
        return true;
      }else{
        return false;
      }
    // }
  },

  openNum: function (portId,userId) {
    console.log(userId)
    var U8Cmd = new Array(9);
    U8Cmd[0] = 0x3C;  //
    U8Cmd[1] = 0x00; //类型空调
    U8Cmd[2] = 0x51; //类型空调
    U8Cmd[3] = 0XF0; //租赁模式
    U8Cmd[4] = 0X09; //数据长度
    U8Cmd[5] = 0X03;
    U8Cmd[6] = parseInt(portId);
    U8Cmd[7] = parseInt(userId / 256);
    U8Cmd[8] = parseInt(userId % 256);
        console.log(parseInt(userId / 256))
        console.log(parseInt(userId % 256))

    U8Cmd[9] = 0x00;
    U8Cmd[10] = 0x00;

    var totalNum = U8Cmd[0] + U8Cmd[1] + U8Cmd[2] + U8Cmd[3] + U8Cmd[4] + U8Cmd[5] + U8Cmd[6] + U8Cmd[7] + U8Cmd[8] + U8Cmd[9] + U8Cmd[10]
    var LNum = totalNum & 0x00ff;
    U8Cmd[11] = LNum;
    U8Cmd[12] = 0X46;
    console.log(U8Cmd)
    return U8Cmd;
  },
   readDataTransferCmd: function (U8Cmd) {
    var i = this
    // console.log(strCmd);
    // var U8Cmd = new Array(27);
    // for (var i = 0; i < U8Cmd.length; i++) {
    //   var strTemp = "", strTemp1 = "";
    //   strTemp = strCmd[i * 2];
    //   strTemp += strCmd[i * 2 + 1];
    //   //strTemp1=strTemp.toString(10);
    //   U8Cmd[i] = parseInt(strTemp, 16);
    // }

    var totalNum = U8Cmd[0] + U8Cmd[1] + U8Cmd[2] + U8Cmd[3] + U8Cmd[4] + U8Cmd[5] + U8Cmd[6] + U8Cmd[7] + U8Cmd[8] + U8Cmd[9] + U8Cmd[10] + U8Cmd[11] + U8Cmd[12] + U8Cmd[13] + U8Cmd[14];//从DatHead到MainWork的校验和高、低位
    var LNum = totalNum & 0x00ff;

    if (U8Cmd[0] == 0X1A && U8Cmd[1] == 0x00 && U8Cmd[2] == 0x51 && U8Cmd[3] == 0XF0 && U8Cmd[4] == 0x0A && LNum === U8Cmd[15] && U8Cmd[16] == 0x46) {
      var dataLength = U8Cmd[4];

      var chargePortState1 = U8Cmd[5];
      var chargePortStateBit1 = new Array(8);
      for (var cy1 = 0; cy1 < 8; cy1++) {
        chargePortStateBit1[cy1] = (chargePortState1 & Math.pow(2, cy1)) >> cy1;
      }
      var state1 = '' + chargePortStateBit1[7] + chargePortStateBit1[6]
      var items = this.data.items
      items[0].status = state1

      var chargePortState2 = U8Cmd[6];
      var chargePortStateBit2 = new Array(8);
      for (var cy1 = 0; cy1 < 8; cy1++) {
        chargePortStateBit2[cy1] = (chargePortState2 & Math.pow(2, cy1)) >> cy1;
      }
      var state2 = '' + chargePortStateBit2[7] + chargePortStateBit2[6]

      items[1].status = state2

      var chargePortState3 = U8Cmd[7];
      var chargePortStateBit3 = new Array(8);
      for (var cy1 = 0; cy1 < 8; cy1++) {
        chargePortStateBit3[cy1] = (chargePortState3 & Math.pow(2, cy1)) >> cy1;
      }
      var state3 = '' + chargePortStateBit3[7] + chargePortStateBit3[6]

      items[2].status = state3

      var chargePortState4 = U8Cmd[8];
      var chargePortStateBit4 = new Array(8);
      for (var cy1 = 0; cy1 < 8; cy1++) {
        chargePortStateBit4[cy1] = (chargePortState4 & Math.pow(2, cy1)) >> cy1;
      }
      var state4 = '' + chargePortStateBit4[7] + chargePortStateBit4[6]
      items[3].status = state4

      var chargePortState5 = U8Cmd[9];
      var chargePortStateBit5 = new Array(8);
      for (var cy1 = 0; cy1 < 8; cy1++) {
        chargePortStateBit5[cy1] = (chargePortState5 & Math.pow(2, cy1)) >> cy1;
      }
      var state5 = '' + chargePortStateBit5[7] + chargePortStateBit5[6]

      items[4].status = state5


      var chargePortState6 = U8Cmd[10];
      var chargePortStateBit6 = new Array(8);
      for (var cy1 = 0; cy1 < 8; cy1++) {
        chargePortStateBit6[cy1] = (chargePortState6 & Math.pow(2, cy1)) >> cy1;
      }
      var state6 = '' + chargePortStateBit6[7] + chargePortStateBit6[6]
      items[5].status = state6

      var chargePortState7 = U8Cmd[11];
      var chargePortStateBit7 = new Array(8);
      for (var cy1 = 0; cy1 < 8; cy1++) {
        chargePortStateBit7[cy1] = (chargePortState7 & Math.pow(2, cy1)) >> cy1;
      }
      var state7 = '' + chargePortStateBit7[7] + chargePortStateBit7[6]

      items[6].status = state7

      var chargePortState8 = U8Cmd[12];
      var chargePortStateBit8 = new Array(8);
      for (var cy1 = 0; cy1 < 8; cy1++) {
        chargePortStateBit8[cy1] = (chargePortState8 & Math.pow(2, cy1)) >> cy1;
      }
      var state8 = '' + chargePortStateBit8[7] + chargePortStateBit8[6]

      items[7].status = state8

      var chargePortState9 = U8Cmd[13];
      var chargePortStateBit9 = new Array(8);
      for (var cy1 = 0; cy1 < 8; cy1++) {
        chargePortStateBit9[cy1] = (chargePortState9 & Math.pow(2, cy1)) >> cy1;
      }
      var state9 = '' + chargePortStateBit9[7] + chargePortStateBit9[6]

      items[8].status = state9

      var chargePortState10 = U8Cmd[14];
      var chargePortStateBit10 = new Array(8);
      for (var cy1 = 0; cy1 < 8; cy1++) {
        chargePortStateBit10[cy1] = (chargePortState10 & Math.pow(2, cy1)) >> cy1;
      }
      var state10 = '' + chargePortStateBit10[7] + chargePortStateBit10[6]

      items[9].status = state10
      // if (i.data.portId != null){
      //   var up = "items[" + i.data.portId + "].checked";
      //   i.setData({
      //     [up]: true
      //   })
      // }
      for (var a = 0; a < items.length; a++) {
        if (a == i.data.portId) {
          items[a].checked = true;
        } else {
          items[a].checked = false;
        }
      }
      this.setData({ items: items, getStatus: true })
      clearInterval(interval)
      my.hideLoading()
    }
  },
  onUnload() {
    // 页面被关闭
    client = null
    my.hideLoading();
    clearInterval(interval)
    clearTimeout(timer)
  },
  onHide() {
    // 页面隐藏
  },
  sendAllDataHttp(IMEI,isFirst){
    api.post('/charging/sendAllData', { 'IMEI': IMEI, 'isFirst': isFirst}).then(res => {
    })
  },
  openNumHttp(IMEI,portId,userId){
    api.post('/charging/openNum', { 'IMEI': IMEI, 'portId': portId,"userId":userId}).then(res => {
    })
  }
});
