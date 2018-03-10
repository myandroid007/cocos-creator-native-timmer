const {ccclass, property} = cc._decorator;

import OpponentMatchUINode from '../../../main/script/commons/UI/match/OpponentMatchAreaUI'
import {EPlayer} from '../../../main/script/typings/entities'
import OpponentDispatcher from '../../../main/script/commons/dispatcher/OpponentDispatcher'


@ccclass
export default class OpponentTestMatch extends cc.Component {
    //对手匹配ui组件
    matchUiNode : OpponentMatchUINode=null;
    //对手数据分发器
    opponentDispatcher : OpponentDispatcher=null;
    onLoad() {
        this._produceOpponent(1);
        //this.matchUiNode=new OpponentMatchUINode({opponentNum:5,isRandom: false},this.node,null);
        this.matchUiNode.init();
        this.matchUiNode.addOpponent(this._produceOpponent(1));
        this.opponentDispatcher=new OpponentDispatcher(false,10,20,this.matchUiNode);
        this.opponentDispatcher.dispatchStart();
    }
      
    /**
     * 测试数据
     */
    testRule:string[]=[];
    icons : string[]=['test/match/my'];
    private _produceOpponent(num:number):EPlayer[]{
        let opponentList : EPlayer[]=[];
        for(let i=0;i<num;i++){
            opponentList.push({
                username:'111',
                nickname:'逆火123',
                id:9521,
                avatar:this.icons[0],
                isVirtual:false
            });
        }
       return opponentList;
    }
    update(dt){
       
    }
}
