App({
  onLaunch(options) {
    // 第一次打开
    // options.query == {number:1}
    console.info('App onLaunch');

    //获取关联普通二维码的码值，放到全局变量qrCode中
    if (options.query && options.query.IMEI) {
      my.setStorageSync({
        key: 'IMEI',
        data: options.query.IMEI
      })
    }
  },
  onShow(options) {
    // 从后台被 scheme 重新打开
    // options.query == {number:1}
  },

  globalData: {
    userInfo: null
  }
});
