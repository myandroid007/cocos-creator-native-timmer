import Effect from "./baseClass/effect";
import {mapConfig} from '../conf/mapConfig';
import {scoreConfig} from '../conf/scoreConfig';
import MusicManager from "../commons/musicManager/musicManager";
const {ccclass, property} = cc._decorator;

@ccclass
export default class EffectLayer extends cc.Component {


    
    @property(cc.AudioClip)
    private crushMusic: cc.AudioClip = null;

    effects: Effect[] = null;

    /**
     * 批量加入特效对象
     * @param effects 
     */
    public addEffectInstances(effects: Effect[]){
        this.effects = effects;
        for (let i=0; i<= effects.length-1; i++) {
            this.node.addChild(effects[i].effectNode);
        }
    }

    /**
     * 播放特效层所有特效节点的特效
     */
    public  playEffects(){
        if (this.effects.length >1) {
            MusicManager.playRuntimeMusic(this.crushMusic)
        }
        // cc.log('effect中')
        for(let i =0; i<= this.effects.length-1; i++){
            this.effects[i].palyEffect();
        }
        this.effects = null;
    }


    /**
     * 添加单次分数显示
     * @param deltaScore  单次分数值
     * @param pos 格子坐标
     * @param colorType 颜色类型（与元素类型一致）
     */
    public addDeltaScore(deltaScore: number, pos: cc.Vec2, colorType: number){
      
        // 根据颜色类型选取显示颜色
        var color2 = new cc.Color(scoreConfig.COLOR[colorType].R, scoreConfig.COLOR[colorType].G, scoreConfig.COLOR[colorType].B);

        let actionArray = [];
        //生成节点
        let newNode: cc.Node = new cc.Node();
        let label = newNode.addComponent(cc.Label);
        label.string = deltaScore + '';
        newNode.color = color2;
        //设置位置
        let nodePosition: cc.Vec2 = this._changeCellPosToScreenPos(pos);
        newNode.setPosition(nodePosition);

        //添加动作和执行回调
        let action = cc.moveTo(0.3, cc.p(nodePosition.x, nodePosition.y + 15 ));
        let delayAction: cc.Action = cc.delayTime(mapConfig.ANIMATE_TIMES.TO_DIE);
        let showCallBack = cc.callFunc(()=>{
            this.node.addChild(newNode);
        },this);

        let dieBack = cc.callFunc(()=>{
            newNode.destroy();
        },this);

        actionArray.push(delayAction);
        actionArray.push(showCallBack);
        actionArray.push(action);
        actionArray.push(dieBack);
        
        //显示
        newNode.runAction(cc.sequence(actionArray));

    }

    /**
     * 将格子坐标转换为屏幕坐标
     * @param pos 格子坐标
     * @return 屏幕坐标
     */
    private _changeCellPosToScreenPos(pos: cc.Vec2): cc.Vec2{
        
        let SCREEN_WIDTH: number = cc.director.getWinSize().width;
        let unitWidth: number = SCREEN_WIDTH / mapConfig.Y_NUMBER;

        let result: cc.Vec2 = new cc.Vec2();
        result.x = (pos.y +1) * unitWidth - SCREEN_WIDTH/2 - mapConfig.HEIGHT_SKEW;
        result.y =  -(pos.x) * unitWidth + SCREEN_WIDTH/2 - mapConfig.HEIGHT_SKEW;
        return  result;
    }
}
