/*
 * @Author: gaozhirong 
 * @Date: 2018-01-11 11:54:01 
 * @Last Modified by: gaozhirong
 * @Last Modified time: 2018-03-02 16:26:57
 */

import { loginConf } from '../../conf/loginConf';
import {PlayerManager} from './PlayerManager';
import Global from '../storage/Global';
const { ccclass, property } = cc._decorator;

var self = null;
(<any>cc).setQQLoginCallback = function (status, qqReturnData) {
    cc.info("接收到回调方法" + status + "," + qqReturnData);
    self.qqLoginDataCallback(status, qqReturnData);
}

@ccclass
export default class Login extends cc.Component {

    //微信登录按钮
    @property(cc.Button)
    btnWXLogin: cc.Button = null;

    //QQ登录按钮
    @property(cc.Button)
    btnQQLogin: cc.Button = null;

    //游客登录按钮
    @property(cc.Button)
    btnTourLogin: cc.Button = null;

    //anysdk客户端对象
    anysdkAgent: anysdk.AgentManager = null;

    //anysdk用户系统对象
    anysdkUserPlugin: anysdk.ProtocolUser = null;

    //ajax请求对象
    xmlhttp: XMLHttpRequest = null;



    //加载
    onLoad() {
        this.xmlhttp = cc.loader.getXMLHttpRequest();
        self = this;
    }

    private setGlobalUserInfoJson(userInfoJson){
        userInfoJson.id=userInfoJson.userId;
        userInfoJson.username = userInfoJson.userName;
        userInfoJson.nickname = userInfoJson.nickName;
        Global.setItem('userInfo',userInfoJson);
    }

    /**
     *  微信登录按钮的点击事件
     */
    public wxLoginEvent() {
        if (this.anysdkAgent == null || this.anysdkUserPlugin == null) {//anysdk对象尚未初始化
            ////TODO 待取消注释
            this._initAnySDK();
        }
        //客户端登录逻辑处理开始
        let info: any = {
            server_url: loginConf.serverUrl,
            choice: 'wx',
            channel: 'anysdk',
            appName: loginConf.appName
        };
        //TODO 待取消注释
        this.anysdkUserPlugin.login(info);
    }

    /**
     * QQ登录按钮的点击事件
     */
    public qqLoginEvent() {
        cc.info("QQ登录事件触发");
        if (cc.sys.OS_ANDROID == cc.sys.os) {
            cc.log("current platform is: cc.sys.OS_ANDROID");
            jsb.reflection.callStaticMethod("org/cocos2dx/javascript/AppActivity", "QQLogin", "(Ljava/lang/String;)V", "cc.setQQLoginCallback");
        } else if (cc.sys.OS_IOS == cc.sys.os) {

        }
    }

    /**
     * 拿到QQ登录相关参数 open_id access_token等关键参数
     * 并向后台发起登录请求
     */
    public qqLoginDataCallback(status: string, qqReturnData: string) {
        //初始化接受到的回调参数
        let qqDataJson = JSON.parse(qqReturnData);

        if (status == "success") {//登陆成功
            let openId = qqDataJson.openid;
            let accessToken = qqDataJson.access_token;
            //发起ajax请求后台
            if (this.xmlhttp == null) {
                this.xmlhttp = cc.loader.getXMLHttpRequest();
            }
            this.xmlhttp.open("GET", loginConf.qqLoginServerUrl + '&appName=' + loginConf.appName + '&open_id=' + openId + '&access_token=' + accessToken, true);
            let ajaxLoginResponse = () => {
                if (this.xmlhttp.readyState == 4 && this.xmlhttp.status == 200) {
                    let responseJsonData = JSON.parse(this.xmlhttp.responseText);
                    if (responseJsonData.isSucc != null && responseJsonData.isSucc == -1) {//登录失败

                    } else {
                        //游客登录成功后的逻辑处理
                        let userInfo = responseJsonData.user.userInfo;
                        //存储到本地
                        //将返回的user登录进行进行本地化存储，以便下次进行自动登录
                        cc.sys.localStorage.setItem('userIdentity', JSON.stringify(responseJsonData.user.userIdentity));
                        loginConf.userName = userInfo.nickName;
                        //设置全局userinfo
                        this.setGlobalUserInfoJson(responseJsonData.user.userInfo);
                        let headBar = cc.director.getScene().getChildByName('head');
                        if(headBar != null){
                            headBar.x=375;
                            headBar.getComponent('HeadBar').initHeadBtn();
                        }
                        cc.director.loadScene("gameMain");
                        
                    }
                }
            }

            this.xmlhttp.onreadystatechange = ajaxLoginResponse;
            this.xmlhttp.send();


        } else if (status == "fail") {//登录失败情况

        } else {//取消登录等操作

        }

    }

