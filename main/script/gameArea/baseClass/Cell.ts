import any from "./BaseElem";
import UnmovableElem from "./UnmovableElem";
import MovableElem from "./MovableElem";
import { mapConfig } from "../../conf/mapConfig";
import BaseElem from "./BaseElem";

const {ccclass, property} = cc._decorator;

@ccclass
export default class Cell extends cc.Component {


    elemStack: cc.Node[] = [];      //存放元素的栈

    types: any = {};     //存放顶层元素属性
    cmd: any[] = [];   //存放当前操作元素的命令
    actionArray = [];   //存放动作的数组

    isTopElemCanMove: boolean = false;
    isTopElemCanDestroy: boolean = false;
    topElemType: number = 0;
    topElemStatus: number = 0;



    magicShakeActionsArray = [];  //用于存储下落后元素抖动动画的数组；

    isSlect: boolean = false;       //是否被选中


    onLoad() {
        // init logic
    }

    /**
     * 在元素栈里指定位置，设置指定元素
     * @param elem 
     * @param layerIndex 
     */
    public  setElem(elem: cc.Node, layerIndex: number) {

    }

    /**
     * 获取顶层元素的可移动属性
     */
    public getTopElemIsCanMove(){
        return this.isTopElemCanMove;
    }

     /**
     * 获取顶层元素的可销毁属性
     */
    public getTopElemCanDestroy(){
        return this.getTopElemCanDestroy;
    }

     /**
     * 获取顶层元素的元素类型
     */
    public getTopElemType(){
        return this.topElemType;
    }

     /**
     * 获取顶层元素的元素状态
     */
    public getTopElemStatus(){
        return this.topElemStatus;
    }

     /**
     * 获取格子是否被选中
     */
    public getSelectStatus(){
        return this.isSlect;
    }

    
    /**
     * 在格子对象中，添加一个新元素
     * @param elem  要新增的元素
     */
    public addElem(elem: cc.Node ): void{
        if(!elem){
            // cc.log('添加元素为null');
            if (this.elemStack[this.elemStack.length -1]) {
                this.elemStack.push(null);

                this.isTopElemCanDestroy = null;
                this.isTopElemCanMove = null;
                this.topElemType = null;
                this.topElemStatus = null;
                return ;
            }else{
                return ;
            }
        }
        if ( this.elemStack.length -1 >=0  && !this.elemStack[this.elemStack.length -1]) {
            this.elemStack[ this.elemStack.length -1] = elem;
        }else {
            this.elemStack.push(elem);
        }
        let movableScript = elem.getComponent(MovableElem);
        let unmovableScript = elem.getComponent(UnmovableElem);
        if(movableScript){
            for (let i in mapConfig.CELL_PARAMS) {
                let typeName = mapConfig.CELL_PARAMS[i]
            }

            this.isTopElemCanDestroy = movableScript.isCanDestroy;
            this.isTopElemCanMove = movableScript.isCanMove;
            this.topElemType = movableScript.type;
            this.topElemStatus = movableScript.status;
        }
        if(unmovableScript){
            for (let i in mapConfig.CELL_PARAMS) {
                let typeName = mapConfig.CELL_PARAMS[i]

                this.isTopElemCanDestroy = unmovableScript.isCanDestroy;
                this.isTopElemCanMove = unmovableScript.isCanMove;
                this.topElemType = unmovableScript.type;
                this.topElemStatus = unmovableScript.status;
            }
        }
    }

    
    /**
     * 获取顶层元素
     * 由于最顶层元素可能为空（被null值占位）。故需从后往前一直找到不为null的值
     * @returns result 属性有2个elem为那个元素。index为元素所在index
     */
    public getTopElemInfo(): [cc.Node, number]{
        return [this.elemStack[this.elemStack.length -1], this.elemStack.length -1];
        
    }
    
