import { fruit } from "../conf/elemTemplates/fruit";
import SceneNavigator from "../commons/scene/SceneNavigator";
import CommonTimer from "../commons/timer/CommonTimer";
import ImmediateRanking from "../ranking/immediateRanking/immediateRanking";
import Robot from "../ranking/immediateRanking/robot";
import { IMMRankingConfig } from "../conf/immediateRanking/IMMRankingConfig";
import GameArea from "../gameArea/GameArea";
import GameAttention from "./gameAttention";
import PlayerClient from '../client/Player';
import ClientFactory, {ClientType} from '../commons/net/ClientFactory';
import Global from '../commons/storage/Global';
import {EPlayer} from '../typings/entities';
import MathUtil from "../commons/util/MathUtil";

const {ccclass, property} = cc._decorator;



let self = this;

(<any>cc)._updateTimeCallBack=function (){
    self._updateTimeCallBack();
 }

@ccclass
export default class game extends cc.Component {

    @property(cc.Prefab)
    rankingItem: cc.Prefab = null;

    @property(cc.Prefab)
    immediateRanking: cc.Prefab = null;


    mapInfo: number[][] = [
        [
            1,1,1,1,1,1,1,1,1,
            1,1,1,1,1,1,1,1,1,
            1,1,1,1,1,1,1,1,1,
            1,1,1,1,1,1,1,1,1,
            1,1,1,1,1,1,1,1,1,
            1,1,1,1,1,1,1,1,1,
            1,1,1,1,1,1,1,1,1,
            1,1,1,1,1,1,1,1,1,
            1,1,1,1,1,1,1,1,1
        ],
        [
            0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0
        ],
        // [
        //     -1,-1,-1,-1,-1,-1,-1,-1,-1,
        //     50,50,50,50,50,50,50,50,50,
        //     -1,-1,-1,-1,-1,-1,-1,-1,-1,
        //     -1,-1,-1,-1,-1,-1,-1,-1,-1,
        //     50,-1,-1,-1,-1,-1,-1,-1,-1,
        //     50,-1,-1,-1,-1,-1,-1,-1,-1,
        //     50,50,50,50,50,50,50,50,50,
        //     50,50,50,50,50,50,50,50,50,
        //     50,50,50,50,50,50,50,50,50
        // ],

    ];

    players: EPlayer[] = [
        {
            username: 'xxx',
            nickname: '刘磊' ,
            id: 9600,
            avatar: 'test/match/opponent1',
            isVirtual: false,
            gameScore: 19400
        },
        {
            username: 'yyy',
            nickname: '杨江' ,
            id: 1231,
            avatar: 'test/match/my',
             isVirtual: true,
            gameScore: 8000
        },

        {
            username: 'zzz',
            nickname: '龙涛' ,
            id: 1232,
            avatar: 'test/match/opponent2',
             isVirtual: true,
            gameScore: 4300
        },
        {
            username: 'aaa',
            nickname: '高至荣' ,
            id: 1232444,
            avatar: 'test/match/opponent3',
            isVirtual: true,
            gameScore: 7700
        },
        {
            username: 'bbb',
            nickname: '黄灵东' ,
            id: 12456,
            avatar: 'test/match/opponent4',
             isVirtual: true,
            gameScore: 6500
        }

        ];


    private timerId = null
    private label = null;
    private currentTime = IMMRankingConfig.GAME_TIME;

    onLoad() {
        this._GlobalUserHandler();
	    this.hideHeadBar(-375);
        cc.sys.localStorage.setItem('userInfo',JSON.stringify({
            username: 'xxx',
            nickname: '刘磊' ,
            id: 3,
            avatar: 'test/match/opponent1',
            isVirtual: false,
            gameScore: 19400
        }));
        self = this;
        let inputInfo: any = SceneNavigator.getSceneInput();
        if(inputInfo){
            cc.log('地图信息：', inputInfo)
            cc.log(`地图信息${inputInfo}`)
            this.players = inputInfo.pkGroupObj.opponents;
            this.mapInfo = inputInfo.pkGroupObj.mapScene.mapInfo;
        }
        

        let gameArea = this.node.getChildByName('gameArea');
        let gameAreaScript = gameArea.getComponent('gameArea');
        gameAreaScript.init(this.mapInfo,null);

        this.label =  this.node.getChildByName('timer').getChildByName('remainingTime');

        // 设置游戏区域不可点击
        this._setGameAreaTouchable(false);

        //显示开始提示
        let gameAttention: GameAttention = this.node.getChildByName('attention').getComponent(GameAttention);
        gameAttention.startGameCallBack = this.startCountDown.bind(this);

        // 初始化排行榜
        this._initRanking(this.players);

        
        this._sendGameStartMessage(Global.getItem('userInfo').userId,Global.getItem('pkGroupId'));

    }


    start(){
        this.scheduleOnce(()=>{
            //显示开始提示
            let gameAttention: GameAttention = this.node.getChildByName('attention').getComponent(GameAttention);
            gameAttention.startGameCallBack = this.startCountDown.bind(this);
            gameAttention.showStartAttention();
        }, 0.8);
    }
	
