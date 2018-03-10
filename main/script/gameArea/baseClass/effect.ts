export default class Effect {

    effectNode: cc.Node = null;

    constructor(effectPrefab: cc.Prefab ) {
        this.effectNode = cc.instantiate(effectPrefab);
    }

    /**
     * 播放节点动画特效
     */
    palyEffect(){
        if(this.effectNode.name == 'boom'){
            this.effectNode.active = true;
        }
        let effectAnimation = this.effectNode.getComponent(cc.Animation);
        effectAnimation.play();

        this.destroyEffect(effectAnimation);
        
    }

    /**
     * 销毁特效节点
     * @param effectAnimation 
     */
    destroyEffect(effectAnimation: cc.Animation){
        //事件监听
        effectAnimation.on("finished",function(){
            effectAnimation.destroy();
            this.effectNode.destroy();
        },this);
    }

}
