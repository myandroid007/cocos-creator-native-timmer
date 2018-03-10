import BackHandler from '../BackHandler';
import MusicManager from '../musicManager/musicManager';
const {ccclass, property} = cc._decorator;

/**
 * 功能性常驻节点
 */
@ccclass
export default class FunctionalPersist extends cc.Component {

    onLoad() {
        cc.game.addPersistRootNode(this.node);
        BackHandler.init(this.node);
        MusicManager.init();
    }
}
