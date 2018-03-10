import CommonTimer from "../commons/timer/CommonTimer";

const {ccclass, property} = cc._decorator;



let self = this;

(<any>cc)._countDownCallBack=function (){
    self._countDownCallBack();
 }


@ccclass
export default class GameAttention extends cc.Component {

    @property(cc.Prefab)    //开始提示的云特效
    cloudPrefab: cc.Prefab = null;

    @property(cc.Prefab)   //开始时倒计时图片
    timmer: cc.Prefab = null;

    @property(cc.SpriteFrame)   //开始提示时的提示
    attentionTimer: cc.SpriteFrame = null;

    startGameCallBack: Function = null; //开始提示完成之后的回调方法
    cloud: cc.Node = null;
    timerId: number = null;

    onLoad() {
        self = this;
    }

    /**
     * 显示开始提醒
     */
    public showStartAttention(){
        //生成云
        let cloud = cc.instantiate(this.cloudPrefab);
        this.node.addChild(cloud);
        let clips: cc.AnimationClip[] = cloud.getComponent(cc.Animation).getClips();
        cc.log('剪辑：',  clips)
        cloud.getChildByName('cloud').getComponent(cc.Animation).play(clips[0].name);   

        let timmer: cc.Node = cc.instantiate(this.timmer);
        cloud.addChild(timmer);

        this.cloud = cloud;

        this.timerId = CommonTimer.setInterval(1000, 'cc._countDownCallBack()', self._countDownCallBack)
    }

    /**
     * 倒计时回调
     */
    private _countDownCallBack(){
        let timmer = self.cloud.getChildByName('timmer').getChildByName('restTime');
        let label = timmer.getComponent(cc.Label);
        let clips: cc.AnimationClip[] = self.cloud.getComponent(cc.Animation).getClips();
        label.string = parseInt(label.string)-1 +'';

        if(parseInt(label.string) <0){
            CommonTimer.clearInterval(self.timerId);    //清除定时器
            timmer.destroy();
            let animation = self.cloud.getChildByName('cloud').getComponent(cc.Animation);
            animation.play(clips[1].name);
            animation.on("finished",function(){
                self.cloud.destroy();
                self.startGameCallBack();
            },self);
        }
    }

    /**
     * 显示剩余时间提示
     * @param restTime  剩余时间
     */
    public showRestTimeAttention(restTime: number){
        let attentionNode: cc.Node  =  this.node.getChildByName('restTime');
        attentionNode.getComponent(cc.Label).string = `只剩${restTime}秒了，加油！`;
        attentionNode.active = true;

        this.scheduleOnce(()=>{
            attentionNode.active = false;
        },1)
    }

    /**
     * 显示游戏结束提醒
     */
    public showGameEndAttention(){
         //生成云
         let cloud = cc.instantiate(this.cloudPrefab);
         this.node.addChild(cloud);
         let clips: cc.AnimationClip[] = cloud.getComponent(cc.Animation).getClips();
         cloud.getChildByName('cloud').getComponent(cc.Animation).play(clips[0].name); 
         //生成提示
         let label = new cc.Node();
         label.addComponent(cc.Label).string = "游戏时间到！"
         label.color = new cc.Color(0,0,0);
         cloud.getChildByName('cloud').addChild(label);
    }
    
}
