const ThriftProxy = require('./thrift');

/** 重新实现__onMessage，以支持后端推送 */
ThriftProxy.TWebSocketTransport.prototype.__onMessage__ = ThriftProxy.TWebSocketTransport.prototype.__onMessage;
ThriftProxy.TWebSocketTransport.prototype.__onMessage = function (evt) {
    this.__onMessage__(evt);
    this.__msgHandlers.map(handler => { handler(evt.data) });
};

ThriftProxy.TWebSocketTransport.prototype.__msgHandlers = [];
/** 
 * 注册消息处理器，当前端接收到消息时执行已注册的消息处理器
 * 
 * @param {(msg) => void} handler 处理器
 * @return {(msg) => void} 返回被注册的处理器
 */
ThriftProxy.TWebSocketTransport.prototype.registerMessageHandler = function (handler) {
    if (!handler) return;
    this.__msgHandlers.push(handler);
    return handler;
};
/**
 * 移除已注册的消息处理器
 * 
 * @param {(msg) => void} handler 需要移除的消息处理器
 */
ThriftProxy.TWebSocketTransport.prototype.removeMessageHandler = function (handler) {
    this.msgHandlers = this.msgHandlers.filter(curHandler => curHandler !== handler);
}

module.exports = ThriftProxy; 
