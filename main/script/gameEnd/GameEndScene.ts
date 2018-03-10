const {ccclass, property} = cc._decorator;
import {PlayResult} from '../typings/entities';
import {endSceneConf} from './endSceneConf';
import CommonTimer from '../commons/timer/CommonTimer';
import MathUtil from '../commons/util/MathUtil'
import SceneNavigator from '../commons/scene/SceneNavigator';
import NetChecker from '../commons/net/NetChecker';
import ZoneClient from '../client/Zone';
import ClientFactory, {ClientType} from '../commons/net/ClientFactory';
import PlayerClient from '../client/Player';
import Global from '../commons/storage/Global';
import BitmapUtil from '../commons/util/BitmapUitl';
import {zoneIdConf} from '../conf/zoneIdConf';
import MessageBox from '../commons/UI/messageBox/MessageBox';
import {ButtonType} from '../typings/entities';

var self=null;
(<any>cc).animationDelay=function (){
    self.startRunAction();
},
(<any>cc).switchPage=function (){
    self._showEndPage();
}
/**
 * 结束场景脚本
 * @author 龙涛
 * 2017/12/25
 */


@ccclass
export default class GameEndScene extends cc.Component {


    //历史最高分
    @property(cc.Label)
    textHighest: cc.Label = null;
    //今日排名
    @property(cc.Label)
    textTodayRanking: cc.Label = null;
    //胜利或失败标志文本
    @property(cc.Label)
    textResultTip: cc.Label = null;
    //奖励的经验
    @property(cc.Label)
    textPoint: cc.Label = null;
    //奖励的积分
    @property(cc.Label)
    textExperience: cc.Label = null;
    //打破纪录额外奖励的积分
    @property(cc.Label)
    textBreakRecord: cc.Label = null;
    //玩家得分文本
    @property(cc.Label)
    textSelfScore: cc.Label = null;
    //返回按钮
    @property(cc.Button)
    btnBack: cc.Button = null;
    //再来一次按钮
    @property(cc.Button)
    btnPlayAgain: cc.Button = null;
    //动画
    @property(cc.Sprite)
    spriteAnim: cc.Sprite = null;
    //玩家名次图标
    @property(cc.Sprite)
    spriteSelfRanking: cc.Sprite = null;
    //对手一名次图标
    @property(cc.Sprite)
    spriteOpponentRanking1: cc.Sprite = null;
    //对手二名次图标
    @property(cc.Sprite)
    spriteOpponentRanking2: cc.Sprite = null;
    //对手三名次图标
    @property(cc.Sprite)
    spriteOpponentRanking3: cc.Sprite = null;
    //对手四名次图标
    @property(cc.Sprite)
    spriteOpponentRanking4: cc.Sprite = null;
    //按钮组
    @property(cc.Node)
    btnGroup: cc.Node = null;
    //奖励信息节点
    @property(cc.Node)
    rewardInfo: cc.Node = null;


    //是否开始自加分数标志
    private isStartAddSelfScore:boolean=false;
    //是否开始自加分数标志
    private isStartAddOpponentScore:boolean=false;
    //是否开始自加分数标志
    private isStartRunAction:boolean=false;


    //胜利或失败文本的x坐标
    private tipX: number=0;
    //玩家当前的分值
    private currentScore:number = 0;
    //玩家分数单次增量
    private selfScoreAddSpeed:number=0;
    //玩家比赛结果对象
    private playerSelfResult:PlayResult=null;
    //结束页面节点
    private endPage:cc.Node=null;
    //对手分label数集合
    private scoreList:cc.Node[]=[];
    //当前对手分数集合
    private currentScoreList:number[]=[0,0,0,0];
    //对手分数集合
    private opponentScoreList:number[]=[];
    //对手分数自家速率集合
    private scoreAddSpeedList:number[]=[];

    //玩家id
    private id: number = 0;

    private index:number=0;

    private accessMessageBox:MessageBox = null;

    private failStatus:string='forbidden';
    private successStatus:string='success';

     //测试数据
     private matchesId:number=0;
     getMatchResult(): any{
        let result = {
            pkResults: null,
            reward: {
                level: 0,
                gold: 0
            }
        };
        result.pkResults = SceneNavigator.getSceneInput();
        cc.log(result);
        return result ;
    }