    /**
     * 交换自身和另一个Cell 对象的顶层元素
     * @param anotherCell 另一个顶层元素
     */
    public exchangeTopElem(anotherCell: Cell) {
        if (!anotherCell.getTopElemInfo()[0]) {
            anotherCell.addElem(this.getTopElemInfo()[0]);

            this.isTopElemCanDestroy = null;
            this.isTopElemCanMove = null;
            this.topElemType = null;
            this.topElemStatus = null;

            this.elemStack[this.elemStack.length -1] = null;
            cc.log('空格交换')
            return ;
        }
        
        let anotherTopElem: cc.Node = anotherCell.getTopElemInfo()[0];   //获取元素和脚本
        let selfTopElem: cc.Node = this.getTopElemInfo()[0];

        this.elemStack[ this.elemStack.length -1] = anotherTopElem;
        anotherCell.elemStack[ anotherCell.elemStack.length -1] = selfTopElem;

        let selfTopTypes = {
            isTopElemCanMove: this.isTopElemCanMove,
            isTopElemCanDestroy: this.isTopElemCanDestroy,
            topElemType: this.topElemType,
            topElemStatus: this.topElemStatus
        }
        let anotherTopElemTypes = {
            isTopElemCanMove: anotherCell.isTopElemCanMove,
            isTopElemCanDestroy: anotherCell.isTopElemCanDestroy,
            topElemType: anotherCell.topElemType,
            topElemStatus: anotherCell.topElemStatus
        }
        anotherCell._linkTopElemAttribute(selfTopTypes);
        this._linkTopElemAttribute(anotherTopElemTypes);
        
    }


    /**
     * 关联顶部元素的属性，包括 是否可移动， 是否可销毁， 类型， 状态
     * @param anotherCell 
     */
    private _linkTopElemAttribute(obj: any){
        this.topElemStatus = obj.topElemStatus;
        this.topElemType = obj.topElemType;
        this.isTopElemCanDestroy = obj.isTopElemCanDestroy;
        this.isTopElemCanMove = obj.isTopElemCanMove;
    }
    
    /**
     * 销毁此格子对象上显示的元素
     * 有障碍物的消除的话，在内部进行判断
     */
    public toDie() {
        let topElem =  this.elemStack[this.elemStack.length -1];   //销毁格子对象上最顶层的元素
        if (topElem) {
            topElem.destroy();
        }
        this.elemStack[this.elemStack.length -1] = null;   
        this.isTopElemCanDestroy = null;
        this.isTopElemCanMove = null;
        this.topElemType = null;
        this.topElemStatus = null;
    }

    /**
     * 延迟销毁格子对象上的显示元素
     */
    public delayToDie(){
        let topElem =  this.elemStack[this.elemStack.length -1];   //销毁格子对象上最顶层的元素
        if (topElem) {
            let script: MovableElem = topElem.getComponent(MovableElem);
            script.addDelayActionCmd(mapConfig.ANIMATE_TIMES.TO_MOVE);
            script.addDestroyCmd(mapConfig.ANIMATE_TIMES.TO_DIE);
            script.addDelayActionCmd(mapConfig.ANIMATE_TIMES.SHOW_EFFECT_TIME);
        }

        this.isTopElemCanDestroy = null;
        this.isTopElemCanMove = null;
        this.topElemType = null;
        this.topElemStatus = null;
    }
    
    /**
     * 销毁顶层元素
     */
    public destroyTopElem(){
        let topElem =  this.elemStack[this.elemStack.length -1];   //销毁格子对象上最顶层的元素
        topElem.destroy();
    
        this.changeTopElemToNull();
    }


        /**
     * 将顶部元素设置为null，各种type 重置
     */
    public changeTopElemToNull(){
        this.elemStack[this.elemStack.length-1] = null;
        this.isTopElemCanDestroy = null;
        this.isTopElemCanMove = null;
        this.topElemType = null;
        this.topElemStatus = null;
    }

    
    /**
     * 将本格子移动到另一个格子的位置
     * @param 
     */
    public async moveTo(anotherCell: Cell) {
        let selfTopElem: cc.Node = this.elemStack[this.elemStack.length -1];    //获取元素脚本
        let anotherTopElem: cc.Node = anotherCell.elemStack[anotherCell.elemStack.length-1];

        let pos1 = this.elemStack[0].getPosition();     //自己位置
        let pos2 = anotherCell.elemStack[0].getPosition();      //其他位置

        let action1 = cc.moveTo(mapConfig.ANIMATE_TIMES.TO_MOVE, pos1);
        let action2 = cc.moveTo(mapConfig.ANIMATE_TIMES.TO_MOVE,pos2);
        selfTopElem.runAction(action2);
        anotherTopElem.runAction(action1);

        this.exchangeTopElem(anotherCell);
        
        await this._waitTime(mapConfig.ANIMATE_TIMES.TO_MOVE);
    }
    

