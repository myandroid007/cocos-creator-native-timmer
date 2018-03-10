import Alert from './UI/android/Alert';
const {ccclass, property} = cc._decorator;

/**
 * 返回事件
 */
export enum BackEvent {
    /**
     * 点击返回按钮事件
     */
    HARDWARE_BACK_PRESS,

    /**
     * 退出APP事件
     */
    EXIT_APP,
} 

/**
 * 返回事件监听器
 */
export type BackEventListener = {
    /**
     * 返回事件
     */
    event: BackEvent,

    /**
     * 当发生返回事件时的处理器，处理器按添加的倒序方式执行，当有一个处理器返回true后，之前加入的执行器不再执行
     */
    handler: () => boolean,

    /**
     * 处理器的执行环境。当场景卸载后，但没有移除的事件监听器一样不执行
     */
    handlerContext: Object
}

/**
 * 返回处理器。进行返回按钮事件监听并进行对应的处理
 */
@ccclass
export default class BackHandler {
    private static _backListeners: Array<BackEventListener> = [];
    private static _exitAppListeners: Array<BackEventListener> = [];

    /**
     * 初始化返回处理器 
     * 
     * @param 需要挂载的常驻节点
     */
    static init(node: cc.Node) {
        this._addAndroidBackListener(node);
        // 添加显示提示框监听器
        this.addEventListener({
            event: BackEvent.HARDWARE_BACK_PRESS,
            handler: () => {
                Alert.alert("消除大作战", "是否退出当前应用？", [
                    {text:"取消", onPress: () => {}},
                    {text:"确定", onPress: () => {this._handleListeners(BackEvent.EXIT_APP)}}
                ]);
                return true
            },
            handlerContext: node
        });
        // 添加退出APP监听器
        this.addEventListener({
            event: BackEvent.EXIT_APP, 
            handler: () => {
                this.exitApp();
                return true; 
            }, 
            handlerContext: node
        });
    }

    /**
     * 添加Android返回按钮事件监听
     * 
     * @param 挂载监听器的常驻节点
     */
    private static _addAndroidBackListener(node: cc.Node): void {
        if (cc.sys.os == cc.sys.OS_ANDROID) {
            cc.eventManager.addListener({
                event: cc.EventListener.KEYBOARD,
                onKeyPressed: (keyCode, event) => {
                    if (keyCode == cc.KEY.back) {
                        this._handleListeners(BackEvent.HARDWARE_BACK_PRESS);
                    }
                },
            }, node);
        }
    }

    /**
     * 处理返回事件
     * 
     * @param 需要处理的返回事件类型
     */
    private static _handleListeners(event: BackEvent) {
        let listeners: Array<BackEventListener>; 
        if (event == BackEvent.HARDWARE_BACK_PRESS) {
            listeners = this._backListeners;
        } else {
            listeners = this._exitAppListeners;
        }
        if (listeners.length < 1) return;

        for (let i = listeners.length - 1; i >= 0; i--) {
            let listener = listeners[i];
            if (!!listener.handlerContext) {
                if (listener.handler()) {
                    // 当运行到的处理器返回true后，不再执行之前的处理器
                    break;
                }
            } else {
                // 如果处理器的执行环境不存在，则移除此监听器
                // TODO 有问题删除元素后，数据长度变化
                // listeners.splice(i, 1);
            }
        }
    }

   /**
    * 添加事件监听器
    * 
    * @param listener 需要添加的事件监听器，监听器中的处理器按倒序的方式执行，当一个函数返回true，则后续的处理器不执行
    */
    public static addEventListener(listener: BackEventListener): BackEventListener {
        // 目前只实现Android系统的返回按键监听，非Android系统直接返回
        if (cc.sys.os != cc.sys.OS_ANDROID) {
            return listener;
        }

        if (listener.event == BackEvent.HARDWARE_BACK_PRESS) {
            this._backListeners.push(listener);
        } else {
            this._exitAppListeners.push(listener);
        }
        
        return listener;
    }
    
   /**
    * 移除指定的事件监听器
    *
    * @param listener 需要移除的事件监听器
    */
    public static removeEventListener(listener: BackEventListener): void {
        // 目前只实现Android系统的返回按键监听，非Android系统直接返回
        if (cc.sys.os != cc.sys.OS_ANDROID) {
            return;
        }

        if (listener.event == BackEvent.HARDWARE_BACK_PRESS) {
            this._backListeners = this._backListeners.filter(curListener => curListener !== listener);
        } else {
            this._exitAppListeners = this._exitAppListeners.filter(curListener => curListener !== listener);
        }
    }
    
   /**
    * 退出APP
    */
    public static exitApp(): void {
        cc.game.end();
    }
}