const {ccclass, property} = cc._decorator;
import { SignAward } from "../typings/entities";
import PropClient from '../client/Prop';
import Global from '../commons/storage/Global';
import ClientFactory, {ClientType} from '../commons/net/ClientFactory';
import {zoneIdConf} from '../conf/zoneIdConf';

@ccclass
export default class GloryFieldUnlock extends cc.Component {

    
   

    //背景旋转图
    @property(cc.Sprite)
    animationBg : cc.Sprite = null;
    @property(cc.Button)
    btnGlory : cc.Button = null;

    @property([cc.SpriteFrame])
    awardFrames: [cc.SpriteFrame] = [null, null,null];


    @property(cc.Prefab)
    awardItem: cc.Prefab = null;

    awards: cc.Node[] = [];     //奖励节点集合
    allAwards: SignAward[] = [];

    onLoad() {
        // init logic
        this.init();
    }

    private init(){
        this.animationBg.node.runAction(cc.repeatForever(cc.rotateBy(15.0,360)));
    }

    public renderingReward(result) {
        
        this.init();
             
        let levelReward : SignAward ={
            name : 'diamond',
            amount : result.diamond,
            description :''
        };
        this.allAwards.push(levelReward);
 
        levelReward = {
            name : 'strength',
            amount : result.strength,
            description :''
        };
        this.allAwards.push(levelReward);
        let award : cc.Node;
        let rewardLayout: cc.Node = this.node.getChildByName('upgradeLayout').getChildByName('rewardLayout');
        for (let eachItem = 0; eachItem < this.allAwards.length; eachItem++){
             let eachAward : SignAward = this.allAwards[eachItem];
                 award= cc.instantiate(this.awardItem);
                 award.getChildByName('awardSprite').getComponent(cc.Sprite).spriteFrame = this._getSpecifiedFrame(eachAward.name);
                 award.getChildByName('amount').getComponent(cc.Label).string = 'x ' + eachAward.amount ;
                 rewardLayout.addChild(award);
             this.awards.push(award);
        }
        this.node.active=true;
     }
 
     /**
      * 关闭奖励页面
      */
     public async onClick(){
        let result= await this.receiveZoneUnlockReward(Global.getItem('userInfo').userId,zoneIdConf.CURRENT_FIELD);
        let resultJSON=JSON.parse(result);
        cc.log(resultJSON);
        if(resultJSON.status=="success"){
            cc.log(this.allAwards);
            let nowProp=Global.getItem('playerPropObj');
            nowProp.diamond+=this.allAwards[0].amount;
            nowProp.strength+=this.allAwards[1].amount;
            Global.setItem('playerPropObj',nowProp);
            let headBar=cc.director.getScene().getChildByName('head').getComponent('HeadBar');
            headBar.showPlayerProp();
        }
        this.btnGlory.getComponent(cc.Sprite).spriteFrame=this.awardFrames[2];
        // let unlockState={'isUnlock':true};
        // cc.sys.localStorage.setItem('unlockState',unlockState);
        cc.sys.localStorage.setItem('isUnlock',true);
        this.node.active=false;
     }

     private receiveZoneUnlockReward(uid:number,zoneId:number){
        return new Promise<string>((res, rej)=>{
            let propClient: PropClient = <PropClient> ClientFactory.getHttpClient(PropClient,'prop'); 
            propClient.rewardPlayerPropByUnlockZone(uid,zoneId ,function (result) {
                res(result);
            });
        });
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