    onLoad() {
        this.showHeadBar(375);
        this.init();
        this.handleEndDate();
       // NetChecker.checkNetWork();
    }
    private showHeadBar(x:number){
        let headBar=cc.director.getScene().getChildByName('head');
        headBar.x=x;

        //更改头像、砖石等按钮可点击
        headBar.setPositionX(375);
        (headBar.getComponent('HeadBar')).isCanClickBtns(true);
    }
    async init(){
        await this.getSelfId();
        self=this;
        //为需要执行Scale动画的组件设置初始Scale值
        this.spriteOpponentRanking1.node.scale=endSceneConf.OPPONENTRANKING_ANIMATION_CONF.STARTSCALE_VALUE;
        this.spriteOpponentRanking2.node.scale=endSceneConf.OPPONENTRANKING_ANIMATION_CONF.STARTSCALE_VALUE;
        this.spriteOpponentRanking3.node.scale=endSceneConf.OPPONENTRANKING_ANIMATION_CONF.STARTSCALE_VALUE;
        this.spriteOpponentRanking4.node.scale=endSceneConf.OPPONENTRANKING_ANIMATION_CONF.STARTSCALE_VALUE;
        this.btnGroup.scale=endSceneConf.BTNGROUP_ANIMATION_CONF.STARTSCALE_VALUE;
        this.spriteSelfRanking.node.scale=endSceneConf.PLAYERSELFRANKING_ANIMATION_CONF.STARTSCALE_VALUE;

        //找到结束页面节点，并为它设置过度时间
        this.endPage=this.node.getChildByName('nodeEnd');
        let delaytime=MathUtil.getRandomValueFromArrage(endSceneConf.TRANSITION_TIME.MAX_TIME,endSceneConf.TRANSITION_TIME.MIN_TIME);
        CommonTimer.setTimeout(delaytime,'cc.switchPage()',this._showEndPage);

        //显示比赛结果
        this.showMatchResult(this._handleResultData());

        //再来一次按钮的动画效果
        this.btnPlayAgain.node.runAction(cc.repeatForever(cc.sequence(
            cc.scaleTo(endSceneConf.BTANIMATION_CONF.SCALE_TIME,
                       endSceneConf.BTANIMATION_CONF.START_SCALE_VALUE,
                       endSceneConf.BTANIMATION_CONF.START_SCALE_VALUE)
                       .easing(endSceneConf.ANIMATIONCHANGECONF_OUT),
            cc.scaleTo(endSceneConf.BTANIMATION_CONF.SCALE_TIME,
                       endSceneConf.BTANIMATION_CONF.END_SCALE_VALUE,
                       endSceneConf.BTANIMATION_CONF.END_SCALE_VALUE)
                       .easing(endSceneConf.ANIMATIONCHANGECONF_OUT)
        )));
        this.initMessageBox();
       

    }

    private initMessageBox(){
        this.accessMessageBox=new MessageBox(
            {
                bg:'bg/paytipbg', //背景图片
                title: '提示' ,// 消息框标题,
                message: '购买成功' ,// 消息提示文本内容
                buttons:[{
                    type:ButtonType.MB_OK_AND_CLOSE,
                    name:'确定',
                    isShowName:false,
                    animType:'scale',
                    normal:'texture/buttons/btnpaysure',
                    pressed:'texture/buttons/btnpress', 
                    hover:'',
                    disabled:'texture/buttons/btnpress',
                    handle:function (){}
                },
            ],  //消息框类型
                isShowCancelBtn:false,//显示在屏幕的位置
                isResidentNode:false,
                icon:'' 
            }
        ,this.node);
        this.accessMessageBox.init();
    }

    private async getSelfId(){
        let userInfo = Global.getItem('userInfo');
        this.id = userInfo.id;
    }



    update(){

        

        //开始执行动画
        if(this.isStartRunAction){
            CommonTimer.setTimeout(500,'cc.animationDelay()',this.startRunAction);
            this.isStartRunAction=false;
        }

        //实时显示对手分数
        if(this.isStartAddOpponentScore){
            for(let i=0;i<this.opponentScoreList.length;i++){
                if(this.currentScoreList[i]<this.opponentScoreList[i]){
                    this.currentScoreList[i]+=this.scoreAddSpeedList[i];
                }else{
                    this.currentScoreList[i]=this.opponentScoreList[i];
                }
            }
            if( this.currentScoreList.toString()==this.opponentScoreList.toString()){
                this.isStartAddOpponentScore=false;
            }
        }

       
        //实时显示自己的得分
        if(this.isStartAddSelfScore){
            if(this.currentScore<this.playerSelfResult.score){
                this.currentScore+=this.selfScoreAddSpeed;
            }else{
                this.currentScore=this.playerSelfResult.score;
                this.isStartRunAction=true;
                this.isStartAddSelfScore=false;
            }

        }

         //实时显示对手及自己的得分
        this.textSelfScore.string=`分数: ${this.currentScore.toString()}`;
        for(let i=0;i<this.scoreList.length;i++){
            this.scoreList[i].getComponent(cc.Label).string= `${this.currentScoreList[i].toString()}`;
        }
    }

