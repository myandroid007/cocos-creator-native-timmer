
import {EPlayer} from '../../typings/entities';
import OpponentMatchUINode from '../../commons/UI/match/OpponentMatchAreaUI';
import CommonTimer from '../../commons/timer/CommonTimer';
import ClientFactory, {ClientType} from '../../commons/net/ClientFactory';
import PlayerClient from '../../client/Player';
import OpponentMatchSence from '../../match/OpponentMatchScene';
import Global from '../storage/Global';
import {zoneIdConf} from '../../conf/zoneIdConf';


var self=null;
(<any>cc).dispatchOpponentCallback =function (){
   self._countTime();
}
/**
 * 用于控制对手数据的分发，接收小组号，方案号等信息。
 * @author 龙涛
 * 2017/12/15  修改
 */
export default class OpponentDispatcher  {
    //分发器模式，只有真模式与假模式两种
    private mode:boolean=true;
    //对手数量
    private opponentNum:number=4;
    //匹配等待总时间
    private maxTime:number=10;
    //匹配真人对手持续时间
    private maxRealTime:number=10;
    //当前定时总时间
    private countDispatchTime:number=0;
    //匹配对手UI组件
    private matchUINode : OpponentMatchUINode= null;
    //对手数据存放数组
    private opponentTotalList:EPlayer[]=[];
    //记录单次生成的假对手个数的数组
    private recordOpponentList : number[]=[];
    //个数数组记录值
    private recordOpponentIndex : number=0;
    //是否随机产生对手标志
    private isRandomProduceOpponent : boolean=true;
    //定时器的id
    private handlerId:string='';
    //玩家id
    private userId:number=3;
   

    constructor(mode:boolean,maxTime:number,maxRealTime:number,matchUINode: OpponentMatchUINode){
         self=this;
         this.mode=mode;
         if(maxTime<=5){
            this.maxTime=5;
         }else{
            this.maxTime=maxTime;
         }
         if(maxRealTime>=maxTime){
            this.maxRealTime=Math.floor(maxTime/2);
         }else{
            this.maxRealTime=maxRealTime;
         }
         this.matchUINode=matchUINode;
         this.opponentNum=this.matchUINode.getSurplusVacancy();
    }

    /**
     * 开始分发数据的方法，此方法内判断模式，时间控制
     */
    public async dispatchStart() {
       let num=this.matchUINode.getSurplusVacancy();
       if(!this.mode){
            this.opponentTotalList= await this._separateOpponentAndShowSelf(num);
            this.countDispatchTime=this.maxTime;
            this.handlerId=CommonTimer.setInterval(1000,'cc.dispatchOpponentCallback();',this._countTime,1000);
       }else{
            this.countDispatchTime=this.maxTime-this.maxRealTime;
            this.handlerId=CommonTimer.setTimeout(this.maxRealTime*1000,'cc.dispatchOpponentCallback();',this._countTime);
            
       }
       this.limmit=Math.floor(Math.random()*1000)%Math.floor(this.countDispatchTime/2)+1;
       this.sum+= this.limmit;
    }

    public  clearData():void{
        this.opponentTotalList=[];
    }
    //计数
    private count:number=0;
    //随机到的时间
    private limmit:number=0;
    //随机到的时间和
    private sum:number=0;
    //上一次随机到的时间和
    private previouslySum:number=0;
    //请求的对手集合
    private list:EPlayer[]=[];

    /**
     * 定时分发方法
     * @param time 分发总时间
     */
    private async _countTime() {
        if(!self.mode){
            let count=self.matchUINode.getSurplusVacancy();
            if(count<=0){
                CommonTimer.clearInterval(self.handlerId);
            }else{
                self.count++;
                if(self.count>=self.limmit){
                    self.sendOpponentData(self.list);
                    if(self.isRandomProduceOpponent){
                        if(self.sum>=self.countDispatchTime){
                            self.limmit=self.countDispatchTime-self.previouslySum;
                            let startnum=0;
                            for(let i=0;i<self.recordOpponentList.length;i++){
                                startnum+=self.recordOpponentList[i];
                            }
                            for(let i=startnum;i<self.opponentTotalList.length;i++){
                                self.list.push(self.opponentTotalList[i]);
                            }
                            self.isRandomProduceOpponent=false;
                        }else{
                            self.limmit=Math.floor(Math.random()*1000)%Math.floor(self.maxTime/2)+1;
                            self.previouslySum=self.sum;
                            self.sum+= self.limmit;
                        }
                        self.count=0;
                    }else{
                        self.sendOpponentData(self.list);
                        CommonTimer.clearInterval(self.handlerId);
                    }
                }
            }   
        }else{
            self.mode=false;
            let num=self.matchUINode.getSurplusVacancy();
            self.opponentTotalList = await self._separateOpponentAndShowSelf(num);
            self.handlerId=CommonTimer.setInterval(1000,'cc.dispatchOpponentCallback()',self._countTime,1000);
        }
    }


    /**
     * 分发虚拟对手，生成管理单次产生的对手数量，单次最大产生两个对手，
     * @param arr 剩余对手的数组，只有isRandomProduceOpponent标识为真才使用此数组
     */
    public sendOpponentData(arr:EPlayer[]):void{
        if(!this.isRandomProduceOpponent){
           this.matchUINode.addOpponent(arr);
        }else{
            let self=this;
            let startNum=0;
            let tempNum=0;
            let sum=0;
                tempNum=Math.floor(Math.random()*1000)%2+1;
            for(let i=0;i<self.recordOpponentList.length;i++){
                sum+=self.recordOpponentList[i];
            }
                startNum=sum;
            let list: EPlayer[]=[];
            let size=0;
            if(sum+tempNum<=self.opponentNum){
                size=sum+tempNum;
            }else{
                size=self.opponentTotalList.length;
            }
            for(let i=startNum;i<size;i++){
                list.push( self.opponentTotalList[i]);
            }    
                self.matchUINode.addOpponent(list);
                self.recordOpponentList[self.recordOpponentIndex]=tempNum;
                self.recordOpponentIndex++;
        }  
    }

    /**
     * 从后台获取小组数据集合
     * @param num 对手数量
     */
    private  _getPKGroup(num:number){
        if(!!Global.getItem('userInfo')){
            this.userId=Global.getItem('userInfo').userId;
        }
        return new Promise<string>((res, rej)=>{
             let playerClient: PlayerClient = <PlayerClient> ClientFactory.getHttpClient( PlayerClient, 'player'); 
             playerClient.matchOpponents(this.userId, zoneIdConf.CURRENT_FIELD, num,function(result){
                 res(result);
             });
        });
    }

    /**
     *显示自己，返回对手集合
     * @param num 对手数量
     */
    private async _separateOpponentAndShowSelf(num:number) {
        let opponentList : EPlayer[]=[];
        let result = await this._getPKGroup(num);
        let resultmap=null;
        if(!!result){
            resultmap =JSON.parse(result);
        }
        cc.log(result);
        Global.setItem('pkGroupId',resultmap.id);
        opponentList=resultmap.opponents;
        let Elist:EPlayer[]=[];
        let j:number=0;
        for(let i=0;i<opponentList.length;i++){
             if(opponentList[i].id != this.userId){
                Elist[j]=opponentList[i];
                j++;
             }
        }
        OpponentMatchSence.pkGroupObj=resultmap;
        return new Promise<EPlayer[]>((res, rej) => {
            res(Elist);
        });
    }
}
