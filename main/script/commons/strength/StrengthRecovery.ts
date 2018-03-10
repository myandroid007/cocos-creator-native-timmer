const {ccclass, property} = cc._decorator;
import RewardClient from '../../client/Reward';
import Global from '../storage/Global';
import ClientFactory, {ClientType} from '../net/ClientFactory';
import {PlayerProp} from '../../typings/entities';
import {StrengthRecoveTimeConf} from './StrengthRecoveTimeConf';

@ccclass
export default class StrengthRecovery extends cc.Component {

    
    // private timeArray:string[]=['08:00:00','12:00:00','18:00:00'];
    // private delayTimeArray:string[]=['08:00:15',' 12:00:15',' 18:00:15'];
    private triggerSignArray:boolean[]=[];

    onLoad() {
        this.init();
        this.onShow();
        if(!this.isStrengthRecoveryTime()){
            this.updateStrength('3');
        }
    }

    init(){
        for(let i=0;i<StrengthRecoveTimeConf.RECOVER_TIME_ARRAY.TIME_ARRAY.length;i++){
            this.triggerSignArray.push(false);
        }
    }
    update(){
        this.strengthRecovery();
    }

    /**
     * 判断是否到达体力恢复时刻
     */
    isStrengthRecoveryTime():boolean{
        let date=new Date();
        let recoveryTimeTag:boolean=false;
        let min:string='';
        if(date.getMinutes().toString().length==1){
            min=`0${date.getMinutes().toString()}`
        }else{
            min =date.getMinutes().toString();
        }
        let nowTime=date.getHours().toString()+':'+min+':'+date.getSeconds().toString();
        for(let i=0;i<StrengthRecoveTimeConf.RECOVER_TIME_ARRAY.TIME_ARRAY.length;i++){
            if(this.time_range(StrengthRecoveTimeConf.RECOVER_TIME_ARRAY.TIME_ARRAY[i],StrengthRecoveTimeConf.RECOVER_TIME_ARRAY.DELAY_TIME_ARRAY[i],nowTime)){
                
                recoveryTimeTag=true;
            }
        }
        
       return recoveryTimeTag;
    }
    private strengthRecovery(){
        let date=new Date();
        for(let i=0;i<StrengthRecoveTimeConf.RECOVER_TIME_ARRAY.TIME_ARRAY.length;i++){
            if(date.toString().indexOf(StrengthRecoveTimeConf.RECOVER_TIME_ARRAY.TIME_ARRAY[i])!=-1){
                if(!this.triggerSignArray[i]){
                    this.updateStrength('3');
                    this.triggerSignArray[i]=true;
                }
            }else{
                
                this.triggerSignArray[i]=false;
            }
        }
    }
    private time_range(beginTime, endTime, nowTime){
        let strb = beginTime.split (":");
        if (strb.length != 3) {
            return false;
        }
           
        let stre = endTime.split (":");
        if (stre.length != 3) {
            return false;
        }
           
        let strn = nowTime.split (":");
        if (stre.length != 3) {
            return false;
        }
        let b = new Date ();
        let e = new Date ();
        let n = new Date ();
           
        b.setHours (strb[0]);
        b.setMinutes (strb[1]);
        b.setSeconds (strb[2]);
        e.setHours (stre[0]);
        e.setMinutes (stre[1]);
        e.setSeconds (stre[2]);
        n.setHours (strn[0]);
        n.setMinutes (strn[1]);
        n.setSeconds (strn[2]);
        if (n.getTime () - b.getTime () > 0 && n.getTime () - e.getTime () < 0) {
            return true;
        } else {
            return false;
        }
    }
    sendCustomEvent(event:string):void{

        this.node.dispatchEvent(new cc.Event.EventCustom(event, true));
    }

    private onShow(){
        let self=this;
        cc.game.on(cc.game.EVENT_SHOW, () => {
            if(!self.isStrengthRecoveryTime()){
                self.updateStrength('3');
            }
        });
    }
    

    private  updateStrength(id:string){
        let self=this;
        return new Promise<string>((res, rej)=>{
            let rewardClient: RewardClient = <RewardClient> ClientFactory.getHttpClient(RewardClient, 'reward');
            rewardClient.recoveryStrength(parseInt(id),function (result){
                if(!!result&&result.toString().indexOf('Error')==-1){
                    let playerPropObj=Global.getItem('playerPropObj');
                    playerPropObj.strength=parseInt(result);
                    Global.setItem('playerPropObj',playerPropObj);
                   
                    //发送体力恢复事件
                    self.sendCustomEvent('showPlayerProp');
                }  
            });
           
        })
    }
}
