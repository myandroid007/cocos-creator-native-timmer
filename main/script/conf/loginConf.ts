/*
 * @Author: gaozhirong 
 * @Date: 2018-01-11 11:54:30 
 * @Last Modified by: gaozhirong
 * @Last Modified time: 2018-02-02 18:20:47
 * 
 * 登录相关信息的配置
 */

export const loginConf = {
    serverUrl:'http://192.168.10.120:80/game?module=gameLogin&action=wxLogin&rqType=ajax&serverType=jforum',
    autoLoginServerUrl:'http://192.168.10.120:80/game?module=gameLogin&action=gameAutoLogin&rqType=ajax&serverType=jforum',
    touristLoginServerUrl:'http://192.168.10.120:80/game?module=gameLogin&action=touristLogin&rqType=ajax&serverType=jforum',
    qqLoginServerUrl:'http://192.168.10.120:80/game?module=gameLogin&action=qqLogin&rqType=ajax&serverType=jforum',
    logoutServerUrl:'http://l92.168.10.120:80/game?module=gameLogin&action=logout&rqType=ajax&serverType=jforum',
    appName:'game.eliminate',
    userName:''
}