    private showRewardInfo(rewardInfo){
        this.textExperience.string=`经验+${rewardInfo.experience}`;
        this.textPoint.string=`奖励 ${rewardInfo.point}`;
        let breakRecord:number=null;
        if(!!rewardInfo.breakRecord){
            breakRecord=rewardInfo.breakRecord.point;
        }else{
            breakRecord=0;
        }
        this.textBreakRecord.string=`打破纪录+${breakRecord}`;
    }
    /**
     * 返回按钮点击事件绑定方法
     */
    gotoMainScene():void{
        SceneNavigator.push({sceneName:'gameMain'});
    }

    /**
     * 再来一次按钮点击事件绑定方法
     */
    async playAgain (){
        this.handleResultData(await this.canAccess( zoneIdConf.CURRENT_FIELD,Global.getItem("userInfo").userId));
        //
    }

      /**
     * 检验对手体力情况
     */
    public canAccess(zoneId:number, uid:number) {

        return new Promise<string>((res, rej)=>{
            let zoneClient: ZoneClient = <ZoneClient> ClientFactory.getHttpClient( ZoneClient, 'zone'); 
                zoneClient.canAccess(zoneIdConf.CURRENT_FIELD,uid ,function(result){
                    res(result);
                });
        });
    }

    private handleResultData(accessResult){
        
         let result=null;
 
         //网络请求失败，需修改
         if(accessResult.toString().indexOf('Error')==-1){
             result=JSON.parse(accessResult);
             if(result.status==this.failStatus){
                 this.accessMessageBox.setMessage(result.reason);
                 this.accessMessageBox.showMessageBox(true);
             }else if(result.status==this.successStatus){
                 zoneIdConf.SIMULATION_DEDUCTION_STREN=result.data.strength;
                 SceneNavigator.push({sceneName:'match',sceneInput:{matchesId: self.matchesId}});
             }
         }else{
             this.accessMessageBox.setMessage('网络连接发生错误!!!');
             this.accessMessageBox.showMessageBox(true); 
         }
        
         
         
     }

     /**
    * 获取一个范围的随机数
    * @param maxValue  范围最大值
    * @param minValue  范围最小值
    */


    /**
     * 界面元素执行动画
     */
    private startRunAction(){
        //显示奖励信息
        self.rewardInfo.active=true;

        //自己的名次图标执行Scale动画
        self._runScaleAnimation(self.spriteSelfRanking.node
            ,endSceneConf.PLAYERSELFRANKING_ANIMATION_CONF.SCALE_TIME
            ,endSceneConf.PLAYERSELFRANKING_ANIMATION_CONF.ENDSCALE_VALUE
            ,endSceneConf.ANIMATIONCHANGECONF_IN);

        //按钮组图标执行Scale动画
        self._runScaleAnimation(self.btnGroup
            ,endSceneConf.BTNGROUP_ANIMATION_CONF.SCALE_TIME
            ,endSceneConf.BTNGROUP_ANIMATION_CONF.ENDSCALE_VALUE
            ,endSceneConf.ANIMATIONCHANGECONF_IN);

        //结果文本执行平移动画
        self.textResultTip.node.runAction(
            cc.sequence(
                cc.moveTo(endSceneConf.RESULTTIPLABELANIMATION_CONF.GO_TIME,
                          endSceneConf.RESULTTIPLABELANIMATION_CONF.POINT_GO.X,
                          endSceneConf.RESULTTIPLABELANIMATION_CONF.POINT_GO.Y)
                          .easing(endSceneConf.ANIMATIONCHANGECONF_IN),
                cc.moveTo(endSceneConf.RESULTTIPLABELANIMATION_CONF.BACK_TIME,
                         endSceneConf.RESULTTIPLABELANIMATION_CONF.POINT_BACK.X,
                         endSceneConf.RESULTTIPLABELANIMATION_CONF.POINT_BACK.Y)
                         .easing(endSceneConf.ANIMATIONCHANGECONF_IN)
            )
        );

        //对手的名次图标执行Scale动画
        self._runScaleAnimation(self.spriteOpponentRanking1.node
            ,endSceneConf.OPPONENTRANKING_ANIMATION_CONF.SCALE_TIME
            ,endSceneConf.OPPONENTRANKING_ANIMATION_CONF.ENDSCALE_VALUE
            ,endSceneConf.ANIMATIONCHANGECONF_IN);
        self._runScaleAnimation(self.spriteOpponentRanking2.node
            ,endSceneConf.OPPONENTRANKING_ANIMATION_CONF.SCALE_TIME
            ,endSceneConf.OPPONENTRANKING_ANIMATION_CONF.ENDSCALE_VALUE
            ,endSceneConf.ANIMATIONCHANGECONF_IN);
        self._runScaleAnimation(self.spriteOpponentRanking3.node
            ,endSceneConf.OPPONENTRANKING_ANIMATION_CONF.SCALE_TIME
            ,endSceneConf.OPPONENTRANKING_ANIMATION_CONF.ENDSCALE_VALUE
            ,endSceneConf.ANIMATIONCHANGECONF_IN);
        self._runScaleAnimation(self.spriteOpponentRanking4.node
            ,endSceneConf.OPPONENTRANKING_ANIMATION_CONF.SCALE_TIME
            ,endSceneConf.OPPONENTRANKING_ANIMATION_CONF.ENDSCALE_VALUE
            ,endSceneConf.ANIMATIONCHANGECONF_IN);

    }

