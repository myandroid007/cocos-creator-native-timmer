/**
 * 网络变化原生端回调
 */
(<any>cc).changeCallback=function (netConnectiontype){
    NetChecker._callBack(netConnectiontype);
}

/**
 * 网络检测器
 * @author 龙涛
 * 2017/12/25 
 */
import {NetwokType} from '../../typings/entities';

export default class NetChecker {

    //用于接受场景回调方法,与场景回调方法标识
    private static callBackName: string[] = [];
    private static changeCallback: Function []=[];

    static alert:cc.Node=null;
    static isStop:boolean=false;

    //网络类型
    static netConnectiontype:NetwokType=NetwokType.NO_NETWORK;



    /**
     * 网络变化监听函数，
     * @param type 监听类型
     * @param callBackName 场景回调方法的标识，建议就传方法的名称（移除监听时使用）
     * @param callback 场景回调方法
     */
    static addEventListener(type:string,callBackName:string,callback:Function){
        if(type=='change'){ 
            if(!!callBackName){
                this.callBackName.push(callBackName);
            }
            if(!!callback){
                this.changeCallback.push(callback);
            }
           
        }
    }
    
    /**
     * 移除监听
     * @param type 监听类型
     * @param callbackName 场景回调方法的标识
     */
    static removeEventLisener(type:string,callbackName:string){
       for(let i=0;i<this.callBackName.length;i++){
           if(this.callBackName[i]==callbackName){
              this._removeByValue(this.changeCallback[i],this.changeCallback);
           }
       }
    }

    static setCurrentScene(CurrentScene){
        
    }

    static checkNetWork(){
        let netType=NetChecker.getNetConnectionType();
        if(netType==NetwokType.NO_NETWORK){
            NetChecker.alert.x=375;
        }else{
            NetChecker.alert.x=-375;
        }
    }


    /**
     * 获取网络类型
     */
    static getNetConnectionType():string{
        return this.netConnectiontype;
    }

    /**
     * 启动服务
     */
    static startService(){
        if(cc.sys.isNative){
            jsb.reflection.callStaticMethod('com/retugame/commons/net/NetChecker',
                   'startService','()V');
        }
    }
    
    /**
     * 关闭服务
     */
    static closeService(){
        if(cc.sys.isNative){
            jsb.reflection.callStaticMethod('com/retugame/commons/net/NetChecker',
                   'closeService','()V');
        }
    }

    /**
     * 获取wifi信号强度
     */
    static getWifiSignalStrength():string{
        let speed:string='0';
        if(cc.sys.isNative){
            speed=jsb.reflection.callStaticMethod('com/retugame/commons/net/NetChecker',
                  'getLinkSpeed','()Ljava/lang/String;');
        }
        return speed;
    }

    static _callBack(netConnectiontype){
        this._setNetConnectionType(netConnectiontype);
        this.checkNetWork();
        for(let i=0;i<this.changeCallback.length;i++){
            this.changeCallback[i]();
        }
        
    }
    
    private static _removeByValue(val:Function,arr:Function[]):void{
        for(let i=0; i<arr.length; i++) {
            if(arr[i] == val) {
               arr.splice(i, 1);
               break;
            }
        }
    }

    private static _setNetConnectionType(netConnectiontype){
        this.netConnectiontype=netConnectiontype;
    }
}
