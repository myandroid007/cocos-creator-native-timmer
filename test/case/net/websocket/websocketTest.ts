import ClientFactory, { WebSocketClient } from "../../../../main/script/commons/net/ClientFactory";
import PropClient from "../../../../main/script/client/Prop";

const {ccclass, property} = cc._decorator;

@ccclass
export default class WebSocketTest extends cc.Component {

    @property(cc.Label)
    pullRst: cc.Label = null;
    @property(cc.Label)
    pushRst: cc.Label = null;

    onLoad() {
        // init logic
    }

    openWebSocket() {
        let propWebSocketClient: WebSocketClient =  ClientFactory.getWebSocketClient(PropClient, 'prop'); 
        let {transport, client} = propWebSocketClient;
        transport.registerMessageHandler(msg => {
            this.pushRst.string = msg;
        });
        transport.open();
        (<PropClient>client).getPlayerProp(3, rst => {
            this.pullRst.string = rst;
        });
    }
}