    /**
     * 隐藏头部栏
     * @param players
     */
	private hideHeadBar(x:number){
        let headBar=cc.director.getScene().getChildByName('head');
        if(headBar){
            headBar.x=x;
            return;
        }
        cc.info('头部栏为null')
    }
	
	
    /**
     * 初始化排行榜
     * @param players
     */
    private _initRanking(players: EPlayer[]){
        let ranking: cc.Node = cc.instantiate(this.immediateRanking);
        this.node.addChild(ranking);

        let widgt = ranking.addComponent(cc.Widget);
        widgt.isAlignTop = true;
        widgt.isAlignLeft = true;
        widgt.left = 5;
        widgt.top = 5;

        ranking.getComponent(ImmediateRanking).initPlayers(players, this.rankingItem);
    }

    /**
     * 页面跳转倒计时回调方法
     */
    private _updateTimeCallBack(){
        if(self.currentTime-1 <= 0){
            //清除定时器
            CommonTimer.clearInterval(self.timerId);
            self._setGameAreaTouchable(false);

            //显示结束提示：
            self.node.getChildByName('attention').getComponent(GameAttention).showGameEndAttention();
            //页面跳转
            if(self.node.getChildByName('gameArea').getComponent('gameArea').isPlayingAnimate){
                self.animationEndListener();
            }else{
                self._gameEnd();
            }
        }


        self.label.getComponent(cc.Label).string = self.currentTime-1 + 's';
        self.currentTime -= 1;
        //显示剩余时间提示
        if(self.currentTime == IMMRankingConfig.FIRST_COUNT_TIME || self.currentTime == IMMRankingConfig.SECOND_COUNT_DOWN_TIME){
            self.node.getChildByName('attention').getComponent(GameAttention).showRestTimeAttention(self.currentTime);
        }
    }


    /**
     * 更新倒计时的显示时间
     */
    private _updateRemainingTime(){
        this.timerId = CommonTimer.setInterval(1000, 'cc._updateTimeCallBack()', self._updateTimeCallBack)
    }

    /**
     * 游戏结束处理
     */
    private _gameEnd(){
        let ranking: cc.Node[] = this.node.getChildByName('immediateRanking').getComponent(ImmediateRanking).ranking;
        let screenData = [];
        for(let i=0; i<= ranking.length-1; i++){
            let data = {};
            for( let j=0; j<= this.players.length-1; j++ ){
                if( ranking[i].tag == this.players[j].id ){
                    let convertNickName = this.players[j].nickname ? this.players[j].nickname : this.players[j].username
                    if(ranking[i].getComponent(Robot)){
                        data = {
                            id :  this.players[j].id,
                            ranking: i +1,
                            score: ranking[i].getComponent(Robot).score,
                            nickname: convertNickName,
                            avatar: this.players[j].avatar
                        }

                        continue;
                    }
                    data = {
                        id :  this.players[j].id,
                        ranking: i +1,
                        score: parseInt( ranking[i].getChildByName('score').getComponent(cc.Label).string) ,
                        nickname: convertNickName,
                        avatar: this.players[j].avatar
                    }
                }
            }
            screenData.push(data);
        }

        //页面跳转
        self.scheduleOnce(()=>{
            SceneNavigator.push({sceneName:'gameEnd', sceneInput:screenData} );
        },1.3);
    }

    /**
     * 开始倒计时
     */
    private startCountDown(){
        this._setGameAreaTouchable(true);
        this._updateRemainingTime();
        this.node.getChildByName('immediateRanking').getComponent(ImmediateRanking).startRobotThinking();
    }

    /**
     * 动画完成监听
     */
    public animationEndListener(){
        this.node.on('animation-end',(event)=>{
            //跳转页面
            self._gameEnd();
        })
    }

    /**
     * 设置游戏区域的可点击性
     */
    public _setGameAreaTouchable(isCanTouch: boolean){
        this.node.getChildByName('gameArea').getComponent('gameArea').isForbiddenTouch = isCanTouch;
    }

    private  _sendGameStartMessage(uid:number,pkGroupId:number){
        return new Promise<string>((res, rej)=>{
             let playerClient: PlayerClient = <PlayerClient> ClientFactory.getHttpClient(PlayerClient, 'player');
             playerClient.playStart(uid,pkGroupId,function (resultStr) {
                  cc.log(resultStr);
             });
        })
    }


    	/**
     * 全局的用户处理，进入此场景若无user则添加默认，否则正常运行
     */
    private _GlobalUserHandler(){
        let userInfo = Global.getItem("userInfo");
        if(userInfo){
            return ;
        }
        let userJson = {"id":"9600","userId":"9600","nickname":"qqqqqq","avatar":"https://ss0.bdstatic.com/70cFuHSh_Q1YnxGkpoWK1HF6hhy/it/u=2028940690,1078059060&fm=27&gp=0.jpg"};
        Global.setItem("userInfo",userJson); 
    }
}