    /**
     * 等待指定时间
     * @param time 
     */
    private async _waitTime(time: number){
        return new Promise((res,rej)=>{
            let timerId = null;
            let callback = ()=>{
                // cc.log('Cell等待时间：',time);
                res();
                clearTimeout(timerId);
            }
            timerId = setTimeout(callback, time)
        })
    }
    /**
     * 交换位置并还原
     * @param anotherCell 另一个格子
     */
    public moveAndBack(anotherCell: Cell){
        let selfTopElem: cc.Node = this.elemStack[this.elemStack.length -1];    
        let selfSript = selfTopElem.getComponent(MovableElem);
        
        let pos1 = this.elemStack[0].getPosition();   //添加交换命令
        let pos2 = anotherCell.elemStack[0].getPosition();
        selfSript.addMoveAndBackCmd(pos1, pos2, mapConfig.ANIMATE_TIMES.TO_MOVE);
    }
    
    /**
     * 元素下落
     */
    public moveDown(){
        let selfTopElem: cc.Node = this.elemStack[this.elemStack.length -1];    //获取元素脚本
        let selfSript = selfTopElem.getComponent(MovableElem);
        
        let pos2 = this.elemStack[0].getPosition();
        selfSript.addMoveToCmd(pos2, mapConfig.ANIMATE_TIMES.TO_DROP_DOWN);

    }


    /**
     * 顶部元素左右摇摆
     * @param time 摇动的时间 
     */
    public addMagicShakeAction() {
        this.getTopElemInfo()[0].getComponent(MovableElem).addMagicShakeCmd(mapConfig.ANIMATE_TIMES.MAGIC_SHAKE);
    }

    /**
     * 顶部元素沿着指定路径下落移动
     * @param path 
     */
    public async moveByPath(path: cc.Vec2[]) {
        let moveActionArray = [];

        let moveTime: number = 0;
        
        let nodePosition: cc.Vec2 = this.node.getPosition();
        let unitHeight: number = cc.director.getWinSize().width / mapConfig.Y_NUMBER;
        let delta: number = 0;      //路径转折点之间的y间距 之差
        let lastPosition: cc.Vec2 = null;   //上次的位置


        if (path.length == 1) {
            let action = cc.moveTo(nodePosition.y / unitHeight * mapConfig.UNIT_DROP_DOWN_SPEED, path[0]);
            moveActionArray.push(action);
            moveTime += nodePosition.y / unitHeight * mapConfig.UNIT_DROP_DOWN_SPEED;
        }else{
            for(let i =0; i<= path.length-1; i++){
                if ( i>=1) {
                    lastPosition = path[i-1];
                    delta =  lastPosition.y - path[i].y ;

                    let action = cc.moveTo(delta / unitHeight * mapConfig.UNIT_DROP_DOWN_SPEED, path[i]);
                    moveActionArray.push(action);
                    moveTime += delta / unitHeight * mapConfig.UNIT_DROP_DOWN_SPEED;
                    continue;
                }
                
            }
        }

        //制作抖动动画，并添加到命令数组中
        let lastPathPos: cc.Vec2 = path[path.length -1];
        let temp: cc.Vec2 = cc.p(lastPathPos.x, lastPathPos.y - mapConfig.MOVE_DOWN_SHAKE_RANGE[0]);
        let temp1: cc.Vec2 = cc.p(lastPathPos.x, lastPathPos.y + mapConfig.MOVE_DOWN_SHAKE_RANGE[1]);
        let temp2: cc.Vec2 = lastPathPos;


        let action = cc.moveTo(0.05, temp);
        let action1 = cc.moveTo(0.05, temp1);
        let action2 = cc.moveTo(0.05, temp2);
        moveActionArray.push(action);
        moveActionArray.push(action1);
        moveActionArray.push(action2);
        moveTime += 0.15;

        let topElem = this.elemStack[this.elemStack.length-1];
        if(moveActionArray.length >1){
            topElem.runAction(cc.sequence(moveActionArray));
            // cc.log('执行动画，动画长度为：', moveActionArray.length)
        }else{
            // cc.log('执行动画，动画长度为：', moveActionArray.length)
            topElem.runAction(moveActionArray[0]);
        }

        await this._waitTime(moveTime);
    }