    /**
     * 后台生成uuid作为游客唯一标识uid
     */
    public touristLoginEvent() {
        //开始发起ajax请求
        this.xmlhttp.open("GET", loginConf.touristLoginServerUrl + '&appName=' + loginConf.appName, true);
        let ajaxLoginResponse = () => {
            if (this.xmlhttp.readyState == 4 && this.xmlhttp.status == 200) {
                let responseJsonData = JSON.parse(this.xmlhttp.responseText);
                cc.info("处理后的返回数据:" + responseJsonData + ",,," + responseJsonData.status);
                if (responseJsonData.status == 'success') {
                    //游客登录成功后的逻辑处理
                    let userInfo = responseJsonData.msg.userInfo;
                    //存储到本地
                    //将返回的user登录进行进行本地化存储，以便下次进行自动登录
                    cc.sys.localStorage.setItem('userIdentity', JSON.stringify(responseJsonData.msg.userIdentity));
                    loginConf.userName = userInfo.nickName;

                    this.setGlobalUserInfoJson(responseJsonData.msg.userInfo);
                    let headBar = cc.director.getScene().getChildByName('head');
                    if (headBar != null) {
                        headBar.x = 375;
                        headBar.getComponent('HeadBar').initHeadBtn();
                    }
                    cc.director.loadScene("gameMain");

                } else {//游客登录失败的逻辑

                }
            }
        }

        this.xmlhttp.onreadystatechange = ajaxLoginResponse;
        this.xmlhttp.send();

    }

    //初始化anysdk相关对象
    private _initAnySDK() {
        this.anysdkAgent = anysdk.agentManager;
        this.anysdkUserPlugin = this.anysdkAgent.getUserPlugin();
        this.anysdkUserPlugin.setListener(this._backUserResult, this);
    }

    //用户系统的回调函数
    private _backUserResult(code, msg) {
        switch (code) {
            case anysdk.UserActionResultCode.kInitSuccess: //初始化 SDK 成功回调
                //SDK 初始化成功，login方法需要在初始化成功之后调用
                break;
            case anysdk.UserActionResultCode.kInitFail: //初始化 SDK 失败回调
                //SDK 初始化失败，游戏相关处理
                break;

            case anysdk.UserActionResultCode.kLoginSuccess: //登陆成功回调
                //登陆成功后，可使用getUserID()获取用户ID msg为服务端返回的user_info
                cc.info("用户信息:" + msg);
                let user = eval('(' + msg + ')');
                cc.info("用户名:" + user.userInfo.nickName);
                loginConf.userName = user.userInfo.nickName;

                cc.info("用户登录授权信息:" + user.userIdentity);
                //将返回的user登录进行进行本地化存储，以便下次进行自动登录
                cc.sys.localStorage.setItem('userIdentity', JSON.stringify(user.userIdentity));
                let headBar = cc.director.getScene().getChildByName('head');
                if (headBar != null) {
                    headBar.x = 375;
                    headBar.getComponent('HeadBar').initHeadBtn();
                }
                this.setGlobalUserInfoJson(user.userInfo);
                cc.director.loadScene("gameMain");
                break;
            case anysdk.UserActionResultCode.kLoginNetworkError: //登陆网络出错回调
                cc.info("登陆网络出错回调");
                break;
            case anysdk.UserActionResultCode.kLoginCancel: //登陆取消回调
                cc.info("登陆取消回调");
                break;
            case anysdk.UserActionResultCode.kLoginFail: //登陆失败回调
                //登陆失败后，游戏相关处理
                cc.info("登陆取消回调");
                break;
        }
    }

}
