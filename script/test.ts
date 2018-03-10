import CommonTimmer from "./CommonTimmer";

const {ccclass, property} = cc._decorator;

@ccclass
export default class NewClass extends cc.Component {


    onLoad() {
        
    }


    /**
     * 倒计时按钮绑定方法
     */
    public changeTime(): void{
        let timmer1Id : number = null;
        let timmer2Id : number = null;

        let callBack: Function = ()=>{
           let score: number = parseInt( this.node.getChildByName('label1').getComponent(cc.Label).string);
           this.node.getChildByName('label1').getComponent(cc.Label).string = score -1 +'';
           score --;
            if(score <= 0){
                cc.log('清除')
                CommonTimmer.clearInterval(timmer1Id);
            }

        }
        let callBack2: Function = ()=>{
            let score: number = parseInt( this.node.getChildByName('label2').getComponent(cc.Label).string);
            this.node.getChildByName('label2').getComponent(cc.Label).string = score -1 +'';
            score --;
            if(score <= 0){
                cc.log('清除')
                CommonTimmer.clearTimeOut(timmer2Id);
            }

        }

        timmer1Id = CommonTimmer.setTimeout(1000, callBack);

        timmer2Id = CommonTimmer.setInterval(1000, callBack2);

    }
}