    /**
     * 顶部元素沿着指定路径下落移动
     * @param path 
     */
    public addMoveByPathAction(path: cc.Vec2[]) {
        this.getTopElemInfo()[0].getComponent(MovableElem).addMoveDownByPathCmd(path, mapConfig.ANIMATE_TIMES.TO_DROP_DOWN);
    }


      /**
     * 将本格子移动到另一个格子的位置
     * @param 
     */
    public  _moveTo() {
        let selfTopElem: cc.Node = this.elemStack[this.elemStack.length -1];    //获取元素脚本
        let selfSript = selfTopElem.getComponent(MovableElem);
        
        let pos2 = this.elemStack[0].getPosition();
        selfSript.addMoveToCmd(pos2, mapConfig.ANIMATE_TIMES.TO_MOVE);

    }

    /**
     * 获取当前格子的世界坐标
     * @returns 需要的坐标
     */
    public getPosition(): cc.Vec2 {
        return this.elemStack[0].getPosition();
    }


    /**
     * 设置格子的选中状态
     * @param isSlect   格子是否被选中的标识 
     */
    public setSlect(isSlect: boolean){
        //设置点击
        if(isSlect && !this.isSlect &&  this.topElemStatus == mapConfig.ELEM_STATUS.COMMON){
            this.topElemStatus = mapConfig.ELEM_STATUS.CLICK;
            this.getTopElemInfo()[0].getComponent(MovableElem).status = mapConfig.ELEM_STATUS.CLICK;

            let topElem = this.getTopElemInfo()[0];
            let animation = topElem.getComponent(cc.Animation);
            let clips = animation.getClips();
            animation.play(clips[0].name);

        }
        //取消点击
        if(!isSlect  && this.isSlect &&this.topElemStatus == mapConfig.ELEM_STATUS.CLICK){
            this.topElemStatus = mapConfig.ELEM_STATUS.COMMON;
            this.getTopElemInfo()[0].getComponent(MovableElem).status = mapConfig.ELEM_STATUS.COMMON;

            let topElem = this.getTopElemInfo()[0];
            let animation = topElem.getComponent(cc.Animation);
            animation.stop();
            // cc.log('停止click动画了')
            this.elemStack[1].active = false;
        }

        this.elemStack[1].active = isSlect;
        this.isSlect = isSlect;
    }


    /**
     * 播放指定的生成动画
     * @param effectStatus 
     * @param delayTime 
     */
    public playEffectCreatingAnimation(effectStatus: number, delayTime?: number){
        let effectNode = this.getTopElemInfo()[0];
        let animation = effectNode.getComponent(cc.Animation);
        let animationIndex = null;
        switch(effectStatus){
            case 3 :    //行
                animationIndex = 1;
                break;
            case 4:     //列
                animationIndex = 2;
                break;
            case 5:     //爆炸
                animationIndex = 3;
                break;
            case 6:     //魔力鸟
                animationIndex = 4;
                break;
            default :
                animationIndex = 0;
                break;
        }

        let clips = animation.getClips();
        if(delayTime){
            let timer = setTimeout(()=>{
                animation.play(clips[animationIndex].name);
                clearTimeout(timer);
            },delayTime)
        }else{
            animation.play(clips[animationIndex].name);
        }
        if(effectStatus == mapConfig.ELEM_STATUS.MAGIC ){
            this.getTopElemInfo()[0].getComponent(MovableElem).type = -1;
            this.topElemType = -1;
        }
    }

