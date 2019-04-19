import {
  GLOBAL_API_DOMAIN,
  IMG_API,
  TOKEN_KEY,
  USER_ID,
  FROM_APP
} from '../../utils/config/config.js'
import Api from '/../../utils/config/api.js'
const utils = require('../../utils/util.js')
import Dialog from '../../dist/dialog/dialog'
import Toast from '../../dist/toast/toast'
import regeneratorRuntime from '../../utils/runtime.js'
const app = getApp()

let wateTimeoutId
Page({
  data: {
    animationMock: '',
    animationKettle: '',
    animationRaindrop: '',
    userInfo: {},
    hasUserInfo: false,
    authed: false,
    showPacket1: false,
    showPacket2: false,
    taskDialog: false,
    water: false, // 浇水中 
    watered: false, // 是否已完成浇水任务
    mock: '',
    avatarIndex: '',
    randomData: [
      '已邀请1,1000位好友一起浇水',
      '已连续浇水1,365天',
      '已提现1元限时福利',
      '已提现200元专享福利',
    ],
    interval: null,
    inviterId: ''
  },
  onHide() {
    console.log('hide')
  },
  onUnload() {
    clearInterval(this.data.interval)
    console.log('onUnload')
  },
  onShow() {
    console.log('show')
  },
  getRandom(start, end) {
    start = Number(start)
    end = Number(end)
    return Math.floor(Math.random()*(start - end) + end)
  },
  miniJumpSuccess() {
    console.log('miniJumpSuccess')
  },
  miniJumpFail(e) {
    console.log(e)
  },
  cash() {
    Dialog.alert({
      title: '提现失败',
      message: '已浇水N天，还需364天才可以提现，记得每天来浇水哟~',
      confirmButtonText: '知道啦'
    })
  },
  benefits(e) {
    const num = e.target.dataset.num
    Dialog.alert({
      title: '领取失败',
      message: `此福利需邀请${num}人才可领取`,
      confirmButtonText: '去邀请',
      cancelButtonText: '知道了',
      showCancelButton: true
    })
  },
  watering: function () {
    if (this.data.watered) {
      Dialog.alert({
        title: '今日已浇水',
        message: '明天也记得来浇水领现金哟'
      })
      return
    }
    this.setData({
      water: true
    })
    const animationKettle = wx.createAnimation({
      timingFunction: "ease",
      delay: 0,
      transformOrigin: "50% 50%",
    })
    const animationRaindrop = wx.createAnimation({
      timingFunction: "ease"
    })

    //设置动画
    animationKettle.translateY(-130).step({
      duration: 500
    })
    animationKettle.translateX(-70).rotate(-45).step({
      duration: 1000
    })
    animationKettle.translateX(100).step({
      delay: 900,
      duration: 600
    })
    animationKettle.opacity(0).step({
      duration: 20
    })
    animationKettle.translateX(0).translateY(0).rotate(0).opacity(1).step({
      duration: 500
    })
    animationRaindrop.opacity(1).step({
      delay: 1500,
      duration: 200
    })
    animationRaindrop.opacity(0).step({
      duration: 200
    })
    animationRaindrop.opacity(1).step({
      duration: 200
    })
    animationRaindrop.opacity(0).step({
      duration: 200
    })
    //导出动画数据传递给组件的animation属性。
    this.setData({
      animationKettle: animationKettle.export(),
      animationRaindrop: animationRaindrop.export()
    })
    setTimeout(() => {
      this.setData({
        taskDialog: true,
        water: false
      })
    }, 3500)
  },
  onReady() {
    console.log('onready')
    const interval = setInterval(this.amimationMock, 2700)
    this.setData({
      interval
    })
    this.amimationMock()
  },
  amimationMock() {
    const animationMock = wx.createAnimation({
      timingFunction: "ease"
    })
    animationMock.translateX(0).step({
      duration: 800
    })
    animationMock.translateY(-100).step({
      delay: 800,
      duration: 1000
    })
    animationMock.translateX('-100%').translateY(3).step({
      duration: 0
    })
    this.setData({
      animationMock: animationMock.export()
    })
  },
  onLoad(query) {
    Api.waterRecord({}).then((res) => {
      console.log(res)
      res = res.data

    }).catch(err => console.log(err))

    let inviterId = query.inviter_id || ''
    let mock = this.data.randomData[this.getRandom(1, 4)]
    let placeholder = mock.match(/\d+,\d+/)
    if (placeholder) {
      let num = placeholder[0].split(',')
      num = this.getRandom(...num)
      mock = mock.replace(placeholder, num)
    } 
    this.setData({
      inviterId,
      mock,
      avatarIndex: this.getRandom(1, 4),
    })
    const token = wx.getStorageSync(TOKEN_KEY)
    if (!token) {
      wx.hideTabBar()
      this.setData({
        showPacket1: true,
      })
    } else {
      this.init()
    } 
  },
  async init() {
    const res1 = await Api.isWaterToday()
    this.setData({
      watered: res1.data.data.isWater
    })
    if (!res1.data.data.isWater) { // 如果今天未完成浇水任务
      wx.onAppHide(() => {
        clearTimeout(wateTimeoutId)
        wateTimeoutId = setTimeout(() => {
          this.setData({
            watered: true
          })
          wx.showToast({
            title: "完成任务",
            icon: "none",
            image: "",
            duration: 1500,
            mask: false
          })
        }, 1e4)
      })
      wx.onAppShow(() => {
        clearTimeout(wateTimeoutId)
        if (!this.data.watered) {
          wx.showToast({
            title: "请至少体验10s",
            icon: "none",
            image: "",
            duration: 1500,
            mask: false
          })
        }
      })
    }
    const res2 = await Api.isNeededPatchWater()
    if (res2.data.data.isWater) {
      Dialog.alert({
        title: '未连续浇水提示',
        message: '你有N天未浇水，请尽快补浇水！如操作7天未浇水，连续浇水记录将重新计算',
        confirmButtonText: '去补浇水',
        cancelButtonText: '放弃补浇',
        showCancelButton: true
      })
    }
  },
  toRule() {
    wx.navigateTo({
      url: '/pages/rule/rule',
    })
  },
  closePacket2() {
    this.setData({
      showPacket2: false
    })
  },
  bindGetUserInfo: function () {
    Toast.loading({
      duration: 0,
      loadingType: 'spinner',
      zIndex: 3000
    })
    const _this = this
    let token = wx.getStorageSync(TOKEN_KEY)
    if (!token) {
      wx.login({
        success: res => {
          if (res.code) {
            let params = {
              code: res.code
            }
            console.log(params)
            wx.getSetting({
              success: function (res) {
                if (res.authSetting['scope.userInfo'] === true) {
                  // 已经授权，可以直接调用 getUserInfo 获取头像昵称
                  wx.getUserInfo({
                    success: function (res) {
                      console.log(res)
                      params.nickName = res.userInfo.nickName
                      params.avatarUrl = res.userInfo.avatarUrl
                      params.province = res.userInfo.province
                      params.city = res.userInfo.city
                      params.country = res.userInfo.country
                      params.gender = res.userInfo.gender
                      if (_this.data.inviterId) params.from_user_id = _this.data.inviterId
                      Api.getOpenId(params).then((res) => {
                        console.log(res)
                        wx.showTabBar()
                        res = res.data
                        if (res.res == 0) {
                          token = res.data.token
                          wx.setStorageSync(TOKEN_KEY, token)
                          wx.setStorageSync(USER_ID, res.data.userInfo.user_id)
                          _this.init()
                          Toast.clear()
                          _this.setData({
                            showPacket1: false,
                            showPacket2: true
                          })
                        } else {
                          wx.showToast({
                            title: '',
                            icon: '',
                            duration: 1200,
                            mask: true
                          })
                        }
                      }).catch(err => console.log(err))
                    },
                    fail(err) {
                      console.log(err)
                    }
                  })
                }
              }
            })
          }
        }
      })
    }
  },
  catchFormId(e) {
    Api.submitForm({
      formId: e.detail.formId,
    })
  },
  onShareAppMessage() {
    return {
      path: "/pages/index/index?user_id=" + wx.getStorageSync(USER_ID)
    }
  }
})