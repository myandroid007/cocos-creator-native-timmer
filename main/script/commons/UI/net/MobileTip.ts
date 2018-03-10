const {ccclass, property} = cc._decorator;

/**
 * 移动流量消息框脚本
 * @author 龙涛
 * 2018/1/19
 */

@ccclass
export default class MobileTip extends cc.Component {

    //继续按钮
    @property(cc.Button)
    determine: cc.Button = null;

    onLoad() {
        //将消息框设置为常驻节点
       
        cc.game.addPersistRootNode(this.node);
    }

    /**
     * 继续按钮点击事件，绑定脚本
     * @param event 事件类型
     * @param customEventData 输入参数 
     */
    onClick(event,customEventData){
       this.node.x=-375;
    }
}
