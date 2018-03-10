const {ccclass, property} = cc._decorator;

@ccclass
export default class BtnScaler extends cc.Component {

    @property
    pressedScale:number=1;
    
    @property
    transDuration: number=0;

    onLoad() {
        // init logic
        var self=this;
        let initScale = this.node.scale;
        let scaleDownAction = cc.scaleTo(self.transDuration, self.pressedScale);
        let scaleUpAction = cc.scaleTo(self.transDuration, initScale);
        function onTouchDown (event) {
            this.stopAllActions();  
            this.runAction(scaleDownAction);
        }
        function onTouchUp (event) {
            this.stopAllActions();
            this.runAction(scaleUpAction);
        }
        this.node.on('touchstart', onTouchDown, this.node);
        this.node.on('touchend', onTouchUp, this.node);
        this.node.on('touchcancel', onTouchUp, this.node);
    }
}
