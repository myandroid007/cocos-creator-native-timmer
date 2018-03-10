const {ccclass, property} = cc._decorator;

import {EPlayer} from '../typings/entities';
import CommonTimer from '../commons/timer/CommonTimer';
import SceneNavigator from '../commons/scene/SceneNavigator';
import OpponentMatchAreaUI from '../commons/UI/match/OpponentMatchAreaUI';
import OpponentDispatcher from '../commons/dispatcher/OpponentDispatcher';
import PlayerClient from '../client/Player';
import ClientFactory, {ClientType} from '../commons/net/ClientFactory';
import NetChecker from '../commons/net/NetChecker';
import {NetwokType} from '../typings/entities';
import {endSceneConf} from '../gameEnd/endSceneConf';
import BitmapUtil from '../commons/util/BitmapUitl';
import Global from '../commons/storage/Global';
import {zoneIdConf} from '../conf/zoneIdConf';


var self=null;


(<any>cc).timeCallback=function (){
    self.showMatchTime();
},

(<any>cc).showTipsCallback =function (){
    self.showTips();
}

 

/**
 * 匹配界面脚本
 * @author 龙涛
 * 2017/12/18 修改
 */

@ccclass
export default class OpponentMatchSence extends cc.Component {
 
    static pkGroupObj: number[][] = null;
    

    //字体
    @property(cc.Font)
    font: cc.Font = null;
    //名称昵称文本框预制体
    @property(cc.Prefab)
    preNickName: cc.Prefab = null;
    //时间标签
    @property(cc.Label)
    textMatchTime: cc.Label = null;
    //提示文本
    @property(cc.Label)
    textTips: cc.Label = null;
    //左拳
    @property(cc.Sprite)
    spriteBoxingLeft: cc.Sprite = null;
    //右拳
    @property(cc.Sprite)
    spriteBoxingRight: cc.Sprite = null;

   
   


   
    //开始游戏按钮
    @property(cc.Button)
    btnStartMatch: cc.Button = null;


    //headBar:cc.Node=null;

    //匹配页面
    matchPage: cc.Node = null;
    //规则页面
    rulePage: cc.Node = null;
    //头部条节点
    headBar: cc.Node = null;

    //时间值
    private matchtime:number=25;
    //当前原生定时器的id
    private handlerId:any='';
    //提示语定时器的id
    private tipHandlerId:any='';
    //对手匹配ui组件
    private matchUiNode : OpponentMatchAreaUI=null;
    //对手数据分发器
    private opponentDispatcher : OpponentDispatcher=null;


 
    

    onLoad() {
        self=this;
        //console.log('auto call onLoad');
        this.headBar=cc.director.getScene().getChildByName('head');
        // //拿到匹配与规则页面节点
        this.matchPage=this.node.getChildByName('matchPage');
        this.rulePage=cc.director.getScene().getChildByName('rulePage');

        //cc.sys.localStorage.setItem('primary', false);
        this._checkIsShowRulePage();
        
        //场景检测网络的，回调方法
        NetChecker.addEventListener('change','checkNetState',this.checkNetState);
        //NetChecker.checkNetWork();
        
        //初始化对手匹配Ui组件
        this.matchUiNode=new OpponentMatchAreaUI({opponentNum:5,isRandom: false }, 
                             this.matchPage,this.font,this.preNickName,this._goGameScene);     
        this.matchUiNode.init();
        this.matchUiNode.addOpponent(this.getPlayerSelfInfo());
        //初始化对手分发器
        this.opponentDispatcher=new OpponentDispatcher(false,15,10,this.matchUiNode);
        //按钮动画
        this.btnStartMatch.node.runAction(cc.repeatForever(cc.sequence(
            cc.scaleTo(endSceneConf.BTANIMATION_CONF.SCALE_TIME,
                       endSceneConf.BTANIMATION_CONF.START_SCALE_VALUE,
                       endSceneConf.BTANIMATION_CONF.START_SCALE_VALUE)
                       .easing(cc.easeBackInOut()),
            cc.scaleTo(endSceneConf.BTANIMATION_CONF.SCALE_TIME,
                       endSceneConf.BTANIMATION_CONF.END_SCALE_VALUE,
                       endSceneConf.BTANIMATION_CONF.END_SCALE_VALUE)
                       .easing(cc.easeBackInOut())
        )));

    }

    update(dt){

        //显示倒计时时间
        if(!NetChecker.isStop){
            this.textMatchTime.string=this.matchtime+'S'; 
           // this.showPlayerPoint();
            //检测对手是否分发完毕
            this._dispatchComplate();
        }
        
    }

    onDestroy(){
        //场景被销毁时，移除监听
        NetChecker.removeEventLisener('change','checkNetState');
        CommonTimer.clearInterval(this.handlerId);
        CommonTimer.clearInterval(this.tipHandlerId);
    }

   
    onClick(event,customEventData){
        switch(customEventData){
            case 'match':
               this._startMatch();
            break;
            case 'backMainScene':
               SceneNavigator.push({sceneName:'gameMain'});
            break;
        }  
    }

    
    _checkIsShowRulePage(){
        let value:string='';
        switch(zoneIdConf.CURRENT_FIELD){
            case zoneIdConf.PRIMARY_FIELD:
                 value='primary';
            break;
            case zoneIdConf.INTERMEDIATE_FIELD:
                 value='intermediate';
            break;
            case zoneIdConf.ADVANCED_FIELD:
                 value='senior';
            break;
            case zoneIdConf.GLORY_FIELD:
                 value='glory';
            break;
        }
        Global.setItem('selectValue',value);
        if(value!=''){
            let notShow=cc.sys.localStorage.getItem(value);
            if(!!notShow){
                if(notShow=='true'){
                    this.rulePage.x=1500;
                }else{
                    this.rulePage.x=375; 
                }
                
            }else{
                this.rulePage.x=375; 
            }
        }
       
    }

    
    