    /**
     * 执行Scale动画方法
     * @param target 执行动画的目标节点
     * @param time 动画持续时间
     * @param targetValue 动画的伸缩到的目标值
     * @param animConf 动画的渐变效果
     */
    private _runScaleAnimation(target : cc.Node,time:number,targetValue:number,animConf):void{
        target.active=true;
        target.runAction(cc.scaleTo(time,targetValue,targetValue).easing(animConf));
    }

   

    /**
     * 显示本局比赛结果
     * @param resultList 比赛结果参数
     */
     async showMatchResult(resultList:PlayResult[]){
        this._showSelfResult();
        let parentNode=this.endPage.getChildByName('nodeOpponentGroup');
        for(let i=0;i<resultList.length;i++){
            let namenow='spriteOpponent'+(i+1);
            let spriteNodenow=parentNode.getChildByName(namenow);
            let childrennow=spriteNodenow.children;
            this.scoreList[i]=childrennow[2];
            let name='spriteOpponent'+(i+1);
            let spriteNode=parentNode.getChildByName(name);
            let children=spriteNode.children;
            let nick=resultList[i].nickname;
            if(nick.length>5){
                nick=nick.substring(0,5)+'...';
            }
            children[1].getComponent(cc.Label).string=nick;
            let url='texture/icons/endScene/endOrders/order'+resultList[i].ranking;
            children[3].getComponent(cc.Sprite).spriteFrame=await BitmapUtil.getLocalBitmap(url);
            cc.loader.load({url:resultList[i].avatar,type: 'jpg' },async function (err, texture) {
                let spriteFrameNow=null;
                if(err){
                    spriteFrameNow=await BitmapUtil.getLocalBitmap('test/match/my');
                }else{
                    spriteFrameNow=new cc.SpriteFrame(texture);
                }
                if(!!children[0]&&!!spriteFrameNow){
                    children[0].getComponent(cc.Sprite).spriteFrame=spriteFrameNow;
                }
            });
        }
    }

    /**
     * 显示玩家自己本局比赛的结果
     */
    private _showSelfResult():void {
        let self=this;

        let rankingUrl='texture/icons/endScene/endRankings/ranking'+this.playerSelfResult.ranking;
        if(this.playerSelfResult.ranking>2){
            this.index=0;
            this.textResultTip.string=endSceneConf.FAILTIP_TEXT;
        }else{
            this.textResultTip.string=endSceneConf.WINTIP_TEXT;
            if(this.playerSelfResult.ranking==1){
                this.index=1;
            }else{
                this.index=3;
            }

        }

        cc.loader.loadRes(rankingUrl,cc.SpriteFrame ,function (err, SpriteFrame) {
            if(err){
               // cc.log(err);
            }else{
               self.spriteSelfRanking.getComponent(cc.Sprite).spriteFrame=SpriteFrame;
            }
        });
    }

