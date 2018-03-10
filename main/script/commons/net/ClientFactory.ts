import Thrift = require('./thrift.proxy');

/**
 * 客户端类型
 */
export enum ClientType {
    HTTP,
    HTTPS,
    WEBSOCKET
}

/**
 * WebSocket客户端返回对象
 */
export type WebSocketClient = {
    /**
     * 传输协议对象
     */
    transport: TWebSocketTransport,

    /**
     * 客户端实例对象
     */
    client: any,
}

/**
 * 客户端工厂类，用于生成客户端对象
 */
export default class ClientFactory {
    //------------test----------------
    static host = 'http://127.0.0.1';
    // static host = 'http://192.168.10.145';

    static setHost(host: string): void {
        ClientFactory.host = host;
    }

    /**
     * 获取HTTP客户端对象
     * 
     * @param clientClass 客户端对象构造函数
     * @param module 处理请求的服务端模块名称
     * @param options 请求的可选参数
     * @return HTTP客户端对象
     */
    public static getHttpClient(clientClass: any, module: string, options?: Object): any {
        let transport = new Thrift.Transport(`${ClientFactory.host}/game?module=${module}`, {
            useCORS: true,
        });
        let protocol = new Thrift.Protocol(transport);
        let client = new clientClass(protocol);
        return client;
    }

    public static getHttpsClient(clientClass: any, module: string): any {
        //TODO 实现获取HTTPS客户端对象
    }

    /**
     * 获取WebSocket客户端对象
     * 
     * @param clientClass 客户端对象构造函数
     * @param module 处理请求的服务端模块名称
     * @return WebSocket客户端对象
     */
    public static getWebSocketClient(clientClass: any, module: string): WebSocketClient {
        let transport = new Thrift.TWebSocketTransport(`${ClientFactory._convertToWebSocketUrl(ClientFactory.host)}/websocket?module=${module}`);
        let protocol = new Thrift.Protocol(transport);
        let client = new clientClass(protocol);
        return {transport, client};
    }

    /**
     * 获取websocket传输协议
     * 
     * @return WebSocket传输协议
     */
    public static getWebSocketTransport(): TWebSocketTransport {
        return new Thrift.TWebSocketTransport(`${ClientFactory._convertToWebSocketUrl(ClientFactory.host)}/websocket`); 
    }

    /**
     * 将普通的url转换为WebSocket协议的url
     * 
     * @param url 需要转换的url
     */
    private static _convertToWebSocketUrl(url: string) {
        if (!url || !url.trim()) return url;
        let regex = /^(https|http)?:\/\/([^\s]+)/;
        let match = regex.exec(url);
        if (!match) return url;
        return match[1] === "http" ? `ws://${match[2]}` : `wss://${match[2]}`;
    }
}