import DailySignWindow from "./dailySignWindow";

const {ccclass, property} = cc._decorator;

@ccclass
export default class recieveAwardPage extends cc.Component {

    onLoad() {
        this.showLignt();
        this._stopTouchPropagation();
        
    }

    /**
     * 显示背景光圈
     */
    public showLignt(){
        let light: cc.Node = this.node.getChildByName('light');

        let repeat = cc.repeatForever(cc.rotateBy(2,180));
        light.runAction(repeat);
    }

    /**
     * 显示领取到的奖励
     * @param awardFrame   奖励图片
     * @param describe    描述
     */
    public showAward(awardFrame: cc.SpriteFrame, describe: string){
        let pic: cc.Node = new cc.Node();
        pic.addComponent(cc.Sprite).spriteFrame = awardFrame;
        pic.scale = 2;  //放大显示图标
        let description: cc.Node = new cc.Node();
        description.addComponent(cc.Label).string = describe;

        let award: cc.Node = new cc.Node();
        let layout = award.addComponent(cc.Layout);
        layout.type = cc.Layout.Type.VERTICAL;
        layout.spacingY = 30;   //间隔显示
        award.addChild(pic);
        award.addChild(description);

        this.node.getChildByName('awardsLayout').addChild(award);
    }

    /**
     * 确认领取奖励
     */
    public ensureAward(){
        this._closePage();
    }

    /** 
    * 停止点击事件冒泡
    */
   private _stopTouchPropagation(){
        this.node.getChildByName('mask').on(cc.Node.EventType.TOUCH_START,(event)=>{
            event.stopPropagation();
        })
    }

    /**
     * 关闭页面
     */
    private  _closePage(){
        this.node.destroy();
        this.node.parent.getComponent(DailySignWindow).closePage();
    }
}
