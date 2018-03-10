import ClientFactory, { ClientType } from '../../commons/net/ClientFactory';
import PlayerClient from '../../client/Player';
import { SignAward } from "../../typings/entities";
import Global from '../../commons/storage/Global';

const { ccclass, property } = cc._decorator;

@ccclass
export default class LevelRise extends cc.Component {


    @property(cc.Node)
    upgradeLayout : cc.Node =null;
    @property(cc.RichText)
    levelLabel : cc.RichText = null;
    @property(cc.Button)
    getRewardBtn : cc.Button = null;

    //背景旋转图
    @property(cc.Sprite)
    animationBg : cc.Sprite = null;

    @property([cc.SpriteFrame])
    awardFrames: [cc.SpriteFrame] = [null, null];


    @property(cc.Prefab)
    awardItem: cc.Prefab = null;

    awards: cc.Node[] = [];     //奖励节点集合
    allAwards: SignAward[] = [];    //本月签到奖励数据源

    rewardResult: any = null;

    async onLoad() {
        //TODO init logic
        this.init();
    }

    private init() {
        var seq = cc.repeatForever(cc.rotateBy(15.0,360));
        this.animationBg.node.runAction(seq);
    }

    public renderingReward(rewardResult : string) {
       // cc.info("开始渲染信息"+rewardResult+"\n" +JSON.parse(rewardResult).data);
        let levelRiseResult = JSON.parse(rewardResult).data.levelRiseResult;
        cc.info("result:" +levelRiseResult);
        let rewardJsonResult = levelRiseResult;
        this.rewardResult = rewardJsonResult;
        if (rewardJsonResult.status == "success") {
            this.upgradeLayout.setPositionX(0);
            this.init();
            this.levelLabel.string = '<color=#F9F62B>恭喜您升到LV'+rewardJsonResult.data.type+'</c>'
            
            let levelReward : SignAward ={
                name : 'diamond',
                amount : rewardJsonResult.data.diamond,
                description :''
            };
            this.allAwards.push(levelReward);

            levelReward = {
                name : 'strength',
                amount : rewardJsonResult.data.strength,
                description :''
            };
            this.allAwards.push(levelReward);

           
            let award : cc.Node;
            let rewardLayout: cc.Node = this.upgradeLayout.getChildByName('upgradeLayout').getChildByName('rewardLayout');
            for (let eachItem = 0; eachItem < this.allAwards.length; eachItem++){
                let eachAward : SignAward = this.allAwards[eachItem];
                award= cc.instantiate(this.awardItem);
                award.getChildByName('awardSprite').getComponent(cc.Sprite).spriteFrame = this._getSpecifiedFrame(eachAward.name);
                award.getChildByName('amount').getComponent(cc.Label).string = 'x ' + eachAward.amount ;
                rewardLayout.addChild(award);
                this.awards.push(award);
            }
        }
    }

    /**
     * 关闭奖励页面
     */
    public closeUpgradeRewardPage(){
        this.upgradeLayout.setPositionX(750);
        //增加用户道具
        let playerProp = Global.getItem('playerPropObj');
        playerProp.diamond = parseInt(this.rewardResult.data.diamond.toString()) + parseInt(playerProp.diamond);
        playerProp.strength = parseInt(this.rewardResult.data.strength.toString()) + parseInt(playerProp.strength);
        Global.setItem('playerPropObj', playerProp);
        let headBar = cc.director.getScene().getChildByName('head').getComponent('HeadBar');
        headBar.showPlayerProp();
            
    }
    
    /**
     * 返回指定名称的资源spriteFrame
     * @param name 
     */
    private _getSpecifiedFrame(name: string): cc.SpriteFrame {
        let result: cc.SpriteFrame = null;
        for (let i = 0; i <= this.awardFrames.length - 1; i++) {
            if (this.awardFrames[i].name == name) {
                return this.awardFrames[i];
            }
        }
        cc.log('没有此种类型的资源');
        return null;
    }

}
