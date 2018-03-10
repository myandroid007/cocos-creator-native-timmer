import MathUtil from "../../commons/util/MathUtil";
import { IMMRankingConfig } from "../../conf/immediateRanking/IMMRankingConfig";
import Robot from "./robot";
import { EPlayer } from "../../typings/entities";
import { scoreConfig } from "../../conf/scoreConfig";
import { mapConfig } from "../../conf/mapConfig";
import Global from "../../commons/storage/Global";

const {ccclass, property} = cc._decorator;

/**
 * 用于即时排行的排行榜绑定使用
 * @author 刘磊
 * @since 2018.1.23
 */
@ccclass
export default class ImmediateRanking extends cc.Component {
    
    //子节点items
    items: cc.Node[] = [];

    robotItems: cc.Node[] = [];
    rankingPositions: cc.Vec2[] = [];   //排名的位置
    selfItem: cc.Node = null; //当前玩家自己的item
    ranking: cc.Node[] = [];

    onLoad() {
        // init logic
        
    }

    /**
     * 初始化玩家显示
     * @param players 
     * @param itemPrefab 
     */
    public initPlayers(players: EPlayer[],itemPrefab: cc.Prefab){
        for(let i=0; i<= players.length-1; i++){
            let rankingItem: cc.Node = cc.instantiate(itemPrefab);
            this.node.addChild(rankingItem);
            let originPos: cc.Vec2 = rankingItem.getPosition();
            rankingItem.setPosition(cc.p(originPos.x, originPos.y - (i * 40)-80));
            let convertNickName: string = players[i].nickname ? players[i].nickname : players[i].username;
            if(convertNickName.length >=3){
                convertNickName = convertNickName.substring(0,4);
            }
            rankingItem.getChildByName('nickName').getComponent(cc.Label).string = convertNickName;

            if(players[i].isVirtual){
                rankingItem.addComponent(Robot);
                rankingItem.getComponent(Robot).tag = players[i].id;
                rankingItem.getComponent(Robot).targrtScore = players[i].gameScore;
                this.robotItems.push(rankingItem);
            }
            rankingItem.tag = players[i].id;
            this.items.push(rankingItem);
            //留存排名的位置
            this.rankingPositions.push(rankingItem.getPosition());
        }
    }

    start(){
        this._scoreChangeEventLinstener();
        this._initRobotThinkTime();
        this._initRobotScore();
        // this._startRobotThinking();
        this._setSelfPlayer();
    }
    

    /**
     * 初始化机器人的思考时间
     * @param 计算出的思考时间数组
     */
    private _initRobotThinkTime(){
        if(this.robotItems.length == 0){
            cc.log('无机器人')
            return ;
        }
        for(let i=0; i<= this.robotItems.length-1; i++){
            let arr = [];
            let totalTime: number = 0;
            while(true){
                let deltaTime: number = MathUtil.getRandomFloatValueFromArrage(IMMRankingConfig.ROBOT_THINK_TIME_MAX, IMMRankingConfig.ROBOT_THINK_TIME_MIN, 1);
                arr.push(deltaTime);
                totalTime += deltaTime;
                if(totalTime >= IMMRankingConfig.GAME_TIME){
                    totalTime -= deltaTime;
                    let restTime =  IMMRankingConfig.GAME_TIME- totalTime;
                    arr.push(restTime)
                    // cc.log('时间片段总和：', totalTime + restTime)
                    break;
                }
            }
            this.robotItems[i].getComponent(Robot).thinkTimeArray = arr;
        }
    }

    
    /**
     * 初始化机器人的增加分数
     * @param 计算出的增加分数
     */
    private _initRobotScore(){
        if(this.robotItems.length == 0){
            cc.info('无机器人')
            return;
        }
        for(let i=0; i<= this.robotItems.length-1; i++){
            let robot = this.robotItems[i].getComponent(Robot);
            
            let scoreArray = this._getScore(robot.thinkTimeArray.length, robot.targrtScore)
            robot.deltaScoreArray = scoreArray;
        }
    }