    _startMatch(){
        //初始化对手分发器
        this.opponentDispatcher.dispatchStart();
         
        //启动对拳动画
        let boxing=this.matchPage.getChildByName('boxing');
        boxing.active=true;  
        //置灰按钮
        this.btnStartMatch.interactable=false;
        
        (this.headBar.getComponent('HeadBar')).isCanClickBtns(false);
        //启动倒计时定时器
        this._callTimer.call(this);
        //对拳动画
        this._runBoxingAction(60,0.6,0.2);
        this.btnStartMatch.node.stopAllActions();
        this.deductionStrength();
    }
    showTips(){
        self.tipCount++;
        if(self.tipCount>=5){
            self.textTips.string='Tips : '+self.testTips[self.tipIndex]
            self.tipIndex++;
            if(self.tipIndex>=3){
                self.tipIndex=0;
            }
            self.tipCount=0;
        }
    }

    private deductionStrength(){
        let nowProp=Global.getItem('playerPropObj');
        nowProp.strength-=zoneIdConf.SIMULATION_DEDUCTION_STREN;
        Global.setItem('playerPropObj',nowProp);
        let headBar=cc.director.getScene().getChildByName('head').getComponent('HeadBar');
        headBar.showPlayerProp();
    }

    /**
     * 网络类型判断，并作出相应处理
     */
    checkNetState(){
        let netType=NetChecker.getNetConnectionType();
        if(netType==NetwokType.NO_NETWORK){
        //    self._showNetworkInterruptionAlert(self.mobileAlert,false);
        //    //self._showNetworkInterruptionAlert(self.netBreakAlert,true);
            NetChecker.alert.x=375;
            NetChecker.isStop=true;
        }else {
            //NetChecker.alert.x=-375;
            // if(netType==NetwokType.WIFI){
            //     self._showNetworkInterruptionAlert(self.mobileAlert,false);
            // }else{
            //     self._showNetworkInterruptionAlert(self.netBreakAlert,false);
            //     self._showNetworkInterruptionAlert(self.mobileAlert,true);
            // }   
        }
    }

    /**
     * 显示隐藏对应的检测消息框
     * @param target 要显示的消息框节点
     * @param tag 显示隐藏标志，true为显示，false为隐藏
     */
    private _showNetworkInterruptionAlert(target:cc.Node,tag:boolean){
        if(tag){
            target.x=375;
        }else{
            target.x=-375;
        }
    }
   
    /**
     * 让时间值减一
     */  
    showMatchTime () {
        if(self.matchtime>0){
            self.matchtime--;
        }
        if(self.matchtime<=5){
            if(!NetChecker.isStop){
                CommonTimer.clearInterval(self.handlerId);
            }
        }
    }

    /**
     * 跳转场景，传入场景名，输入数据等参数
     */
    private _goGameScene() {
        //cc.director.getScene().getChildByName('outlayout').y=-1334;
        SceneNavigator.push({sceneName:'game',sceneInput:{pkGroupObj: OpponentMatchSence.pkGroupObj}});
    }

     /**
     * 不同的平台调用不同的定时器
     */  
    private _callTimer(){
        this.handlerId=CommonTimer.setInterval(1000,'cc.timeCallback();',this.showMatchTime,1000);
        this.tipHandlerId=CommonTimer.setInterval(1000,'cc.showTipsCallback();',this.showTips);
        
    }

    /**
     * 对拳的动画，
     * @param distant 移动的距离
     * @param timego 离开的动画时间
     * @param timeback 相撞的动画时间
     */
    private _runBoxingAction(distant:number,timego:number,timeback:number):void{
        let tagertY=this.spriteBoxingLeft.node.y;
        let actiongoleft=cc.moveTo(timego,cc.p(-distant,tagertY)).easing(cc.easeCubicActionIn());
        let actionbackleft=cc.moveTo(timeback,cc.p(0,tagertY)).easing(cc.easeCubicActionOut());
        let actiongoright=cc.moveTo(timego,cc.p(distant,tagertY)).easing(cc.easeCubicActionIn());
        let actionbackright=cc.moveTo(timeback,cc.p(0,tagertY)).easing(cc.easeCubicActionOut());
        let sequnceleft=cc.sequence(actiongoleft,actionbackleft).repeatForever();
        let sequnceright=cc.sequence(actiongoright,actionbackright).repeatForever();
        this.spriteBoxingLeft.node.runAction(sequnceleft);
        this.spriteBoxingRight.node.runAction(sequnceright);
    }

    /**
     * //分发完毕时关闭定时器
     */
    private _dispatchComplate():void{
        let num=this.matchUiNode.getSurplusVacancy();
        if(num==0){
            CommonTimer.clearInterval(this.handlerId);
            CommonTimer.clearInterval(this.tipHandlerId);
        }
    }

   
    /**
     * 测试数据
     */
    testTips:string[]=['高场次获得的奖励会更多哟','测试测试测试测试测试测试测试','测试测试测试测试测试测试测试测试'];
    tipCount:number=0;
    tipIndex:number=1;
    icons : string[]=['http://qlogo2.store.qq.com/qzone/1210926237/1210926237/50?1507397645'];
    private getPlayerSelfInfo():EPlayer[]{
        let opponentList : EPlayer[]=[];
        let player:EPlayer=null;
            if(!!Global.getItem('userInfo')){
                player=Global.getItem('userInfo');
            }else{
                player ={
                    username:'111',
                    nickname:'Lilian',
                    id:9521,
                    avatar:this.icons[0],
                    isVirtual:false,
                };
            }
        opponentList.push(player);
        return opponentList;
    }
}
