


/**
 * 公用原生定时器，使用方式类似js原生定时器
 * @author 龙涛
 * 2017/12/14 
 */
export default class CommonTimer  { 
    private TIMMER_TYPE = {
        INTERVAL: 0,
        TIMEOUT: 1
    }
    private current_timmer_type: number = 0; 
    private timmerId: number = null;        //定时器id


       /**
     * 根据参数handlerId关闭相应的定时器
     * @param handlerId 
     */
    public static clearInterval(id: number):void{

        if(cc.sys.isNative){
            if(cc.sys.os===cc.sys.OS_ANDROID){
                jsb.reflection.callStaticMethod('com/retugame/commons/timer/CommonTimer','closeTimer',
                '(Ljava/lang/String;)V',id);
            }else if(cc.sys.os===cc.sys.OS_IOS){
            }
        }else{
            clearInterval(id);
        } 
    }
       /**
     * 根据参数handlerId关闭相应的定时器
     * @param handlerId 
     */
    public static clearTimeOut(id: number):void{

        if(cc.sys.isNative){
            if(cc.sys.os===cc.sys.OS_ANDROID){
                jsb.reflection.callStaticMethod('com/retugame/commons/timer/CommonTimer','closeTimer',
                '(Ljava/lang/String;)V',id);
            }else if(cc.sys.os===cc.sys.OS_IOS){
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
    public  interval(time:number,callBack: Function, delaytime?:number): number{
        this.current_timmer_type = this.TIMMER_TYPE.INTERVAL;       //设置当前定时器类型

        if(cc.sys.isBrowser){       //浏览器处理
            this.timmerId = setInterval(function(){
                callBack();
            },time);
            return this.timmerId;
        }


        //手机处理
        let currentSystem: string = cc.sys.os;
        switch(currentSystem){
            case cc.sys.OS_ANDROID :    //android 处理
                 this.timmerId = jsb.reflection.callStaticMethod('com/retugame/commons/timer/CommonTimer','startTimer',
                    '(IIILjava/lang/String;)Ljava/lang/String;',time,delaytime,this.TIMMER_TYPE.INTERVAL,callBack);
                 break;
            case cc.sys.OS_IOS: cc.log('还未支持');         //ios 处理
                 break;   
            default : cc.log('设备类型检测有问题');
        }

        return this.timmerId;
    }


    /**
     * 定时器的执行方法，作用类似js的setInterval,属于一直执行的定时器。该方法会返回一个定时器的id，你可以根据
     * 这个id，关闭相应的定时器
     * @param time //每次间隔的时间，秒为单位
     * @param callBack //js端回调方法名，（在你要使用的地方，格式这样写 cc.回调方法名及callBack=function(){}
     *                   注意需要定义在全局
     */
    public  setInterval(time:number,callBack:string,callBackOnWeb?:Function,delaytime?:number):any{
        let handlerId:any=null;
        if(cc.sys.isNative){
            if(cc.sys.os===cc.sys.OS_ANDROID){
                handlerId=jsb.reflection.callStaticMethod('com/retugame/commons/timer/CommonTimer','startTimer',
                                                  '(IIILjava/lang/String;)Ljava/lang/String;',time,delaytime,this.TIMMER_TYPE.TIMEOUT,callBack);
            }
        }else{
            handlerId=setInterval(function(){
                callBackOnWeb();
            },time);
           
        }
        return handlerId;
    }
    
   

    /**
     * 定时器的执行方法，作用类似js的setTimeout,属于执行一次的定时器，该方法会返回一个定时器的id，你可以根据
     * 这个id，关闭相应的定时器
     * @param time //间隔的时间，秒为单位
     * @param callBack //js端回调方法名，（在你要使用的地方，格式这样写 cc.回调方法名及callBack=function(){}
     *                   注意需要定义在全局
     */
    public  setTimeout(time:number,callBack:string,callBackOnWeb?:Function):any{
        let handlerId:any='';
        if(cc.sys.isNative){
            if(cc.sys.os===cc.sys.OS_ANDROID){
                handlerId=jsb.reflection.callStaticMethod('com/retugame/commons/timer/CommonTimer','startTimer',
                                                 '(IIILjava/lang/String;)Ljava/lang/String;',time,0,this.SETTIMEOUT_TYPE,callBack);
            }else if(cc.sys.os===cc.sys.OS_IOS){
            }
        }else{
            handlerId=setTimeout(function(){
                callBackOnWeb(this);
            },time);
        }
        return handlerId;
    }


  
}