    /**
     * 添加混淆动画
     */
    public addMixUpAction(){
        this.getTopElemInfo()[0].getComponent(MovableElem).addScaleHideCmd();
        this._moveTo();
        this.getTopElemInfo()[0].getComponent(MovableElem).addScaleShowCmd();

    }

    /**
     * 更新格子视图
     * @returns 
     */
    public updateCellView(): number{
        let topElem = this.elemStack[ this.elemStack.length -1];
        if(!topElem){
            return;
        }
        let cmd = topElem.getComponent(MovableElem).animateCmds;
        if(cmd.length == 0){
            return;
        }
        let allAnimateTime: number= 0;  //该格子所有动画时间
        for(let i=0; i<= cmd.length-1; i++){
            if (cmd[i].actionName == 'moveTo') {
                let action = cc.moveTo(cmd[i].playTime, cmd[i].pos);
                allAnimateTime += cmd[i].playTime;
                this.actionArray.push(action);
                continue;
            }
            if (cmd[i].actionName == 'toDie') {
                // this.getTopElemInfo()[0].opacity = 0;
                let action = cc.delayTime(cmd[i].playTime);
                this.actionArray.push(action);
                allAnimateTime += cmd[i].playTime;
                
                let dieCallFunc = cc.callFunc(function(){   //消除动画后的回调
                    this.elemStack[ this.elemStack.length-1].destroy();
                    
                    this.elemStack[this.elemStack.length -1] = null;   
                    this.isTopElemCanDestroy = null;
                    this.isTopElemCanMove = null;
                    this.topElemType = null;
                    this.topElemStatus = null;
                },this)
                
                this.actionArray.push(dieCallFunc); //执行完动画后将元素销毁
                continue;
            }
            if (cmd[i].actionName == 'toDelay') {
                let action = cc.delayTime(cmd[i].playTime);
                this.actionArray.push(action);
                allAnimateTime += cmd[i].playTime;
                continue;
            }
            //魔力鸟造成的抖动
            if (cmd[i].actionName == 'magicShake') {
                let delayAction = cc.delayTime(mapConfig.ANIMATE_TIMES.TO_MOVE);
                this.magicShakeActionsArray.push(delayAction);

                let action1 = cc.rotateBy(cmd[i].playTime/5, -45);
                let action2 = cc.rotateBy(cmd[i].playTime/5, 75);
                let action3 = cc.rotateBy(cmd[i].playTime/5, -50);
                let action4 = cc.rotateBy(cmd[i].playTime/5, 30);
                let action5 = cc.rotateBy(cmd[i].playTime/5, -10);

                allAnimateTime += cmd[i].playTime;
                this.magicShakeActionsArray.push(action1);
                this.magicShakeActionsArray.push(action2);
                this.magicShakeActionsArray.push(action3);
                this.magicShakeActionsArray.push(action4);
                this.magicShakeActionsArray.push(action5);
                continue;
            }

            if(cmd[i].actionName == 'scaleHide'){
                let action = cc.scaleTo(cmd[i].playTime, 0);
                this.actionArray.push(action);
                allAnimateTime += cmd[i].playTime;
                continue;
            }
            if(cmd[i].actionName == 'scaleShow'){
                let action = cc.scaleTo(cmd[i].playTime, 1);
                this.actionArray.push(action);
                allAnimateTime += cmd[i].playTime;
                continue;
            }
        }
        this.actionArray = this.actionArray.concat(this.magicShakeActionsArray);
        this.elemStack[ this.elemStack.length- 1].runAction(this.actionArray.length >1 ? cc.sequence(this.actionArray) : this.actionArray[0]);     //顺序执行动画
        
        this.actionArray = [];
        this.magicShakeActionsArray = [];
        this.elemStack[ this.elemStack.length -1].getComponent(MovableElem).animateCmds = [];

        return allAnimateTime;
    }

    
}
