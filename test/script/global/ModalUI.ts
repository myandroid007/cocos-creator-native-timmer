const {ccclass, property} = cc._decorator;

@ccclass
export default class ModalUI extends cc.Component {
    @property(cc.Node)
    mask: cc.Node = null;

    onLoad() {
        // init logic
    }
    

    onEnable() {
        this.mask.on('touchstart', event => event.stopPropagation());
        this.mask.on('touchend', event => event.stopPropagation());
        this.mask.on('mousedown', event => event.stopPropagation());
        this.mask.on('mouseup', event => event.stopPropagation());
    }

    onDisable() {
        this.mask.off('touchstart', event => event.stopPropagation());
        this.mask.off('touchend', event => event.stopPropagation());
        this.mask.off('mousedown', event => event.stopPropagation());
        this.mask.off('mouseup', event => event.stopPropagation());
    }
}