    /**
     * 获取分数数组
     * @param length 
     * @param targrtScore 
     */
    private _getScore(length: number, targrtScore: number): number[]{
        let result: number[] = [];

        let normalTimes: number = Math.round(length * 0.5);
        let restTimes: number = length - normalTimes;
        let usedScore: number = 0;
        let restScore: number = 0;
        for(let i=0; i<= normalTimes-1; i++){
            let tempScore = scoreConfig.BASE_SCORE * (3 + Math.round(Math.random()) );
            usedScore += tempScore;
            result.push(tempScore);
        }
        restScore =  targrtScore - usedScore;
        
        //计算剩余分数
        let rpResult=[];    //结果集
        let rpRnds = [];    //随机权重集合
        let rpRndSum = 0 ;   //随机权重总和
        for(let i=0; i<restTimes; i++){
            let rnd = Math.random();
            rpRndSum += rnd;
            rpRnds.push(rnd);
        };

        rpRnds.forEach((rnd)=>{
            let tempScore = Math.ceil(restScore * rnd/rpRndSum);

            //分数规则化
            let delta = tempScore%10;
            if(delta >5){
                tempScore += 10-delta;
            }else{
                tempScore += 5-delta;
            }
            rpResult.push(tempScore);
        })
        
        //偏移量矫正
        result = result.concat(rpResult);
        let total = 0;
        result.forEach((item)=>{
            total += item;
        })
        let delta = targrtScore - total;
        let maxValue = MathUtil.getMaxValueFromArray(result);
        for(let i=0; i<=result.length-1; i++){
            if(result[i] == maxValue){
                result[i] = maxValue + delta;
                break;
            }
        }

        //打乱
        let randomsort = (a, b) => {
            return Math.random()> 0.5 ? -1 : 1;
        }
        result = result.sort(randomsort);

        return result;
    }

    /**
     * 使所有机器人开始思考
     */
    public startRobotThinking(){
        for(let i=0; i<= this.robotItems.length-1; i++){
            this.robotItems[i].getComponent(Robot).startThinking();
        }
    }

    /**
     * 设置当前用户
     */
    private _setSelfPlayer(){
        // let userInfo = JSON.parse(cc.sys.localStorage.getItem('userInfo'));
        let userInfo = Global.getItem('userInfo'); 
        // cc.log('信息:', userInfo)
        for(let i=0; i<= this.items.length-1; i++){
            if(this.items[i].tag == userInfo.id){
                this.selfItem = this.items[i];
                this.selfItem.getChildByName('selectBg').active = true;
            }
        }
    }

    /**
     * 分数改变监听器
     */
    private _scoreChangeEventLinstener(){
        this.node.on('score-change',(event)=>{
            // cc.log('接收到的数据：', event.detail);
            for(let i=0; i<= this.items.length-1; i++){
                if(this.items[i].tag == event.detail.tag){
                    this.items[i].getChildByName('score').getComponent(cc.Label).string = event.detail.score + '';
                }
            }
            event.stopPropagation();
            let ranking = this._calculateRanking();
            this.ranking = ranking;
            this._exchangeItemPosition(ranking);
        })
    }

    /**
     * 计算排名
     * @return 排名结果
     */
    private _calculateRanking(): cc.Node[]{
        let result = [];
        //计算排名
        let randomsort = (a, b) => {
            let score1: number = parseInt(a.getChildByName('score').getComponent(cc.Label).string);
            let score2: number = parseInt(b.getChildByName('score').getComponent(cc.Label).string);
            if(score1 > score2){
                return -1;
            }
            return 1;
        }
        result = this.items.sort(randomsort);


        return result;
    }

    /**
     * 根据排行改变item显示位置
     * @param ranking 排行
     */
    private _exchangeItemPosition(ranking: cc.Node[]){
        // cc.log('定位中：',ranking)
        for(let i=0; i<= ranking.length-1; i++){
            ranking[i].setPosition(this.rankingPositions[i]);
            ranking[i].getChildByName('rank').getComponent(cc.Label).string = (i+1) +'';
        }
    }

    /**
     * 设置当前玩家在排行榜内的分数
     * @param score    新分数
     */
    setCurrentPlayerScore(score: number, ){
        this.node.emit('score-change',{
            tag: this.selfItem.tag,
            score: score
        })
    }

    /**
     * 设置指定的背景图片
     * @param bg    指定图片
     */
    public setBg(bg: cc.SpriteFrame){
        let sprite = this.node.getChildByName('bg').getComponent(cc.Sprite);
        sprite.spriteFrame = bg;
    }
}
