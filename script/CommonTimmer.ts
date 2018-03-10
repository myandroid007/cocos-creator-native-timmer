/**
 * 仿照js原生的定时器， 使用方法类似， 此定时器在手机上不会被UI线程暂停
 */
export default class CommonTimmer  { 
    private  static TIMMER_TYPE = {
        INTERVAL: 1,
        TIMEOUT: 2
    }
    private static UUID = 0;

    /**
     * 根据参数id关闭相应的定时器
     * @param id 
     */
    public static clearInterval(id: number):void{

        if(cc.sys.isNative){
            if(cc.sys.os===cc.sys.OS_ANDROID){
                jsb.reflection.callStaticMethod('com/retugame/commons/timer/CommonTimer','closeTimer',
                '(Ljava/lang/String;)V',id);
            }else if(cc.sys.os===cc.sys.OS_IOS){
                cc.log('还未实现')
            }
        }else{
            clearInterval(id);
        } 
    }
       /**
     * 根据参数id关闭相应的定时器
     * @param id 
     */
    public static clearTimeOut(id: number):void{

        if(cc.sys.isNative){
            if(cc.sys.os===cc.sys.OS_ANDROID){
                jsb.reflection.callStaticMethod('com/retugame/commons/timer/CommonTimer','closeTimer',
                '(Ljava/lang/String;)V',id);
            }else if(cc.sys.os===cc.sys.OS_IOS){
                cc.log('还未实现')
            }
        }else{
            clearTimeout(id);
        } 
    }



    /**
     * 定时器
     * @param time  单次执行间隔时间，单位为毫秒， 
     * @param callBack  定时器执行回调
     * @param delaytime     延迟执行时间
     */
    public static  setInterval(time:number,callBack: Function, delaytime?:number): number{
        //uuid 自加
        CommonTimmer.UUID ++;

        //设置原生回调
        let callBackFunctionName: string = 'gameTimmerCallBack' + CommonTimmer.UUID;
        cc[callBackFunctionName] = function(){
            callBack();
        }

        let timmerId: number = null;
        //浏览器处理
        if(cc.sys.isBrowser){       
            timmerId = setInterval(function(){
                callBack();
            },time);
            return timmerId;
        }


        //手机处理
        let currentSystem: string = cc.sys.os;
        switch(currentSystem){
            case cc.sys.OS_ANDROID :    //android 处理
                 timmerId = jsb.reflection.callStaticMethod('com/retugame/commons/timer/CommonTimer',
                    'startTimer',
                    '(IIILjava/lang/String;)Ljava/lang/String;',
                    time,delaytime,
                    this.TIMMER_TYPE.INTERVAL,
                    'cc.' + callBackFunctionName + '()');
                 break;
            case cc.sys.OS_IOS: cc.log('还未支持');         //ios 处理
                 break;   
            default : cc.log('设备类型检测有问题');
        }

        return timmerId;
    }


   

    /**
     * 定时器的执行方法，作用类似js的setTimeout,属于执行一次的定时器
     * @param time //间隔的时间，单位为毫秒
     * @param callBack //回调函数
     * @param delaytime 延迟执行时间
     * @returns timmerId  定时器的id
     */
    public  static setTimeout(time:number,callBack: Function, delaytime?:number): number{
        //uuid 自加
        CommonTimmer.UUID ++;

        //设置原生回调
        let callBackFunctionName: string = 'gameTimmerCallBack' + CommonTimmer.UUID;
        cc[callBackFunctionName] = function(){
            callBack();
        }

        let timmerId: number = null;
        //浏览器处理
        if(cc.sys.isBrowser){       
            timmerId = setTimeout(function(){
                callBack();
            },time);
            return timmerId;
        }

        //手机处理
        let currentSystem: string = cc.sys.os;
        switch(currentSystem){
            case cc.sys.OS_ANDROID :    //android 处理
                 timmerId = jsb.reflection.callStaticMethod('com/retugame/commons/timer/CommonTimer',
                    'startTimer',
                    '(IIILjava/lang/String;)Ljava/lang/String;',
                    time,delaytime,
                    this.TIMMER_TYPE.TIMEOUT,
                    'cc.' + callBackFunctionName + '()');
                 break;
            case cc.sys.OS_IOS: cc.log('还未支持');         //ios 处理
                 break;   
            default : cc.log('设备类型检测有问题');
        }

        return timmerId;
    }
  
}
