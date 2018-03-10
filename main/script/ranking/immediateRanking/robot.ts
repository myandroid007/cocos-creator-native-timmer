import NetChecker from "../../commons/net/NetChecker";
import { NetwokType } from "../../typings/entities";

const {ccclass, property} = cc._decorator;


/**
 * 用于即时对战排行榜的机器人绑定脚本
 * @author 刘磊
 * @since 2018.1.23
 */
@ccclass
export default class Robot extends cc.Component {

    tag: number = null;     //自身节点的tag标签
    score: number = 0;      //节点当前分数
    targrtScore: number = 0;        //目标分数
    thinkTimeArray: number[] = [];      //思考时间数组
    deltaScoreArray: number[] = [];     //分数片段数组

    isCanEimitScore: boolean = true;    //是否能向外发送分数事件

    onLoad() {
        // init logic
        NetChecker.addEventListener('change','_stopScoreEmit',this._stopScoreEmit);
    }
    onDestroy(){
         //场景被销毁时，移除监听
        NetChecker.removeEventLisener('change','_stopScoreEmit');
    }

    /**
     * 网络监听回调
     */
    private _stopScoreEmit(){
        let netType=NetChecker.getNetConnectionType();
        if(netType == NetwokType.NO_NETWORK){
            this.isCanEimitScore = false;
        }else{
            this.isCanEimitScore = true;
        }
    }

    /**
     * 机器人模拟真人开始思考
     */
    public startThinking(){
        this._thinking(this.thinkTimeArray[0]);
    }

    /**
     * 模拟真人思考
     */
    private _thinking(thinkTime: number){
        // cc.log('思考ing')
        this.scheduleOnce(()=>{
            this._play();
        },thinkTime)
    }

    /**
     * 模拟真人玩耍
     */
    private _play(){
        this.thinkTimeArray.shift();
        this.score += this.deltaScoreArray.shift();
        this._sendScoreChangeEvent();
        if(this.deltaScoreArray.length >=1){
            this._thinking(this.thinkTimeArray[0]);
        }

    }

    /**
     * 发送分数改变事件，用于计算排行和更新显示
     */
    private _sendScoreChangeEvent(){
        if(!this.isCanEimitScore){
            //不发送事件，如断网了
            return ;
        }
        // cc.log('发送事件');
        let event = new cc.Event.EventCustom('score-change',true);
        event.detail = {
            tag: this.tag,
            score: this.score
        };
        this.node.dispatchEvent(event );
    }


}
