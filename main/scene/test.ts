import CommonTimer from "../script/commons/timer/CommonTimer";

const {ccclass, property} = cc._decorator;

@ccclass
export default class NewClass extends cc.Component {


    onLoad() {
        // init logic

        this.changeTime();
        
    }


    changeTime(){
        let timmer1Id : number = null;
        let timmer2Id : number = null;

        let callBack: Function = ()=>{
           let score: number = parseInt( this.node.getChildByName('label1').getComponent(cc.Label).string);
           this.node.getChildByName('label1').getComponent(cc.Label).string = score -1 +'';
           score --;
            if(score <= 0){
                cc.log('清除')
                CommonTimer.clearInterval(timmer1Id);
            }

        }
        let callBack2: Function = ()=>{
            let score: number = parseInt( this.node.getChildByName('label2').getComponent(cc.Label).string);
            this.node.getChildByName('label2').getComponent(cc.Label).string = score -1 +'';
            score --;
            if(score <= 0){
                cc.log('清除')
                CommonTimer.clearTimeOut(timmer2Id);
            }

        }

        let timmer = new CommonTimer();
        timmer1Id = timmer.interval(1000, callBack);

        let timmer2 = new CommonTimer();
        timmer2Id = timmer2.interval(1000, callBack2);

    }
}
