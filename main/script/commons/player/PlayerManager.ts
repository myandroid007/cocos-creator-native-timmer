const {ccclass, property} = cc._decorator;
export{PlayerManager}

/*
 * @Author: gaozhirong 
 * @Date: 2018-01-25 18:24:01 
 * @Last Modified by: gaozhirong
 * 
 * 玩家基本信息的管理
 */
@ccclass
export default class PlayerManager extends cc.Component {


    onLoad() {
        // init logic
        
    }

    /**
     * 设置内存中用户基本信息
     * @param userinfo 用户基本信息json字符串
     */
    public static setGlobalUserInfo(userinfo:string){
        
        cc.info("userinfo");
    }

    /**
     * 存入本地用户身份标识
     * @param userIdentity 用户身份标识  uid hash值等
     */
    public static setLocalStorageUserIdentity(userIdentity:string){
        cc.sys.localStorage.setItem('userIdentity', JSON.stringify(userIdentity));
    }

    /**
     * 取得存在本地的用户信息
     */
    public static getLocalStorageUserIdentity():string{
        return cc.sys.localStorage.getItem('userIdentity');
    }

    /**
     * 移除存放在本地的用户身份标识信息
     */
    public static removeUserIdentity(){
        cc.sys.localStorage.removeItem('userIdentity');
    }

}
