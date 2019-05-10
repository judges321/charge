const domain = "https://www.p99.store/chargeMini"
// const domain = "http://localhost:8088"

function GET(url, params) {
  return request('GET', url, params)
}

function POST(url, params) {
  return request('POST', url, params)
}

function request(method, url, params) {
  var accessToken = my.getStorageSync({ key: 'access_token' }).data 
  if (accessToken != null){
    return new Promise((resolve, reject) => {
      my.httpRequest({
        url: domain + url,
        data: JSON.stringify(params),
        method: method, // OPTIONS, GET, HEAD, POST, PUT, DELETE, TRACE, CONNECT
        headers: {
          'Content-Type': 'application/json',
          'Authorization': my.getStorageSync({ key: 'access_token' }).data
        },
        dataType: 'json',
  
        success(res) {
          if (res.data.returnCode === "200") {
            let resData = res.data.returnData
            if (!resData) {
              resData = ''
            }
            resolve(resData)
          } else {
            let err = {
              returnCode: res.data.returnCode,
              returnMsg: res.data.returnMsg
            }
            reject(err)
          }
        },
        fail: function(res) {
          console.log(res)
        },
      })
    })
  }else{
    return new Promise((resolve, reject) => {
      my.httpRequest({
        url: domain + url,
        data: JSON.stringify(params),
        method: method, // OPTIONS, GET, HEAD, POST, PUT, DELETE, TRACE, CONNECT
        headers: {
          'Content-Type': 'application/json',
        },
        dataType: 'json',
        success(res) {
          if (res.data.returnCode === "200") {
            let resData = res.data.returnData
            if (!resData) {
              resData = ''
            }
            resolve(resData)
          } else {
            let err = {
              returnCode: res.data.returnCode,
              returnMsg: res.data.returnMsg
            }
            reject(err)
          }
        },
        fail: function(res) {
          console.log(res)
        },
      })
    })    
  }
}

module.exports = {
  get: GET,
  post: POST
}