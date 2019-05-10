const app = getApp()
var i = null;
const api = require('../../utils/request');
import util from '../../utils/util'

Page({
  data: {
    userInfo: {
      avatar: "/img/personal_head.png",
      phone:13750846912
    },
    windowHeight:600,
    scale: 15,
    currentPos: {
      latitude: 30.16964,
      longitude: 121.26647
    },
    show: true,
    markers: [],
    interval:null

  },

  getSystemInfoPage() {
    my.getSystemInfo({
      success: (res) => {
        console.log(res.windowWidth)
        console.log(res.windowHeight)
        this.data.userInfo.avatar
        this.setData({
          controls: [
          {
            id: 0,
            iconPath: '/img/index-user.png',
            position: {
              left: res.windowWidth - 60,
              top: 20,
              width: 60,
              height: 60
            },
            clickable: false
          },
          {
            id: 1,
            iconPath: '/img/index-location.png',
            position: {
              left: 10,
              top: res.windowHeight - 80,
              width: 60,
              height: 60
            },
            clickable: true
          },
          {
            id: 2,
            iconPath: '/img/index-scan.png',
            position: {
              left: res.windowWidth/2 - 60,
              top: res.windowHeight - 120,
              width: 120,
              height: 120
            },
            clickable: true
          },   
          {
            id: 3,
            iconPath: '/img/index-help.png',
            position: {
              left: res.windowWidth - 70,
              top: res.windowHeight - 80,
              width: 60,
              height: 60
            },
            clickable: true
          },
          {
            id: 4,
            iconPath: this.data.userInfo.avatar,
            position: {
              left: res.windowWidth - 50,
              top: 29,
              width: 40,
              height: 40
            },
            clickable: true
          },   
          ]
        })
      }
    })
  },
  controltap(e) {
    if(e.controlId === 1){
      this.showPos()
    }else if(e.controlId === 2){
      this.scanCode()
    }else if(e.controlId === 3){
      this.help()
    }else if(e.controlId === 4){
      this.toPerson()
    }
  },
  showPos() {
    i.data.mapCtx.moveToLocation();
  },
  toPerson() {
    my.navigateTo({
      url: '../personalCenter/personalCenter'
    })
  },
  help() {
    my.navigateTo({
      url: '../help/help'
    })
  },
  scanCode() {
    // var IMEI = my.getStorageSync({ key: 'IMEI' }).data
    // if(IMEI != null){
    //   my.setStorageSync({
    //     key: 'IMEI',
    //     data: IMEI
    //   })
    //   my.navigateTo({
    //     url: '../port/port'
    //   })
    // }else{


      my.scan({
        type: 'qr',
        success: (res) => {
          var str = res.code
          var index = str.indexOf("?")
          var qs = this.getQueryString(str.slice(index));
          var IMEI = qs["IMEI"];
          my.setStorageSync({
            key: 'IMEI',
            data: IMEI
          })
          setTimeout(
          my.reLaunch({
            url: '../port/port'
          }),500
          )

        },
      });
      // }

  },
  getQueryString:function(url) {  
    var qs = url.substr(1), // 获取url中"?"符后的字串  
      args = {}, // 保存参数数据的对象
      items = qs.length ? qs.split("&") : [], // 取得每一个参数项,
      item = null,
      len = items.length;
  
    for(var i = 0; i < len; i++) {
      item = items[i].split("=");
      var name = decodeURIComponent(item[0]),
        value = decodeURIComponent(item[1]);
      if(name) {
        args[name] = value;
      }
    }
    return args;
  },

  onLoad(query) {
    // 页面加载
    console.info(`Page onLoad with query: ${JSON.stringify(query)}`);
    this.getAccessToken()
    this.getSystemInfoPage()
    // 使用 my.createMapContext 获取 map 上下文
  },

  onReady() {
    // 页面加载完成
    var i = this;
    i.data.mapCtx = my.createMapContext("map"),
      my.getLocation({
        type: 'wgs84',
        success: (res) => {
          i.setData({
            "currentPos.longitude": res.longitude,
            "currentPos.latitude": res.latitude
          })
        }
      })
      
    if (my.getStorageSync({ key: 'access_token' }).data == null){
      i.getAccessToken()
    }else{
      api.get("/pile/listAllPile", {}).then(res => {
        var list = res.list
        var markers = []
        for (var i = list.length - 1; i >= 0; i--) {
          var marker = { id: i + 1, latitude: list[i].gpsLat, longitude: list[i].gpsLng, name: list[i].address, iconPath: '/img/home-location.png', width: 28, height: 36 }
          markers.push(marker);
        }
        this.setData({ markers: markers })
      }).catch(error => {
        console.log(error)
      })
      api.get('/charging/current/chargedList', {}).then(res => {
        console.log("chargedList", res)
        my.reLaunch({
          url: '/pages/chargeState/chargeState',
        })
        my.setStorageSync({
          key: 'chargeList',
          data: res
        })
      }).catch(error => {

      })
    }


  },
  getAccessToken(){
    my.getAuthCode({
      scopes: 'auth_user',
      fail: error => {
        console.error('getAuthCode', error);
      },
      success: (res) => {
        // do login...
        // then
        my.getAuthUserInfo({
          fail: error => {
            console.error('getAuthUserInfo', error);
          },
          success: (userInfo) => {
            api.post('/login/auth', { 'code': ''+res.authCode, 'oAuthType': 'alipay' }).then(auth => {
              my.setStorageSync({

                key: 'access_token',
                data: auth.access_token
              })
              my.setStorageSync({
                key: 'userId',
                data: auth.userId
              })
              my.setStorageSync({
                key: 'openid',
                data: auth.openid
              })
              app.globalData.userInfo = userInfo
              app.globalData.userInfo.userId = auth.userId
              console.log(auth)
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
  onShow() {
    // 页面显示
    var i = this
    if (this.data.interval != null) {
      clearInterval(i.data.interval)
    }
    my.hideLoading();
  },
  onHide() {
    // 页面隐藏
  },
  onUnload() {
    // 页面被关闭
  },
  onTitleClick() {
    // 标题被点击
  },
  onPullDownRefresh() {
    // 页面被下拉
  },
  onReachBottom() {
    // 页面被拉到底部
  },
  onShareAppMessage() {
    // 返回自定义分享信息
    return {
      title: 'My App',
      desc: 'My App description',
      path: 'pages/index/index',
    };
  },

});