    /**
     * 从计算分数界面过度到结束界面
     * @param time 传入等待时间参数
     */
    private _showEndPage(){
        let computePage=self.node.getChildByName('nodeCompute');
        self.endPage.active=true;
        computePage.active=false;
        self.isStartAddSelfScore=true;
        self.isStartAddOpponentScore=true;
        let animation = self.spriteAnim.getComponent(cc.Animation);
        let clips=animation.getClips();
        animation.play(clips[self.index].name);
    }


    /**
    * 处理结果数据
    */
    private _handleResultData():PlayResult[]{

        //接收结果对象的数据
        let resultData = this.getMatchResult();
        this.matchesId=resultData.matchesId;
        let resultList:PlayResult[]=resultData.pkResults;
        
        //小组内的玩家得分排序
        // this._sort(resultList);

        return this._getSelfData(resultList);
    }


    private _getSelfData(targetArray:PlayResult[]):PlayResult[]{

       //将对手自己的数据拿出来
       let opponentList:PlayResult[]=[];
       for(let i=0;i<targetArray.length;i++){
           targetArray[i].ranking=(i+1);
           if(this.id==targetArray[i].id){
               this.playerSelfResult = targetArray[i];
               this.selfScoreAddSpeed=Math.ceil(targetArray[i].score/100);
           }else{
               opponentList.push(targetArray[i]);
               this.opponentScoreList.push(targetArray[i].score);
               this.scoreAddSpeedList.push(Math.ceil(targetArray[i].score/100));
           }
        }
       return opponentList;
    }

    private  _getEndData(uid:number,pkGroupId:number,pkResult:string){
        return new Promise<string>((res, rej)=>{
             let playerClient: PlayerClient = <PlayerClient> ClientFactory.getHttpClient(PlayerClient, 'player');
             
             playerClient.playEnd(uid,pkGroupId,pkResult,function (resultStr) {
                //cc.log(resultStr);
                res(resultStr);
             });
        });
    }

    /**
     * 封装玩耍结果数据
     */
    private generatePostResultData(data):string{
        let result={
            pkResults:[],
            reward:{}
        };
        result.reward=data.reward;
        for(let i=0;i<data.pkResults.length;i++){
            let resultObj={
                uid: 0  ,//玩家id number类型
                score: 0  ,//得分 number 类型
                ranking: 0  //名次 number 类型
            };
            resultObj.uid=data.pkResults[i].id;
            resultObj.score=data.pkResults[i].score;
            resultObj.ranking=data.pkResults[i].ranking;
            result.pkResults[i]=resultObj;
        }
        return JSON.stringify(result);
    }


    private updatePoint(rewardInfo){
        cc.log('num'+rewardInfo.point.toString());
        let nowProp=Global.getItem('playerPropObj');
        cc.log('point'+nowProp.point);
        nowProp.point=parseInt(rewardInfo.point.toString())+parseInt(nowProp.point);
        Global.setItem('playerPropObj',nowProp);
        let headBar=cc.director.getScene().getChildByName('head').getComponent('HeadBar');
        headBar.showPlayerProp();
    }
    /**
     * 处理游戏结束返回数据
     */
    private async handleEndDate(){
        let pkResult=this.generatePostResultData(this.getMatchResult());
           
        let endStr=await this._getEndData(Global.getItem('userInfo').userId, Global.getItem('pkGroupId'),pkResult);
        cc.log("lllll:"+endStr);
        this.getComponent('LevelRise').renderingReward(endStr.toString());
        let endJson=null;
        if(endStr.toString().indexOf('Error')==-1){
            endJson=JSON.parse(endStr);
        }
        cc.log(endStr);
        if(!!endJson&&endJson.status.toString()=='success'){
            this.showRewardInfo(endJson.data);
            this.updatePoint(endJson.data);
            let rankingInfo='null';
            if(!!endJson.data.curDailyRanking){
                rankingInfo=`我的今日排名: ${endJson.data.curDailyRanking}`;
            }else{
                rankingInfo='您暂无今日排名';
            }
            this.textTodayRanking.string=rankingInfo
            if(!!endJson.data.highestScore){
                if(endJson.data.highestScore<this.playerSelfResult.score){
                    this.textHighest.string=`当前最高纪录: ${this.playerSelfResult.score} 破纪录啦`;
                    this.index=2;
                }else{
                    this.textHighest.string=`当前最高纪录: ${endJson.data.highestScore} 未打破`;
                }
            }
        }
    }
}
