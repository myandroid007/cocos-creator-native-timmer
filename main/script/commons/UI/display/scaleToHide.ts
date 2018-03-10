const {ccclass, property} = cc._decorator;

@ccclass
export default class ScaleToHide extends cc.Component {

    runFinishedCallBack: Function = null;
    onLoad() {
       
    }

    /**
     * 运行消失动画
     */
    public run(){
        let action1: cc.Action = cc.scaleTo(0.1, 1.1);
        let action2: cc.Action = cc.scaleTo(0.1, 0.1);
        let callback = cc.callFunc(function(){   //消除动画后的回调
            this.runFinishedCallBack();
        },this);

        let actionArray = [];
        actionArray.push(action1);
        actionArray.push(action2);
        actionArray.push(callback);

        this.node.runAction(cc.sequence(actionArray));
    }
}
