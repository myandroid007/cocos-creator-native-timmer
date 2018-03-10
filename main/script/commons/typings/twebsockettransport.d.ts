declare class TWebSocketTransport {
    /**
     * 当前websocket连接是否打开
     */
    isOpen(): boolean;    

    /**
     * 打开websocket连接
     */
    open(): void;

    /**
     * 关闭websocket连接
     */
    close(): void;

    /**
     * 注册消息处理器
     * 
     * @param handler 需要注册的消息处理器
     * @return 被注册的消息处理器
     */
    registerMessageHandler(handler: (msg) => void): (msg) => void;

    /**
     * 移除指定的消息处理器
     * 
     * @param handler 需要移除的消息处理器
     */
    removeMessageHandler(handler: (msg) => void): void;
}