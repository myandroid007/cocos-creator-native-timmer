import {mapConfig} from '../conf/mapConfig';
import Cell from './baseClass/Cell';
import MovableElem from './baseClass/MovableElem';
import BaseElem from './baseClass/BaseElem';
import UnmovableElem from './baseClass/UnmovableElem';
import Effect from './baseClass/effect';
import EffectLayer from './effectLayer';
import Global from '../commons/storage/Global';
import Vec2Util from '../commons/util/vec2Util';
import {Score} from './score';
import DoubleHitGuidePlayer from './DoubleHitGuidePlayer';
import NetChecker from '../commons/net/NetChecker';
import ImmediateRanking from '../ranking/immediateRanking/immediateRanking';
import MusicManager from '../commons/musicManager/musicManager';
const {ccclass, property} = cc._decorator;

var self=null;

/**
 * 游戏区域逻辑文件，包括地图生成，元素生成，消除，下落，特效播放等子逻辑
 * 核心设计思想：将地图每个单元格设置为一个cell对象，此对象内有多个元素，分层显示
 * cell对象可对自身内部元素进行简单操作。gameArea通过操作cel来控制多个元素
 * 
 * 下落使用寻路算法设计
 * @author 刘磊
 * @since 2017.11.14
 */
@ccclass
export default class GameArea extends cc.Component {
    public isForbiddenTouch: boolean = false;       //是否禁用点击/触摸

    @property(cc.Prefab)
    private defaultCellBg: cc.Prefab = null;

    @property(cc.Prefab)
    private defaulSlectBg: cc.Prefab = null;

    @property([cc.Prefab])
    private defaultElems: [cc.Prefab] = [null];
    
    private touchPositions: cc.Vec2[] = [];      //每次消除操作之后，清空一下此数组
    private originTouchPositions: cc.Vec2[] = [];


    private cellBgResource: cc.SpriteFrame = null;          //存放导入的格子背景资源
    private elemResources: [cc.SpriteFrame] = null;         //存放导入的元素模板资源

    private cells: Cell[][] = [];       //格子数组
    private hiddenElems: cc.Node[][] = [];      //存放隐藏元素的数组
    private topColCellPos: cc.Vec2[] = [];      //存放每列最上部格子坐标的数组

    public isPlayingAnimate: boolean = false;      //是否正在播放动画

    private effects: Effect[] = [];     //特效实例数组

    //爆炸预制
    @property(cc.Prefab)
    private boomPrefab: cc.Prefab = null;

    @property(cc.Prefab)
    private rowCrush: cc.Prefab = null;

    @property(cc.Prefab)
    private colCrush: cc.Prefab = null;

    //音效资源
    @property(cc.AudioClip)
    private bgMusic: cc.AudioClip = null;

    @property(cc.AudioClip)
    private crushMusic: cc.AudioClip = null;

    @property(cc.AudioClip)
    private clickMusic: cc.AudioClip = null;

    @property(cc.AudioClip)     //特效动物生成音乐
    private effectCreatMusic: cc.AudioClip = null;

    @property(cc.AudioClip)    
    private wrapMusic: cc.AudioClip = null;

    @property(cc.AudioClip)     //行列特效音乐
    private rowColCrushMusic: cc.AudioClip = null;

    @property(cc.AudioClip)     //魔力鸟特效音乐
    private magicMusic: cc.AudioClip = null;

    @property(cc.AudioClip)     //厉害了音效
    private musicGood: cc.AudioClip = null;

    @property(cc.AudioClip)     //完美了音效
    private musicGreat: cc.AudioClip = null;

    @property(cc.AudioClip)     //炫酷音效
    private musicCool: cc.AudioClip = null;

    @property(cc.AudioClip)     //加油了音效
    private musicComeOn: cc.AudioClip = null;

    @property(cc.AudioClip)     //很棒了音效
    private musicFantastic: cc.AudioClip = null;

    private currentScore: number = 0;   //当前得分
    private autoCrushTimes: number = 0;     //当前轮自动消除次数
    private isGameLoaded: boolean = false;


    onLoad() {
        //开始监听网络（若该场景不是游戏启动的第一个场景，则需要在onload里面调用一次NetChecker.getNetConnectionType(),获取一次当前网络类型
        NetChecker.addEventListener('change','',null);

        //播放背景音乐
        MusicManager.playBgMusic(this.bgMusic); 
        //开始触摸监听
        this._touchListener();

        // // 全局断网监听检测
        // NetChecker.checkNetWork();
    }

    onDestroy(){
        NetChecker.removeEventLisener('change','showTip');
    }

    /**
     * 游戏区域初始化方法
     * @param mapInfo  传入的地图数据源
     */
    public async init(mapInfo: number[][], template?: Object) {
        this._initCells();

        let initMapInfo: number[][] = [];   //深复制
        for(let i =0; i<= mapInfo.length-1; i++){
            let temp = mapInfo[i].slice(0);
            initMapInfo.push(temp)
        }

        if(template){
            await this._initMapWithTemplate(initMapInfo,template)
        }else{
            await this._initMapWithPreab(initMapInfo);
        }

        this._initColTopCellPos();
        this._initHiddenlems();
        this._initMask();
        this._initDoubleHitGuider();

        this.isGameLoaded = true;
        this.test();
    }

    /**
     * 触摸点击监听
     */
    private _touchListener(){
        //点击监听
        this.node.on(cc.Node.EventType.TOUCH_START, (eventTouch: cc.Event.EventTouch) => {
            if(!this.isForbiddenTouch){
                return ;    //禁用触摸中
            }

            if(this.isPlayingAnimate){
                // cc.log('正在执行动画：')
                return ;
            }

            //第一次点击
            if(this.touchPositions.length == 0){
                // cc.log('点击1次')
                this.originTouchPositions.push(eventTouch.getLocation());
                let pos = this._positionTransport(eventTouch.getLocation());
                if(!pos){
                    return;
                }
                //点击音效
                MusicManager.playRuntimeMusic(this.clickMusic);
                //设置选中
                this.cells[pos.x][pos.y].setSlect(true);
                this.touchPositions.push(pos)
            }

            //第二次点击
            if(this.touchPositions.length == 1){
                // cc.log('点击第2次')
                let currentPos = eventTouch.getLocation();
                let pos1 =  this.touchPositions[0];
                let pos2 = this._positionTransport(eventTouch.getLocation());
                if(!pos2){
                    return ;
                }
                if(!pos1.equals(pos2)){
                    MusicManager.playRuntimeMusic(this.clickMusic);
                    if ( this._isPosAdjacent(pos1, pos2) ) {
                        // cc.log('点击的位置相邻')
                        this.touchPositions[0] = pos1;
                        this.touchPositions[1] = pos2;
                        this._cleanClickAnimation(); 
                        this.originTouchPositions = [];
                        this._mainOperate();
                    } else{
                        //将第二个位置聚焦并设置选中
                        // cc.log('点击位置不相邻，将位置2设置为位置1')
                        this.touchPositions[0] = pos2;
                        this.originTouchPositions[0] = eventTouch.getLocation();
                        this._cleanClickAnimation();
                        this.cells[pos2.x][pos2.y].setSlect(true);
                    }
                }
            }

        });

        //移动监听
        this.node.on(cc.Node.EventType.TOUCH_MOVE, (eventTouch: cc.Event.EventTouch) =>{
            if(!this.isForbiddenTouch){
                return ;    //禁用触摸中
            }
            if(this.originTouchPositions.length == 1){
                let currentPos = eventTouch.getLocation();
                if(Math.abs(currentPos.y - this.originTouchPositions[0].y)> 2 || Math.abs(currentPos.x - this.originTouchPositions[0].x)> 2 ) {
                    this.originTouchPositions.push(currentPos);
                    if(!this.isPlayingAnimate){
                        let result = this.exchangeOringinPosToVec2Pos(this.originTouchPositions[0], this.originTouchPositions[1]);
                        if(result[0] && result[1] && !result[1].equals(result[0])){
                            this.touchPositions[0] = result[0];
                            this.touchPositions[1] = result[1];
                            this._cleanClickAnimation();
                            this.originTouchPositions = [];
    
                            this._mainOperate();
                        }else{
                            // cc.log('原始位置：', this.originTouchPositions[0],this.originTouchPositions[1])
                            this.originTouchPositions.pop();
                            // cc.log('问题touch位置：',  result[0], result[1]);
                        }
                    }
                }
               
            }
        });
    }

    /**
     * 发送动画结束事件
     */
    public sendAnimationEndEvent(){
        let event = new cc.Event.EventCustom('animation-end',true);
        this.node.dispatchEvent(event);
    }

    
    /**
     * 测试代码，用于产生指定位置和特效类型的元素 的方法
     */
    test(){
        let elemStatus1 = mapConfig.ELEM_STATUS.MAGIC;
        let elemStatus2 = mapConfig.ELEM_STATUS.ROW;

        let pos1 = cc.p(2,1);
        let pos2 = cc.p(2,2);

        this.cells[pos1.x][pos1.y].topElemStatus = elemStatus1;
        this.cells[pos1.x][pos1.y].getTopElemInfo()[0].getComponent(MovableElem).status = elemStatus1;
        this.cells[pos1.x][pos1.y].playEffectCreatingAnimation(elemStatus1);

        this.cells[pos2.x][pos2.y].topElemStatus = elemStatus2;
        this.cells[pos2.x][pos2.y].getTopElemInfo()[0].getComponent(MovableElem).status = elemStatus2;
        this.cells[pos2.x][pos2.y].playEffectCreatingAnimation(elemStatus2);
    }


    private _initCells(){
        
        for(let i=0; i<=mapConfig.X_NUMBER-1; i++){
            let temp = [];
            for(let j=0; j<= mapConfig.Y_NUMBER-1; j++){
                temp.push(null);
            }
            this.cells.push(temp);

        }
    }
    /**
     * 使用默认资源进行地图解析初始化
     * @param mapInfo 地图数据
     */
    private async _initMapWithPreab(mapInfo: number[][]){

        let mapInfoCopy: number[][] = [];   //深复制
        for(let i =0; i<= mapInfo.length-1; i++){
            let temp = mapInfo[i].slice(0);
            mapInfoCopy.push(temp)
        }

        this._initCellBg(mapInfo, null);
        this._initElems(mapInfo, null);
        
        await this._mixCellToNotConnect(mapInfoCopy);
    }


    /**
     * 初始化连击提示
     */
    private _initDoubleHitGuider(){
        let SCREEN_WIDTH = cc.director.getWinSize().width;
        let unitWidth = SCREEN_WIDTH / mapConfig.Y_NUMBER;

        let guidNumber: number = 2;
        let guidNodeArray: cc.Node[]  = [];
        for(let i=0; i<= guidNumber-1; i++){
            let newNode: cc.Node = new cc.Node();
            let label = newNode.addComponent(cc.Label);
            label.string = '';
            this.node.parent.addChild(newNode);
            newNode.setPosition(cc.p( -SCREEN_WIDTH/2 + mapConfig.HEIGHT_SKEW * 3, SCREEN_WIDTH/2 + mapConfig.HEIGHT_SKEW * 3))
            guidNodeArray.push(newNode);
        }
        //初始连击引导的资源
        DoubleHitGuidePlayer.init(
           [guidNodeArray[0],guidNodeArray[1]],
           [this.musicGood,this.musicGreat,this.musicCool,this.musicFantastic,this.musicComeOn]
        );
    }

     /**
     * 将所有格子打乱，直至没有超过3个的直线相连元素
     */
    private async _mixCellToNotConnect(mapInfo: number[][]){
        let spesifiedPos: cc.Vec2[] = [];   //指定了位置的格子位置

        let topLayer = mapInfo[mapInfo.length-1];
        let SCREEN_WIDTH = cc.director.getWinSize().width;
        let unitWidth = SCREEN_WIDTH / mapConfig.Y_NUMBER;

        //确定需要忽略的位置
        for(let i=0; i<= topLayer.length -1; i++){ //遍历最顶层数据
            let row = Math.floor( i / mapConfig.X_NUMBER )
            let col =  i % mapConfig.X_NUMBER ;

            if(topLayer[i] != 0 || mapConfig.MOVE_ELEMS.indexOf(topLayer[i]) != -1 ){
                spesifiedPos.push(cc.p(row, col))
                continue;
            }
        }

        //检查并替换重复元素
        for(let i=0; i<= mapConfig.X_NUMBER-1; i++){
            for(let j=0; j<= mapConfig.Y_NUMBER-1; j++){
                if(!this.cells[i][j]){
                    continue;
                }
                let checkResult = await this._checkPoint(cc.p(i,j));

                if(checkResult[0].length >=3){  //超过3 个相连的
                    let pos: cc.Vec2 = checkResult[0][1];   //取出第2个元素
                    let originType: number = this.cells[pos.x][pos.y].getTopElemType();
                    //获取新类型
                    let randomType: number = mapConfig.ELEM_KINDS.MIN_KINDS;
                    while(true){
                        if(randomType != originType){
                            break;
                        }
                        if(randomType >= mapConfig.ELEM_KINDS.MAX_KINDS){
                            randomType = mapConfig.ELEM_KINDS.MAX_KINDS;
                            break;
                        }
                        randomType++;
                    }

                    this.cells[pos.x][pos.y].destroyTopElem();
                    let elemIndex: number = 0;      //获取存放资源的数组里，所需元素的下标

                    for (let temp = 0; temp < this.defaultElems.length; temp++) {
                        if (randomType == Number(this.defaultElems[temp].name)) {
                            elemIndex = temp
                            break;
                        } 
                    }

                    //生成元素
                    let  elem: cc.Node = cc.instantiate(this.defaultElems[elemIndex]);

                    if(mapConfig.MOVE_ELEMS.indexOf(randomType) != -1){
                        elem.addComponent(MovableElem);
                        elem.getComponent('MovableElem').type = randomType;
                    } else {
                        continue;
                    }

                    this.node.addChild(elem);
                    elem.width = unitWidth;
                    elem.height = unitWidth;

                    this._setPos(cc.p(pos.y,pos.x),elem);
                    this.cells[pos.x][pos.y].addElem(elem);
                }
            }
        }   
    }
    
    /**
     * 使用指定的地图信息和模板信息进行地图初始化
     * @param mapInfo 地图信息
     * @param template 模板对象
     */
    private  _initMapWithTemplate(mapInfo: number[][], template: any): void {
        if(template.cellBgUrl){
            this._initCellBg(mapInfo, template.cellBgUrl)
            this._initElems(mapInfo, template)
        }else{
            // cc.log('没有指定格子背景')
        }
        
    }
    
    /**
     * 初始化背景格子
     * @param mapInfo 
     * @param cellBgUrl  指定背景图片的url
     */
    private  _initCellBg(mapInfo: number[][], cellBgUrl: string) {
        if(!mapInfo){
            return ;
        }
        let temp: number = 0;
        let SCREEN_WIDTH = cc.director.getWinSize().width;
        let unitWidth = SCREEN_WIDTH / mapConfig.Y_NUMBER;
        
        for(let j=0; j<= mapConfig.Y_NUMBER-1; j++){
            for(let i=0; i<=mapConfig.X_NUMBER-1; i++){
                if(mapInfo[0][temp] != -1){
                    // let unitCellBg: cc.Node = null;
                    if(cellBgUrl){
                        cc.loader.loadRes(cellBgUrl, cc.SpriteFrame, (err, spriteFrame)=>{
                           let  unitCellBg = new cc.Node();

                            let sprite = unitCellBg.addComponent(cc.Sprite)
                            sprite.spriteFrame = spriteFrame;
                            this.node.addChild(unitCellBg);
                            unitCellBg.width = unitWidth;
                            unitCellBg.height = unitWidth;

                            this._setPos(new cc.Vec2(i, j),unitCellBg);
                            let newCell = new Cell();
                            newCell.addElem(unitCellBg);
                            this.cells[j][i] = newCell;      //生成格子对象
                            
                        })
                        
                    }else{
                  
                        let  unitCellBg = cc.instantiate(this.defaultCellBg);
                        let slectBg = cc.instantiate(this.defaulSlectBg);

                        unitCellBg.width = unitWidth;
                        unitCellBg.height = unitWidth;
                        slectBg.width = unitWidth ;
                        slectBg.height = unitWidth;
                        
                        this.node.addChild(unitCellBg);
                        this.node.addChild(slectBg);
                        
                        this._setPos(cc.p(i,j),unitCellBg);
                        this._setPos(cc.p(i,j),slectBg);
                        
                        let newCell = new Cell();
                        newCell.addElem(unitCellBg);
                        newCell.addElem(slectBg);

                        slectBg.active = false;
                        this.cells[j][i] = newCell;      //生成格子对象
                        
                    }
                    
                }
                temp ++;
            }
        }
    }
    
    /**
     * 初始化元素
     * @param mapInfo 
     * @param template 
     */
    private _initElems(mapInfo: number[][], template: any) {
        if(!mapInfo){
            return ;
        }

        let SCREEN_WIDTH = cc.director.getWinSize().width;
        let unitWidth = SCREEN_WIDTH / mapConfig.Y_NUMBER;


        let self = this;
        let creatElemByResource = function(){
            for(let p=1; p<mapInfo.length; p++){        //依次取出剩余mapInfo
                for(let i=0; i<mapInfo[p].length; i++){ //遍历单层数据
                    let row = Math.floor( i / mapConfig.X_NUMBER )
                    let col =  i % mapConfig.X_NUMBER ;

                    if (!self.cells[row][col]) {
                        // cc.log('空格位置：', row, col)
                        continue ;
                    }
                    // cc.log('行列：', row, col)
                    if (mapInfo[p][i] == -1 ) {  
                        self.cells[row][col].addElem(null); 
                        continue;
                    }
                    if(mapInfo[p][i] === 0){ //生成随机动物
                        mapInfo[p][i] = self._getRandomElemType();
                    }
                    let elemIndex: number = 0;      //获取存放资源的数组里，所需元素的下标
                    for (let temp3 = 0; temp3 < self.defaultElems.length; temp3++) {
                        if (mapInfo[p][i] == Number(self.defaultElems[temp3].name)) {
                            elemIndex = temp3
                            break;
                        } 
                    }
                    let elem: cc.Node = null; 

                    if(self.elemResources){
                        elem = new cc.Node();
                        let sprite = elem.addComponent(cc.Sprite);
                        sprite.spriteFrame = self.elemResources[elemIndex]
                        sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
                        //这代码块 抽不抽呢？
                        if(mapConfig.MOVE_ELEMS.indexOf(mapInfo[p][i])){
                            elem.addComponent(MovableElem);
                            elem.getComponent('MovableElem').type = mapInfo[p][i];
                        }else{
                            elem.addComponent(UnmovableElem)
                            elem.getComponent('UnmovableElem').type = mapInfo[p][i];
                        }
                        
                        self.node.addChild(elem);
                        self._setPos(cc.p(col,row),elem);
                        self.cells[row][col].addElem(elem);
                        
                    }else{
                        elem = cc.instantiate(self.defaultElems[elemIndex]);

                        if(mapConfig.MOVE_ELEMS.indexOf(mapInfo[p][i]) != -1){
                            elem.addComponent(MovableElem)
                            elem.getComponent('MovableElem').type = mapInfo[p][i];
                        }else{
                            elem.addComponent(UnmovableElem)
                            elem.getComponent('UnmovableElem').type = mapInfo[p][i];
                        }

                        self.node.addChild(elem);
                        elem.width = unitWidth;
                        elem.height = unitWidth;

                        self._setPos(cc.p(col,row),elem);
                        self.cells[row][col].addElem(elem);
                    }

                }
            }
        }

        if (template) {
            //加载资源
            cc.loader.loadRes(template.cellBgUrl, cc.SpriteFrame, (err,spriteFrame) => {
                this.cellBgResource = spriteFrame;
                cc.loader.loadRes(template.atlas, <any>cc.SpriteAtlas, (err, atlas) => {
                    this.elemResources = atlas.getSpriteFrames();
                    creatElemByResource();
                })
            })
        } else {
            creatElemByResource();
        }

    }


    /**
     * 初始化记录每列的顶部元素位置
     */
    private  _initColTopCellPos(){
        for (let j=0; j<= mapConfig.X_NUMBER-1; j++) {
            for (let i =0; i<= mapConfig.Y_NUMBER-1; i++) {
                if(i== mapConfig.Y_NUMBER-1 && !this.cells[i][j]){
                    this.topColCellPos[j] = null;
                }
                if(!this.cells[i][j] ){
                    continue;
                }else{
                    this.topColCellPos[j] = cc.p(i,j);
                    break;
                }
            }
        }
    }

    /**
     * 初始化所有隐藏数组
     */
    private _initHiddenlems(){
        let unitHeight: number = cc.director.getWinSize().width / mapConfig.Y_NUMBER ; 
        for(let col =0; col<= mapConfig.Y_NUMBER-1; col++){
            let hidingCol: cc.Node[] = [];
            let topPos = this.topColCellPos[col];
            for(let i= 0; i<= mapConfig.HIDING_ELEM_NUMBER-1; i++){
                if (this.cells[0][col] == null) {
                    continue;
                }
                let newElem = this._createHidingElem(cc.p( -i -1,col), this._getRandomElemType(), mapConfig.ELEM_STATUS.COMMON);
                hidingCol.push(newElem)
            }
            this.hiddenElems.push(hidingCol)
        }  
    }
    
    /**
     * 初始化遮罩
     */
    private  _initMask(){
        
        let originPos = this.node.getPosition();    
        this.node.y = originPos.y - mapConfig.HEIGHT_SKEW ;

        let mainMask = this.node.addComponent(cc.Mask);
        mainMask.type = cc.Mask.Type.RECT;
        this.node.width = cc.director.getWinSize().width;
        this.node.height = cc.director.getWinSize().width;

    }

    /**
     * 将节点元素设置到指定位置
     * @param pos  二维坐标位置
     */
    private _setPos(pos: cc.Vec2, elem: cc.Node) :void {
        
        
        let SCREEN_WIDTH = cc.director.getWinSize().width;
        let unitWidth = SCREEN_WIDTH / mapConfig.Y_NUMBER;
        // let SCREEN_WIDTH = cc.director.getWinSize().width;

        let parentPos = this.node.parent.getPosition();
        let parentPosX = parentPos.x;

        let width =  pos.x * unitWidth + 0.5 * unitWidth - parentPosX
        let height =  - pos.y * unitWidth - 0.5 * unitWidth + parentPosX;
        

        if (pos.y < 0  ) {
            let topCellPos:cc.Vec2 =  this._getTopCell(pos.x)[0].getPosition();
            elem.setPosition( topCellPos.x , topCellPos.y - pos.y * unitWidth  )

        }else{
            elem.setPosition(width,height)
        }


    }

   

    /**
     * 检查指定位置的元素是否可进行交换
     * 仅只有水平和数值相邻的2元素才能交换。其他操作不可交换
     * @param cell1 第一个位置
     * @param cell2 第二个位置
     * @returns result 检查结果
     */
    private _isTwoPosCanMove(pos1: cc.Vec2, pos2: cc.Vec2): boolean {


        if(!this.cells[pos1.x][pos1.y]  || !this.cells[pos2.x][pos2.y]) {
            return false;
        }
        let canMoveVec: string[] = ['1_0', '0_1'];    //可移动的坐标向量,直接存放cc.Vec2 类型值，之后indexof 检测不出来，所以转化为string类型
        let operateVec: cc.Vec2 = cc.p(Math.abs(pos1.x - pos2.x), Math.abs(pos1.y -pos2.y));
        let operateStr: string = operateVec.x + '_' +operateVec.y ;

        if (canMoveVec.indexOf(operateStr) != -1) { 
            let moveType1 = this.cells[pos1.x][pos1.y].getTopElemIsCanMove;
            let moveType2 = this.cells[pos2.x][pos2.y].getTopElemIsCanMove;
            if (moveType1 && moveType2) {
                return true;
            }
        }
        return false;

    }

      /**
     * 将原始触摸屏幕位置，转换为格子位置
     * @param originPos1 
     * @param originPos2 
     * @returns 转换后的格子位置数组
     */
    private exchangeOringinPosToVec2Pos(originPos1: cc.Vec2, originPos2: cc.Vec2): cc.Vec2[]{

        // cc.Vec2 的向量角度坐标图
        // *                      90°
        // *                      |
        // *                      |
        // *                      |
        // *   180° --------------0------------ 0°
        // *                    / |
        // *                   /  |
        // *                  /   |
        // *                -135° -90°

        let delatX = originPos2.x - originPos1.x;
        let delatY = originPos2.y - originPos1.y;

        let angle = Math.atan2(delatY, delatX)/ Math.PI * 180;;

        let pos1 = this._positionTransport(cc.v2(originPos1));
        let pos2 = null;

        let isPosOutOfBound: boolean = false;
        let nextPos: cc.Vec2 = null;

        if ( (angle >= 0 && angle <= 45 ) || (angle >= -45 && angle <= 0) ) {    //东,东南，东北c
            let nextPosY = pos1.y + 1;
            if (nextPosY <= mapConfig.Y_NUMBER-1) {
                pos2 = cc.p(pos1.x, nextPosY);
            } else {
                isPosOutOfBound = true;
                // cc.log('1下个位置超出界限')
            }
            
        }
        if (angle >= 45 && angle <= 135) {    //西北,东北，北
            let nextPosX = pos1.x - 1;
            if (nextPosX >= 0) {
                pos2 = cc.p(nextPosX, pos1.y);
            } else {
                isPosOutOfBound = true;
                // cc.log('2下个位置超出界限')
            }
        }
        if ((angle >= 135 && angle <= 180) || (angle <= -135) ) {    //西北,西，西南
            let nextPosY = pos1.y - 1;
            if (nextPosY >= 0) {
                pos2 = cc.p(pos1.x, nextPosY);
            } else {
                isPosOutOfBound = true;
                // cc.log('3下个位置超出界限')
            }
        }
        if ((angle <= -45 && angle >= -135)  ) {    //东南,西南，南
            let nextPosX = pos1.x + 1;
            if (nextPosX <= mapConfig.X_NUMBER-1) {
                pos2 = cc.p(nextPosX, pos1.y);
            } else {
                isPosOutOfBound = true;
                // cc.log('4下个位置超出界限')
            }
        }

        return [pos1, pos2];
    }
    

    /**
     * 将屏幕点击位置转换为对应地图上元素的二维位置
     * @param pos  屏幕点击位置
     * @returns result ={行，列}
     */
    private _positionTransport(pos: cc.Vec2): cc.Vec2 {

        let SCREEN_WIDTH = cc.director.getWinSize().width;
        let unitWidth = SCREEN_WIDTH /  mapConfig.Y_NUMBER;


        let result :cc.Vec2 = null;

        let nodePosition = this.node.parent.getPosition();  //gameArea 的坐标
        let topY = nodePosition.y + nodePosition.x - mapConfig.HEIGHT_SKEW ;
        let bottomY = nodePosition.y - nodePosition.x - mapConfig.HEIGHT_SKEW ;

        if(pos.y > topY || pos.y < bottomY){
            cc.log('超出界限')
           return null;
        }
        let col = Math.ceil( pos.x / unitWidth ) -1;
        let row = Math.ceil( (topY - pos.y  ) / unitWidth ) -1;
        return result = new cc.Vec2(row,col);

    }


    /**
     * 获取用于消除元素的随机类型
     */
    private _getRandomElemType (): number {
        let result :number = null;
        let minNumber = mapConfig.ELEM_KINDS.MIN_KINDS;
        let maxNumber = mapConfig.ELEM_KINDS.MAX_KINDS;
        result = minNumber + Math.round(Math.random() * (maxNumber - minNumber ) );
        return result;
    }

    /**
     * 按照方向，检查相连元素
     * @param pos 开始检查的点
     * @param directions  方向向量
     */
    private _checkWithDirection(pos: cc.Vec2, directions: cc.Vec2[]): cc.Vec2[]{
        let resultPositions: [cc.Vec2] = [pos];
        let currentPos: cc.Vec2 = pos;
        let firstPos: cc.Vec2 = pos;
        for (let i=0; i<directions.length; i++) {
            let flag: number = 1;
            let nextPos: cc.Vec2 = cc.p(pos.x + flag * directions[i].y, pos.y + flag * directions[i].x);
            while (this._isPosInMap(nextPos) && this.cells[nextPos.x][nextPos.y]){
                let currentType = this.cells[currentPos.x][currentPos.y].getTopElemType();
                let nextType = this.cells[nextPos.x][nextPos.y].getTopElemType();
                if (currentType == nextType) {
                    resultPositions.push(nextPos);
                    currentPos = nextPos;
                    flag++;
                    nextPos = cc.p(pos.x + flag * directions[i].y, pos.y + flag * directions[i].x)
                } else {
                    currentPos = firstPos;
                    break;
                }
            }
        }
        return resultPositions;

    }



    /**
     * 检查周围是否有相连可消除 的元素
     * @param pos 初始检查位置
     * @returns [result:arry ,newElemType :number, newStatus: number]
     */
    private async _checkPoint(pos :cc.Vec2): Promise<[cc.Vec2[], number, number]> {
        let rowResult = this._checkWithDirection(pos, [cc.p(1, 0), cc.p(-1, 0)]);
        let colResult = this._checkWithDirection(pos, [cc.p(0, -1), cc.p(0, 1)]);

        let newElemStatus: number = null;
        let originPositions: cc.Vec2[] = [];

        if (rowResult.length >= 5 || colResult.length >= 5) {
            newElemStatus = mapConfig.ELEM_STATUS.MAGIC;
        }
        else if (rowResult.length >= 3 && colResult.length >= 3) {
            newElemStatus = mapConfig.ELEM_STATUS.WRAP;
        }
        else if (rowResult.length >= 4) {
            newElemStatus = mapConfig.ELEM_STATUS.COLUMN;
        }
        else if (colResult.length >= 4) {
            newElemStatus = mapConfig.ELEM_STATUS.ROW;
        }

        //不达成消除条件
        if (rowResult.length >= 3 && colResult.length >=3) {
            //合并消除数组
            for (let i= 0; i< rowResult.length; i++) {
                if(colResult.indexOf(rowResult[i]) != -1){
                    continue;
                }
                colResult.push(rowResult[i])
            }
            originPositions = colResult;
        }
        else if (rowResult.length >= 3 ) {
            originPositions = rowResult;
        }
        else if (colResult.length >= 3) {
            originPositions = colResult;
        } else {
            // resultPositions = [cc.p(-1,-1)]
        }
       
        //计算普通得分
        if(originPositions.length >=3 ){
            let deltaScore: number =  Score.calculateNormalCrush(originPositions, this.autoCrushTimes);
            let pos: cc.Vec2 = Vec2Util.getTopestAndLefestItemFromArray(originPositions);
            this._addScore(deltaScore, pos, this.cells[pos.x][pos.y].getTopElemType());
        }

        //判断相连元素中书否有特效元素，有则将其触发
        let resultPositions: cc.Vec2[] = await this._triggerEffectCrush(originPositions);

        resultPositions = resultPositions.concat(originPositions);
        let elemType = this.cells[pos.x][pos.y].getTopElemType();

        return [resultPositions, elemType, newElemStatus];
    }

    /**
     * 触发特效消除
     * @param originPos     传入的需要检查的节点位置数组
     * @returns 最终需要销毁的节点数组
     */
    private async  _triggerEffectCrush(positions: cc.Vec2[]): Promise<cc.Vec2[]>{
        let result: cc.Vec2[] = [];

        let trigerTimes: number = 0;    //触发次数
        let triger = async (originPos)=>{
            for(let i =0; i<=originPos.length-1; i++){
                let currentPos = originPos[i];
                let elemStatus = this.cells[currentPos.x][currentPos.y].getTopElemStatus();
                //触发行特效
                if (elemStatus == mapConfig.ELEM_STATUS.ROW ) { 

                    MusicManager.playRuntimeMusic(this.rowColCrushMusic);   //播放音效
                    DoubleHitGuidePlayer.recordEffectsTimes();
                    let rowResult = this._getCurrentPosRowRange(currentPos);
                    result = result.concat(rowResult);
                    this._createEffectInstance(this.rowCrush, cc.p(currentPos.y, currentPos.x));
                    this.cells[currentPos.x][currentPos.y].topElemStatus = mapConfig.ELEM_STATUS.COMMON;
                    this.cells[currentPos.x][currentPos.y].getTopElemInfo()[0].getComponent(MovableElem).status = mapConfig.ELEM_STATUS.COMMON;

                    trigerTimes ++;
                    //添加得分
                    let deltaScore = Score.calculateEffectCrush(rowResult, mapConfig.SCORE_TYPE.LINE, trigerTimes);
                    let pos: cc.Vec2 = Vec2Util.getTopestAndLefestItemFromArray(rowResult);
                    this._addScore(deltaScore, pos, this.cells[pos.x][pos.y].getTopElemType());


                    triger(result);
                }   
                //触发列特效
                if (elemStatus == mapConfig.ELEM_STATUS.COLUMN ) {  
                    // cc.log('触发列特效')
                    MusicManager.playRuntimeMusic(this.rowColCrushMusic);   //播放音效
                    DoubleHitGuidePlayer.recordEffectsTimes();
                    let colResult = this._getCurrentPosColRange(currentPos);
                    result = result.concat(colResult);
                    this._createEffectInstance(this.colCrush, cc.p(currentPos.y, currentPos.x));
                    this.cells[currentPos.x][currentPos.y].topElemStatus = mapConfig.ELEM_STATUS.COMMON;
                    this.cells[currentPos.x][currentPos.y].getTopElemInfo()[0].getComponent(MovableElem).status = mapConfig.ELEM_STATUS.COMMON;

                    trigerTimes ++;
                    //添加得分
                    let deltaScore = Score.calculateEffectCrush(colResult, mapConfig.SCORE_TYPE.LINE, trigerTimes);
                    let pos: cc.Vec2 = Vec2Util.getTopestAndLefestItemFromArray(colResult);
                    this._addScore(deltaScore, pos, this.cells[pos.x][pos.y].getTopElemType());

                    triger(result);
                }   
                //触发爆炸特效
                if (elemStatus == mapConfig.ELEM_STATUS.WRAP ) {
                    MusicManager.playRuntimeMusic(this.wrapMusic);   //播放音效
                    DoubleHitGuidePlayer.recordEffectsTimes();
                    // cc.log('触发爆炸特效')
                    let wrapResult = this._getCurrentPosWrapRange(currentPos);
                    result = result.concat(wrapResult);
                    this.cells[currentPos.x][currentPos.y].topElemStatus = mapConfig.ELEM_STATUS.COMMON;
                    this.cells[currentPos.x][currentPos.y].getTopElemInfo()[0].getComponent(MovableElem).status = mapConfig.ELEM_STATUS.COMMON;

                    trigerTimes ++;
                    //添加得分
                    let deltaScore = Score.calculateEffectCrush(wrapResult, mapConfig.SCORE_TYPE.WRAP, trigerTimes);
                    let pos: cc.Vec2 = Vec2Util.getTopestAndLefestItemFromArray(wrapResult);
                    this._addScore(deltaScore, pos, this.cells[pos.x][pos.y].getTopElemType());

                    triger(result);
                }   
                //触发魔力鸟特效
                if (elemStatus == mapConfig.ELEM_STATUS.MAGIC ) {
                    MusicManager.playRuntimeMusic(this.magicMusic);   //播放音效
                    DoubleHitGuidePlayer.recordEffectsTimes();
                    // cc.log('触发魔力鸟特效')
                    let magicResult: cc.Vec2[] = this._getAllPosWithOneType(this.cells[this.touchPositions[1].x][this.touchPositions[1].y].getTopElemType());
                    result = result.concat(magicResult);
                    this.cells[currentPos.x][currentPos.y].topElemStatus = mapConfig.ELEM_STATUS.COMMON;
                    this.cells[currentPos.x][currentPos.y].getTopElemInfo()[0].getComponent(MovableElem).status = mapConfig.ELEM_STATUS.COMMON;


                    for (let i=0; i<= magicResult.length-1; i++) {
                        this.cells[magicResult[i].x][magicResult[i].y].addMagicShakeAction();
                    }
                    await this._waitTime(this._updateCellsView());
                    await this._waitTime(mapConfig.ANIMATE_TIMES.MAGIC_SHAKE);

                    trigerTimes ++;
                    //添加得分
                    let deltaScore = Score.calculateEffectCrush(magicResult, mapConfig.SCORE_TYPE.MAGIC, trigerTimes);
                    let pos: cc.Vec2 = Vec2Util.getTopestAndLefestItemFromArray(magicResult);
                    this._addScore(deltaScore, pos, this.cells[pos.x][pos.y].getTopElemType());

                    triger(result);
                }  
                
            }
            return result;
        }
       
        return await triger(positions);
    }
    /**
     * 延迟销毁指定位置的元素
     * @param posArray 
     */
    private async _destroyElem(posArray: cc.Vec2[]){
        for (let i=0; i<posArray.length; i++) {
            if (posArray[i].x != -1 && posArray[i].y != -1 && this.cells[posArray[i].x][posArray[i].y] ) {
                let isFirstTouchPos: boolean = posArray[i].x == this.touchPositions[0].x && posArray[i].y == this.touchPositions[0].y ? true : false;
                let isSecondTouchPos: boolean = posArray[i].x == this.touchPositions[1].x && posArray[i].y == this.touchPositions[1].y ? true : false;
                this.cells[posArray[i].x][posArray[i].y].toDie();
                this._createEffectInstance(this.boomPrefab, cc.p(posArray[i].y, posArray[i].x))
                continue;
            }
        }

        this._addEffectInstanceAndPlay();
        if(posArray.length >2){
            await this._waitTime(mapConfig.ANIMATE_TIMES.TO_DIE);
        }
    }

    /**
     * 生成特效实例
     * @param prefab    特效预制
     * @param pos   特效位置
     */
    private _createEffectInstance(prefab: cc.Prefab, pos: cc.Vec2){
        let effect = new Effect(prefab)
        this._setPos(cc.p(pos.x, pos.y), effect.effectNode);
        let position = effect.effectNode.getPosition();
        effect.effectNode.setPosition(position.x, position.y -mapConfig.HEIGHT_SKEW);
        this.effects.push(effect);
    }

    /**
     * 按指定位置和类型生成新元素
     * @param pos 
     * @param newType 
     */
    private _createElem(pos: cc.Vec2, newElemType: number, newStatus: number): cc.Node {
        let elemIndex: number = 0;      //获取存放资源的数组里，所需元素的下标
        for (let temp = 0; temp < this.defaultElems.length; temp++) {
            if (newElemType == Number(this.defaultElems[temp].name)) {
                elemIndex = temp;
                break;
            } 
        }
        let elem: cc.Node = cc.instantiate(this.defaultElems[elemIndex]);
        elem.addComponent(MovableElem);
        elem.getComponent('MovableElem').type = newElemType;

        this.node.addChild(elem);

        this._setPos(cc.p(pos.y,pos.x), elem);
        this.cells[pos.x][pos.y].elemStack[ this.cells[pos.x][pos.y].elemStack.length -1] = elem;

        this.cells[pos.x][pos.y].topElemType = newElemType;
        this.cells[pos.x][pos.y].isTopElemCanMove = true;
        this.cells[pos.x][pos.y].isTopElemCanDestroy = true;
        this.cells[pos.x][pos.y].topElemStatus = newStatus;

        return elem;
    }

    /**
     * 生成隐藏元素并设置到指定位置
     * @param pos 
     * @param newType 
     */
    private _createHidingElem(pos: cc.Vec2, newElemType: number, newStatus: number): cc.Node {
        let elemIndex: number = 0;      //获取存放资源的数组里，所需元素的下标
        for (let temp = 0; temp < this.defaultElems.length; temp++) {
            if (newElemType == Number(this.defaultElems[temp].name)) {
                elemIndex = temp;
                break;
            } 
        }
        let elem: cc.Node = cc.instantiate(this.defaultElems[elemIndex]);
        elem.addComponent(MovableElem);
        elem.getComponent('MovableElem').type = newElemType;
        elem.getComponent(MovableElem).isHiddenElem = true;

        this.node.addChild(elem);

        this._setPos(cc.p(pos.y,pos.x), elem);
        return elem;
    }


    /**
     * 循环检查下落
     */
    private  _moveDown() {
        let isLoop: boolean = false;
        //计算下落元素位置
        while(true){
            let isSearchMoveDownElemEnded: boolean = true;
            for (let i = mapConfig.X_NUMBER-1; i>=0; i--) {
                let isComeBackCheck: boolean = false;
                for (let j= mapConfig.Y_NUMBER-1; j>=0; j--) {

                //TODO  为什么从右检查下落抖动不正常
                // for (let j= 0; j<=mapConfig.Y_NUMBER-1; j++) {

                    if(!this.cells[i][j]){
                        continue;
                    }
                    //格子存在，且顶部元素为null
                    if(this.cells[i][j] && this.cells[i][j].getTopElemInfo()[0] == null) {
                        let isRightPosHasCell: boolean = (j+1 <= mapConfig.Y_NUMBER-1 && this.cells[i][j+1]) ? true : false;
                        let isRightPosTopElemNotNull: boolean = isRightPosHasCell && this.cells[i][j+1].getTopElemInfo()[0] != null ? true : false;

                        //旁边有格子，但是格子顶层为null
                        if( isRightPosHasCell && !isRightPosTopElemNotNull) {
                            // cc.log(`位置，${i},${j},旁边有格子，但是格子顶层为null`)
                            isSearchMoveDownElemEnded = false;
                            isComeBackCheck = true;
                            continue;
                        }

                        //右边有格子并且格子顶层有元素   或者  右部没有格子
                        if ((isRightPosHasCell &&  isRightPosTopElemNotNull) || !isRightPosHasCell) {
                            let moveDownElemInfo: [cc.Node, cc.Vec2, [cc.Vec2, number], cc.Vec2[]] = this._searchForMoweDownElem(cc.p(i,j));      //查找下落的元素信息
                            if(moveDownElemInfo === null){      //该位置没有可下落的，跳过
                                if(i==8 ){
                                }
                                continue;
                            }
                            let path = Vec2Util.removeRepeatItem(moveDownElemInfo[3]);

                            let elemScript = moveDownElemInfo[0].getComponent(MovableElem);
                            //预交换位置
                            if (elemScript.isHiddenElem == false) {
                                //预交换位置（只交换格子绑定，不进行视图更新）
                                this.cells[i][j].addElem(moveDownElemInfo[0]);
                                this.cells[moveDownElemInfo[1].x][moveDownElemInfo[1].y].changeTopElemToNull();
                            }else{
                                //将是否是隐藏元素的属性改为false,并显示
                                elemScript.isHiddenElem = false;
                                //添加到对应的格子内， 并更新隐藏元素数组
                                this.cells[i][j].addElem(moveDownElemInfo[0]);     
                                this.hiddenElems[moveDownElemInfo[2][0].y][moveDownElemInfo[2][1]] = null;
                                
                            }
                            elemScript.isPreToMoveDown = true;       //将需要下落的元素进行标记
                            isSearchMoveDownElemEnded = false;      //是否继续计算查找元素的标识

                            this.cells[i][j].addMoveByPathAction(path);
                        }
                    
                    
                     }
                }
                if (isComeBackCheck) {  //某一行计算完成之后返回重新检查
                    i = mapConfig.X_NUMBER-1;
                }
            }
            if(isSearchMoveDownElemEnded){  //全部计算完成，跳出循环
                break;
            }
        }


    }
    
    /**
     * 获取对角线（只有左上，和右上）可移动元素的位置
     * @param position 
     */
    private _getDiagonalMovableCellPos(position: cc.Vec2): cc.Vec2[] {
        let result: cc.Vec2[] = [];
        let checkPos1: cc.Vec2 = cc.p(position.x - 1, position.y - 1);      //左上角位置
        let checkPos2: cc.Vec2 = cc.p(position.x - 1, position.y + 1);      //右上角位置

        let check = (pos: cc.Vec2) => {
            let isPosExist = (pos.x >= 0 && pos.x <= mapConfig.Y_NUMBER-1 && this.cells[pos.x][pos.y]) ? true : false;
            let isPosCanMove = (isPosExist && this.cells[pos.x][pos.y].getTopElemInfo()[0] && this.cells[pos.x][pos.y].getTopElemIsCanMove() ) ? true : false;
            let isTopElemNull = isPosExist && this.cells[pos.x][pos.y].getTopElemInfo()[0] == null;

            return isPosExist && (isPosCanMove || isTopElemNull)
        }
        //左上位置检查
        if ( check(checkPos1)) {
            result.push(checkPos1);
        }
        //右上位置检查
        if ( check(checkPos2)) {
            result.push(checkPos2);
        }
        return result;
    }

    /**
     * 检查获取某一指定位置最近的可下落到该位置的元素
     * 自动寻找下落元素的算法
     * @param pos 指定位置  
     * @returns [下落元素， 地图元素坐标, [隐藏元素在列的正常顶部元素坐标，所在列的下标], 下落路径]
     */
    private _searchForMoweDownElem(position: cc.Vec2): [cc.Node, cc.Vec2, [cc.Vec2, number], cc.Vec2[] ] {
        let path: cc.Vec2[] = [];   //移动的路径
        let upSearch = (pos) => {
            for (let i = pos.x; i >=0; i-- ) {
                //检查到列顶部
                let colTopCellPos = this._getTopCell(pos.y)[1];
                if ( i == colTopCellPos.x  &&  i <= 0) {       
                    //检查隐藏元素
                    if (this.cells[pos.x][pos.y].getTopElemInfo()[0] !=  null &&  this.cells[pos.x][pos.y].getTopElemInfo()[0].getComponent(MovableElem).isPreToMoveDown == false ) {
                        path.unshift( this.cells[pos.x][pos.y].getPosition() )
                        return [this.cells[pos.x][pos.y].getTopElemInfo()[0],pos, null, path];
                    } else {
                        let colHiddenElems: cc.Node[] = this.hiddenElems[pos.y] ;   //该列的所有隐藏元素
                        for (let k=0; k<= colHiddenElems.length-1; k++) {
                            if(colHiddenElems[k] == null){
                                continue ;
                            }else{
                                path.unshift(colHiddenElems[k].getPosition());     //最后一个锚点
                                return [colHiddenElems[k], colHiddenElems[k].getPosition(), [colTopCellPos ,k], path];
                            }
                        }
                    }
                    cc.log('隐藏元素不够用')
                }
    
                //检查到列中部，有空白区域 或者 有不可移动障碍物
                let isUpperPosExist: boolean = (i-1 >= 0 && this.cells[i-1][pos.y]) ? true : false; 
                let isUpperPosHasTopElem: boolean = (isUpperPosExist  && i-1 >= 0 && this.cells[i-1][pos.y].getTopElemInfo[0] != null) ? true : false; 
                let isUpperPosTopElemCanMove: boolean = (isUpperPosHasTopElem && i-1 >= 0 && this.cells[i-1][pos.y].getTopElemIsCanMove()) ? true : false ;

                if ( !isUpperPosExist ||  (isUpperPosHasTopElem && !isUpperPosTopElemCanMove) ) {
                    let nextPos: cc.Vec2 = null;

                    //检查对角线位置是否在移动路径上
                    let diagonalResult = this._getDiagonalMovableCellPos(cc.p(i, pos.y));
                    if ( diagonalResult.length == 0 ) {
                        return null;
                    } else if ( diagonalResult.length == 1 ) {
                        nextPos = diagonalResult[0];
                    }else  {
                        if (pos.x <=4 ) {
                            nextPos = diagonalResult[0];
                        }else{
                            nextPos = diagonalResult[1];
                        }
                    }

                    if(nextPos.x >= 0 && nextPos.x <= mapConfig.X_NUMBER-1 && nextPos.y >= 0 && nextPos.y <= mapConfig.Y_NUMBER-1){

                        if ( this.cells[nextPos.x][nextPos.y].getTopElemInfo()[0] && this.cells[nextPos.x][nextPos.y].getTopElemIsCanMove()) {
                            let topElem = this.cells[nextPos.x][nextPos.y].getTopElemInfo()[0];
                            topElem.getComponent(MovableElem).isPreToMoveDown = true;   //将其下落表示改为true
                            path.unshift(this.cells[nextPos.x][nextPos.y].getPosition())
                            
                            return [topElem, cc.p(nextPos.x,nextPos.y), null, path]
                        }

                        path.unshift(this.cells[nextPos.x][nextPos.y].getPosition() )
                        return  upSearch(nextPos);
                    }else{
                        continue;
                    }
                }
                
                //检查到列中部，直接遇到可下落的元素
                if ( i-1 >= 0 ) {
                    if ( this.cells[i-1][pos.y].getTopElemInfo()[0] && this.cells[i-1][pos.y].getTopElemIsCanMove()) {
                        let topElem = this.cells[i-1][pos.y].getTopElemInfo()[0];
                        topElem.getComponent(MovableElem).isPreToMoveDown = true;   //将其下落表示改为true
                        path.unshift(this.cells[i-1][pos.y].getPosition())
                        
                        return [topElem, cc.p(i-1,pos.y), null, path]
                    }
                    else{
                        path.unshift(this.cells[i-1][pos.y].getPosition())
                    }
                } else {
                    cc.log('特殊情况，未计算到')
                }

            }
        }
        path.unshift(this.cells[position.x][position.y].getPosition());     //添加将来下落的路径终点
        return upSearch(position);
    }


    /**
     * 清空所有元素的下落标记属性
     */
    private _cleanMoveDownMark(){
        //清除地图上顶层元素的标记属性
        for (let i=0; i<= mapConfig.X_NUMBER-1; i++) {
            for (let j= 0; j<= mapConfig.Y_NUMBER-1; j++) {
                if (!this.cells[i][j]) {
                    continue;
                }
                let topElem: cc.Node = this.cells[i][j].getTopElemInfo()[0];
                if(topElem == null){
                    continue;
                }
                if(topElem.getComponent(MovableElem) != null){
                    let script = topElem.getComponent(MovableElem);
                    script.isPreToMoveDown = false;
                    
                }
            }
        }

    }

    /**
     * 获取每行最上层的格子
     * @returns [Cell, cc.Vec2]  格子  格子所在坐标
     */
    private _getTopCell(col: number): [Cell, cc.Vec2]{
        let topCell: Cell = null;
        let pos: cc.Vec2 = null;
        for(let i= 0; i<mapConfig.X_NUMBER; i++){
            if(!this.cells[i][col]){
                continue;
            }else{
                topCell = this.cells[i][col];
                pos = cc.p(i,col); 
                break;
            }
        }
        return [topCell,pos];
    }

    /**
     * 处理点击位置，的均为点击的情况
     * @returns 是否均是点击且相邻  
     */
    private _isPosAdjacent(pos1: cc.Vec2, pos2: cc.Vec2): boolean{
        if ( pos1.x == pos2.x) { //同1行
            let delta = pos1.y - pos2.y;
            if ( Math.abs(delta) == 1) {
                return true;
            } 
        } 
        if ( pos1.y == pos2.y) { //同1列
            let delta = pos1.x - pos2.x;
            if ( Math.abs(delta) == 1) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * 游戏主要操作逻辑
     */
    private async _mainOperate() {
        if (!this._isTwoPosCanMove(this.touchPositions[0], this.touchPositions[1]) ) {
            this.touchPositions = [];    //触摸位置复原
            this.effects = [];  //复原特效实例数组
            return ;
        }
        
        this.isPlayingAnimate = true;
        
        //将返回的数组去重，然后将去重后的数组进行销毁
        await  this._getCrushResult(this.touchPositions[0], this.touchPositions[1]);

        //更新视图
        this._moveDown();
        let updateViewTime: number =this._updateCellsView();
        if(updateViewTime > 0){
            await this._waitTime(updateViewTime);        //更新并等待时间
            await this._waitTime(0.2);        //更新并等待时间
            this._addEffectInstanceAndPlay();

        }

        //元素下落并更新格子视图
        let moveDownAndUpdateCellView = async ()=>{
            this._moveDown();
            let updateViewTime: number =this._updateCellsView();
            if(updateViewTime > 0){
                await this._waitTime(updateViewTime);        //更新并等待时间
                this._addEffectInstanceAndPlay();
            }
            this._updateHiddenELems();
            this._cleanMoveDownMark();  //清除标记
        }
        
        //循环消除、下落，更新视图 直至结束
        while(true){
            this.autoCrushTimes ++;
            await moveDownAndUpdateCellView();
            let isAutoCrushLoop: Boolean = false;
            isAutoCrushLoop = await  this._autoCrush();    //自动消除
            this._addEffectInstanceAndPlay();   //生成特效

            await moveDownAndUpdateCellView();  //更新视图

            if(!isAutoCrushLoop ) {
                let isMixed: boolean = await this._mixUpCheck();   //打乱检查
                if(!isMixed){   //不需要打乱
                    break;
                }
            }else{
                DoubleHitGuidePlayer.recordOrdinaryTimes();
                this._addEffectInstanceAndPlay();
            }
        }

        this.sendAnimationEndEvent();   //发送动画结束事件
        
        //播放引导
        DoubleHitGuidePlayer.play();
        
        //重置
        this.isPlayingAnimate = false;
        this.touchPositions = [];    //触摸位置复原
        this.effects = [];  //复原特效实例数组
        this.autoCrushTimes = 0;    //复原自动消除次数
    }

    /**
     * 打乱混淆检查
     * @returns 是否有进行混淆打乱
     */
    private async _mixUpCheck(): Promise<boolean>{
        let isNeedToMixUp: boolean = this._isCellsCanMoveToCrush();
        //没有可移动的元素了，就打乱
        if(!isNeedToMixUp){
            let mixAttetion: cc.Node = new cc.Node();
            let label = mixAttetion.addComponent(cc.Label);
            label.string = '没有可以消除的元素了';
            this.node.addChild(mixAttetion)

            //显示提示
            await this._waitTime(1);
            mixAttetion.destroy();

            this._mixUp();
            await this._updateCellsView();
            await this._waitTime(0.5);  //交换之后若有相连元素，有足够时间使用户可以看到相连的元素，不会直接消失
            return true;
        }
        return false
    }

    /**
     * 清除点击动画
     */
    private _cleanClickAnimation(){
        for(let i=0;i<= mapConfig.X_NUMBER-1; i++){
            for(let j=0; j<= mapConfig.Y_NUMBER-1; j++){
                if(!this.cells[i][j]){
                    continue ;
                }
                if(this.cells[i][j].topElemStatus == mapConfig.ELEM_STATUS.CLICK){
                    //清除动画
                    this.cells[i][j].setSlect(false);
                }
                this.cells[i][j].elemStack[1].active = false;
            }
        }
    }
  
    /**
     * 将特效实例添加到特效层，并将其播放
     */
    private async _addEffectInstanceAndPlay(){
        let script: EffectLayer = this.node.parent.getChildByName('effectLayer').getComponent('effectLayer');

        script.addEffectInstances(this.effects);
        script.playEffects();
        
        this.effects = [];  //复原特效实例数组
    }

      /**
     * 根据2个制定位置，获取可以消除的坐标数组
     * @param pos1 
     * @param pos2 
     * @returns 影响范围的坐标数组
     */
    private async  _getCrushResult(pos1: cc.Vec2, pos2: cc.Vec2){
        let result: cc.Vec2[] = null;
        let twoElemType = this._getTwoElemEffectType(pos1, pos2);

        //'普通操作
        if (twoElemType == mapConfig.TWO_ELEM_TYPE.BOTH_COMMON_ELEM || twoElemType == mapConfig.TWO_ELEM_TYPE.ONE_EFFECT_ONE_COMMON) {
            // cc.log('普通操作')
            await  this._normalTouchLogic();
            return ;
        }
        //特效叠加
        if (twoElemType != mapConfig.TWO_ELEM_TYPE.BOTH_COMMON_ELEM && twoElemType != mapConfig.TWO_ELEM_TYPE.ONE_EFFECT_ONE_COMMON && twoElemType != mapConfig.TWO_ELEM_TYPE.ONE_MAGIC_ONE_COMMON) {
            // cc.log('特效叠加')
            let firstCell: Cell = this.cells[ pos1.x ][ pos1.y ];
            let secondCell: Cell = this.cells[ pos2.x ][ pos2.y ];
            await firstCell.moveTo(secondCell);
            await this._waitTime(mapConfig.ANIMATE_TIMES.DESTROY_DELAY);

            let result = await this._effectSupperposition(pos2, pos1);
            await this._destroyElem(result);
            return;
            
        }
         //一个魔力鸟，1个普通元素
        if (twoElemType == mapConfig.TWO_ELEM_TYPE.ONE_MAGIC_ONE_COMMON) {
            DoubleHitGuidePlayer.recordOrdinaryMagicTimes();
            MusicManager.playRuntimeMusic(this.magicMusic);   //播放音效
            let pos1TopStatus: number = this.cells[pos1.x][pos1.y].getTopElemStatus();
            let type: number = pos1TopStatus == mapConfig.ELEM_STATUS.MAGIC ? this.cells[pos2.x][pos2.y].getTopElemType() : this.cells[pos1.x][pos1.y].getTopElemType();
            let result:cc.Vec2[] = this._getAllPosWithOneType(type);
            for (let i=0; i<= result.length-1; i++) {
                this.cells[result[i].x][result[i].y].addMagicShakeAction();
            }

            //交换位置
            let firstCell: Cell = this.cells[ pos1.x ][ pos1.y ];
            let secondCell: Cell = this.cells[ pos2.x ][ pos2.y ];
            await firstCell.moveTo(secondCell);
            
            //更新视图
            await this._waitTime(this._updateCellsView());
            await this._waitTime(mapConfig.ANIMATE_TIMES.MAGIC_SHAKE);

            result.push(pos1);
            result.push(pos2);
            
            let deltaScore = Score.calculateEffectCrush(result, mapConfig.SCORE_TYPE.MAGIC, 0)
            let pos: cc.Vec2 = Vec2Util.getTopestAndLefestItemFromArray(result);
            this._addScore(deltaScore, pos, this.cells[pos.x][pos.y].getTopElemType());
            await this._destroyElem(result);
        }
    }

    /**
     * 获取指定2个元素的消除类型
     * @param pos1 
     * @param pos2 
     * @returns 消除类型 
     */
    private _getTwoElemEffectType(pos1: cc.Vec2, pos2: cc.Vec2): number{
        let status1: number = this.cells[pos1.x][pos1.y].getTopElemStatus();
        let status2: number = this.cells[pos2.x][pos2.y].getTopElemStatus();

        // cc.log('2个状态：', status1, status2)
        let oneComOneMagic: boolean = ((status1 == mapConfig.ELEM_STATUS.MAGIC && status2 == mapConfig.ELEM_STATUS.COMMON ) || (status2 == mapConfig.ELEM_STATUS.MAGIC && status1 == mapConfig.ELEM_STATUS.COMMON ))? true: false;
        let oneClickOneMagic: boolean = ((status1 == mapConfig.ELEM_STATUS.MAGIC && status2 == mapConfig.ELEM_STATUS.CLICK ) || (status2 == mapConfig.ELEM_STATUS.MAGIC && status1 == mapConfig.ELEM_STATUS.CLICK ))? true: false;
        if (oneComOneMagic || oneClickOneMagic) {
            return mapConfig.TWO_ELEM_TYPE.ONE_MAGIC_ONE_COMMON;
        }

        let bothCommon: boolean = (status1 == status2 && status1 == mapConfig.ELEM_STATUS.COMMON)? true: false;
        let bothClick: boolean = (status1 == status2 && status1 == mapConfig.ELEM_STATUS.CLICK)? true: false;
        let oneComOneClick: boolean =((status1 == mapConfig.ELEM_STATUS.COMMON && status2 == mapConfig.ELEM_STATUS.CLICK) || (status1 == mapConfig.ELEM_STATUS.CLICK && status2 == mapConfig.ELEM_STATUS.COMMON))? true: false;
        if ( bothClick || bothCommon || oneComOneClick) {
            // cc.log('2点都是普通元素');
            return mapConfig.TWO_ELEM_TYPE.BOTH_COMMON_ELEM;
        }

        let oneComOneEffect: boolean = ((status1 == mapConfig.ELEM_STATUS.COMMON  && status2 != mapConfig.ELEM_STATUS.COMMON && status2 != mapConfig.ELEM_STATUS.CLICK)
                                        || (status2 == mapConfig.ELEM_STATUS.COMMON  && status1 != mapConfig.ELEM_STATUS.COMMON && status1 != mapConfig.ELEM_STATUS.CLICK))? true: false;
        let oneClickOneEffect: boolean = ((status1 == mapConfig.ELEM_STATUS.CLICK  && status2 != mapConfig.ELEM_STATUS.COMMON && status2 != mapConfig.ELEM_STATUS.CLICK)
                                        || (status2 == mapConfig.ELEM_STATUS.CLICK  && status1 != mapConfig.ELEM_STATUS.COMMON && status1 != mapConfig.ELEM_STATUS.CLICK))? true : false;
        if (oneComOneEffect || oneClickOneEffect) {
            // cc.log('1个普通元素，1个特效');
            return mapConfig.TWO_ELEM_TYPE.ONE_EFFECT_ONE_COMMON;
        }

        if ((status1 != mapConfig.ELEM_STATUS.COMMON && status1 != mapConfig.ELEM_STATUS.CLICK) && (status2 != mapConfig.ELEM_STATUS.COMMON && status2 != mapConfig.ELEM_STATUS.CLICK)) {
            // cc.log('2个特效，特效叠加');
            if( (status1 == mapConfig.ELEM_STATUS.ROW || status1 == mapConfig.ELEM_STATUS.COLUMN) && ( status2 == mapConfig.ELEM_STATUS.ROW || status2 == mapConfig.ELEM_STATUS.COLUMN )) {
                return mapConfig.TWO_ELEM_TYPE.LINE_AND_LINE;       //直线叠加
            }
            if( ((status1 == mapConfig.ELEM_STATUS.COLUMN || status1 == mapConfig.ELEM_STATUS.ROW ) && status2 == mapConfig.ELEM_STATUS.WRAP) || ((status2 == mapConfig.ELEM_STATUS.COLUMN || status2 == mapConfig.ELEM_STATUS.ROW ) && status1 == mapConfig.ELEM_STATUS.WRAP)) {
                return mapConfig.TWO_ELEM_TYPE.LINE_AND_WRAP;   //直线+ 爆炸
            }
            if( ((status1 == mapConfig.ELEM_STATUS.COLUMN || status1 == mapConfig.ELEM_STATUS.ROW ) && status2 == mapConfig.ELEM_STATUS.MAGIC) || ((status2 == mapConfig.ELEM_STATUS.COLUMN || status2 == mapConfig.ELEM_STATUS.ROW ) && status1 == mapConfig.ELEM_STATUS.MAGIC)) {
                return mapConfig.TWO_ELEM_TYPE.LINE_AND_MAGIC;   //直线+ 魔力鸟
            }
            if( status1 == mapConfig.ELEM_STATUS.WRAP && status2 == mapConfig.ELEM_STATUS.WRAP ) {
                return mapConfig.TWO_ELEM_TYPE.WRAP_AND_WRAP;   //爆炸+ 爆炸
            }
            if( (status1 == mapConfig.ELEM_STATUS.WRAP  && status2 == mapConfig.ELEM_STATUS.MAGIC ) ||  (status2 == mapConfig.ELEM_STATUS.WRAP || status1 == mapConfig.ELEM_STATUS.MAGIC) ){
                return mapConfig.TWO_ELEM_TYPE.WRAP_AND_MAGIC;       //直线+ 魔力鸟
            }
            if( status1 == mapConfig.ELEM_STATUS.MAGIC  && status2 == mapConfig.ELEM_STATUS.MAGIC ){
                return mapConfig.TWO_ELEM_TYPE.MAGIC_AND_MAGIC;       //魔力鸟+ 魔力鸟
            }
        }

        cc.log('未进入判断：', status1, status2)
    }

    /**
     * 计算2个特效元素的特效叠加后的影响范围
     * @param pos1 
     * @param pos2 
     * @returns 影响范围的坐标数组
     */
    private async _effectSupperposition(pos1: cc.Vec2, pos2: cc.Vec2): Promise<cc.Vec2[]> {
        let status1: number = this.cells[pos1.x][pos1.y].getTopElemStatus();
        let status2: number = this.cells[pos2.x][pos2.y].getTopElemStatus();

        let result: cc.Vec2[] = [];
        //行 + 行
        if (status1 == mapConfig.ELEM_STATUS.ROW && status2 == mapConfig.ELEM_STATUS.ROW) {
            MusicManager.playRuntimeMusic(this.rowColCrushMusic);   //播放音效

            DoubleHitGuidePlayer.recordEffectsTimes();
            
            let result1 = this._getCurrentPosRowRange(pos1);
            let result2 = this._getCurrentPosRowRange(pos2);
            result = result1.concat(result2);
            this._createEffectInstance(this.rowCrush, cc.p(pos1.y, pos1.x));
            this._createEffectInstance(this.rowCrush, cc.p(pos2.y, pos2.x));

            //计算得分
            let deltaScore = Score.calculateEffectCrush(result, mapConfig.SCORE_TYPE.LINE_AND_LINE, 0);
            let pos: cc.Vec2 = Vec2Util.getTopestAndLefestItemFromArray(result);
            this._addScore(deltaScore, pos, this.cells[pos.x][pos.y].getTopElemType());

            return result;
            
        }
        //行 + 列
        if ((status1 == mapConfig.ELEM_STATUS.ROW && status2 == mapConfig.ELEM_STATUS.COLUMN) || (status2 == mapConfig.ELEM_STATUS.ROW && status1 == mapConfig.ELEM_STATUS.COLUMN)) {
            MusicManager.playRuntimeMusic(this.rowColCrushMusic);   //播放音效
            DoubleHitGuidePlayer.recordEffectsTimes();
            let result1 = this._getCurrentPosRowRange(pos1);
            let result2 = this._getCurrentPosColRange(pos2);
            result = result1.concat(result2);

            this._createEffectInstance(this.rowCrush, cc.p(pos1.y, pos1.x));
            this._createEffectInstance(this.colCrush, cc.p(pos2.y, pos2.x));

            //计算得分
            let deltaScore = Score.calculateEffectCrush(result, mapConfig.SCORE_TYPE.LINE_AND_LINE, 0);
            let pos: cc.Vec2 = Vec2Util.getTopestAndLefestItemFromArray(result);
            this._addScore(deltaScore, pos, this.cells[pos.x][pos.y].getTopElemType());
            
            return result;
        }
        //列 + 列
        if (status1 == mapConfig.ELEM_STATUS.COLUMN && status2 == mapConfig.ELEM_STATUS.COLUMN) {
            MusicManager.playRuntimeMusic(this.rowColCrushMusic);   //播放音效
            DoubleHitGuidePlayer.recordEffectsTimes();
            let result1 = this._getCurrentPosColRange(pos1);
            let result2 = this._getCurrentPosColRange(pos2);
            result = result1.concat(result2);
            this._createEffectInstance(this.colCrush, cc.p(pos1.y, pos1.x));
            this._createEffectInstance(this.colCrush, cc.p(pos2.y, pos2.x));

            //计算得分
            let deltaScore = Score.calculateEffectCrush(result, mapConfig.SCORE_TYPE.LINE_AND_LINE, 0);
            let pos: cc.Vec2 = Vec2Util.getTopestAndLefestItemFromArray(result);
            this._addScore(deltaScore, pos, this.cells[pos.x][pos.y].getTopElemType());
           
            return result;

        }
        //行 + 爆炸
        if ((status1 == mapConfig.ELEM_STATUS.WRAP && status2 == mapConfig.ELEM_STATUS.ROW) ||(status2 == mapConfig.ELEM_STATUS.WRAP && status1 == mapConfig.ELEM_STATUS.ROW)) {
            MusicManager.playRuntimeMusic(this.wrapMusic);   //播放音效
            MusicManager.playRuntimeMusic(this.rowColCrushMusic);   //播放音效
            DoubleHitGuidePlayer.recordEffectsTimes();
            let boomResult = this._getCurrentPosWrapRange(pos1);
            result = result.concat(boomResult);
            for(let i= 0; i<= boomResult.length-1; i++){
                let rowResult = this._getCurrentPosRowRange(boomResult[i]);
                result = result.concat(rowResult);
                let colEffect = this._createEffectInstance(this.rowCrush, cc.p(boomResult[i].y, boomResult[i].x));
            }

            //计算得分
            let deltaScore = Score.calculateEffectCrush(result, mapConfig.SCORE_TYPE.LINE_AND_WRAP, 0);
            let pos: cc.Vec2 = Vec2Util.getTopestAndLefestItemFromArray(result);
            this._addScore(deltaScore, pos, this.cells[pos.x][pos.y].getTopElemType());
            
            return result;
        }
        //列 + 爆炸
        if ((status1 == mapConfig.ELEM_STATUS.WRAP && status2 == mapConfig.ELEM_STATUS.COLUMN) || (status2 == mapConfig.ELEM_STATUS.WRAP && status1 == mapConfig.ELEM_STATUS.COLUMN)) {
            MusicManager.playRuntimeMusic(this.wrapMusic);   //播放音效
            MusicManager.playRuntimeMusic(this.rowColCrushMusic);   //播放音效
            DoubleHitGuidePlayer.recordEffectsTimes();
            let boomResult = this._getCurrentPosWrapRange(pos1);
            result = result.concat(boomResult);
            for(let i= 0; i<= boomResult.length-1; i++){
                let colResult = this._getCurrentPosColRange(boomResult[i]);
                result = result.concat(colResult);
                let colEffect = this._createEffectInstance(this.colCrush, cc.p(boomResult[i].y, boomResult[i].x));
            }

            //计算得分
            let deltaScore = Score.calculateEffectCrush(result, mapConfig.SCORE_TYPE.LINE_AND_WRAP, 0);
            let pos: cc.Vec2 = Vec2Util.getTopestAndLefestItemFromArray(result);
            this._addScore(deltaScore, pos, this.cells[pos.x][pos.y].getTopElemType());
            
            return result;
        }
        //爆炸 + 爆炸
        if (status1 == mapConfig.ELEM_STATUS.WRAP && status2 == mapConfig.ELEM_STATUS.WRAP) {
            MusicManager.playRuntimeMusic(this.wrapMusic);   //播放音效
            MusicManager.playRuntimeMusic(this.wrapMusic);   //播放音效
            DoubleHitGuidePlayer.recordEffectsTimes();
            for(let i = pos2.x-1; i<= pos2.x+1; i++){
                for(let j = pos2.y-2; j<= pos2.y +2; j++){
                    if(i < 0 || i > mapConfig.Y_NUMBER-1  || j < 0|| j > mapConfig.X_NUMBER-1 ){
                        continue;
                    }
                    if (!this.cells[i][j]) {
                        continue;
                    }
                    result.push(cc.p(i, j))
                }
            }
            for(let i = pos2.x-2; i<= pos2.x+2; i++){
                for(let j = pos2.y-1; j<= pos2.y +1; j++){
                    if(i < 0 || i > mapConfig.Y_NUMBER-1  || j < 0|| j > mapConfig.X_NUMBER-1 ){
                        continue;
                    }
                    if (!this.cells[i][j]) {
                        continue;
                    }
                    result.push(cc.p(i, j))
                }
            }
            //4个顶点
            let vertexs: cc.Vec2[] = [cc.p(pos2.x-3, pos2.y), cc.p(pos2.x+3,pos2.y), cc.p(pos2.x, pos2.y-3), cc.p(pos2.x, pos2.y+3)]
            for(let i in vertexs){
                if(vertexs[i].x < 0 || vertexs[i].x > mapConfig.Y_NUMBER-1 || vertexs[i].y <0 || vertexs[i].y >mapConfig.X_NUMBER-1) {
                    continue;
                }
                if(!this.cells[vertexs[i].x][ vertexs[i].y]) {
                    continue;
                }
                result.push(vertexs[i])
            }
    
               //计算得分
            let deltaScore = Score.calculateEffectCrush(result, mapConfig.SCORE_TYPE.WRAP_AND_WRAP, 0);
            let pos: cc.Vec2 = Vec2Util.getTopestAndLefestItemFromArray(result);
            this._addScore(deltaScore, pos, this.cells[pos.x][pos.y].getTopElemType());
            
            return result;
        }
        //行 + 魔力鸟
        if ((status1 == mapConfig.ELEM_STATUS.ROW && status2 == mapConfig.ELEM_STATUS.MAGIC) || (status2 == mapConfig.ELEM_STATUS.ROW && status1 == mapConfig.ELEM_STATUS.MAGIC)) {
            MusicManager.playRuntimeMusic(this.magicMusic);   //播放音效
            MusicManager.playRuntimeMusic(this.rowColCrushMusic);   //播放音效
            DoubleHitGuidePlayer.recordOrdinaryMagicTimes();
            cc.log('行+ 魔力鸟')
            let rowChangeElems: cc.Vec2[] = [];
            let colChangeElems: cc.Vec2[] = [];
            
            //判断哪个是魔力鸟
            let magicPos: cc.Vec2 = null;
            let rowPos: cc.Vec2 = null;
            if(status1 == mapConfig.ELEM_STATUS.MAGIC){
                magicPos = pos1;
                rowPos = pos2;
            }else{
                magicPos = pos2;
                rowPos = pos1;
            }
            let targetType: number = this.cells[rowPos.x][rowPos.y].getTopElemType();
 
            //计算特效范围
            for(let i=0; i<= mapConfig.X_NUMBER-1; i++) {
                for(let j=0; j<= mapConfig.Y_NUMBER-1; j++) {
                    if (!this.cells[i][j]) {
                        continue;
                    }
                    let elemType = this.cells[i][j].getTopElemType();
                    if(elemType == targetType){
                        //随之生成行列特效
                        let crushType: number = this._getRandomCrushType();
                        //行特效
                        if( crushType == 0){
                            rowChangeElems.push(cc.p(i,j));
                            let elem = this.cells[i][j].getTopElemInfo()[0];    
                            let animation = elem.getComponent(cc.Animation);
                            animation.play(animation.getClips()[1].name);
    
                            let colEffect = this._createEffectInstance(this.rowCrush, cc.p(j,i));   
                            continue;
                        }
                        //列特效
                        colChangeElems.push(cc.p(i,j));
                        let elem = this.cells[i][j].getTopElemInfo()[0];    
                        let animation = elem.getComponent(cc.Animation);
                        animation.play(animation.getClips()[2].name);
                        let colEffect = this._createEffectInstance(this.colCrush, cc.p(j,i));       //生成特效实例
                    }
                }
            }

            await this._waitTime(mapConfig.ANIMATE_TIMES.SHOW_EFFECT_TIME);
            for(let i=0; i<= rowChangeElems.length-1; i++) {
                let rowResult = this._getCurrentPosRowRange(rowChangeElems[i]);
                result = result.concat(rowResult);
            }
            for(let i=0; i<= colChangeElems.length-1; i++) {
                let rowResult = this._getCurrentPosColRange(colChangeElems[i]);
                result = result.concat(rowResult);
            }

            //计算得分
            let deltaScore = Score.calculateEffectCrush(result, mapConfig.SCORE_TYPE.LINE_AND_MAGIC, 0);
            let pos: cc.Vec2 = Vec2Util.getTopestAndLefestItemFromArray(result);
            this._addScore(deltaScore, pos, this.cells[pos.x][pos.y].getTopElemType());
            
            return result;
        }
        //列 + 魔力鸟
        if ((status1 == mapConfig.ELEM_STATUS.COLUMN && status2 == mapConfig.ELEM_STATUS.MAGIC) || (status2 == mapConfig.ELEM_STATUS.COLUMN && status1 == mapConfig.ELEM_STATUS.MAGIC)) {
            MusicManager.playRuntimeMusic(this.magicMusic);   //播放音效
            MusicManager.playRuntimeMusic(this.rowColCrushMusic);   //播放音效
            DoubleHitGuidePlayer.recordOrdinaryMagicTimes();
            cc.log('列+ 魔力鸟')
            let rowChangeElems: cc.Vec2[] = [];
            let colChangeElems: cc.Vec2[] = [];

            //判断哪个是魔力鸟
            let magicPos: cc.Vec2 = null;
            let colPos: cc.Vec2 = null;
            if(status1 == mapConfig.ELEM_STATUS.MAGIC){
                magicPos = pos1;
                colPos = pos2;
            }else{
                magicPos = pos2;
                colPos = pos1;
            }

            let targetType: number = this.cells[colPos.x][colPos.y].getTopElemType();

            for(let i=0; i<= mapConfig.X_NUMBER-1; i++) {
                for(let j=0; j<= mapConfig.Y_NUMBER-1; j++) {
                    if (!this.cells[i][j]) {
                        continue;
                    }
                    let elemType = this.cells[i][j].getTopElemType();
                    if(elemType == targetType){
                        //随之生成行列特效
                        let crushType: number = this._getRandomCrushType();
                        if( crushType == 0){    //行特效
                            rowChangeElems.push(cc.p(i,j));
                            let elem = this.cells[i][j].getTopElemInfo()[0];    
                            let animation = elem.getComponent(cc.Animation);
                            animation.play(animation.getClips()[1].name);
                            let colEffect = this._createEffectInstance(this.rowCrush, cc.p(j,i));
                            continue;
                        }
                        //列特效
                        colChangeElems.push(cc.p(i,j));
                        let elem = this.cells[i][j].getTopElemInfo()[0];    //显示动画
                        let animation = elem.getComponent(cc.Animation);
                        animation.play(animation.getClips()[2].name);
                        let colEffect = this._createEffectInstance(this.colCrush, cc.p(j,i));
                    }
                }
            }

           
            await this._waitTime(mapConfig.ANIMATE_TIMES.SHOW_EFFECT_TIME);
            // cc.log('所有同类型元素：', changeElems)
            for(let i=0; i<= rowChangeElems.length-1; i++) {
                let rowResult = this._getCurrentPosRowRange(rowChangeElems[i]);
                result = result.concat(rowResult);
            }
            for(let i=0; i<= colChangeElems.length-1; i++) {
                let rowResult = this._getCurrentPosColRange(colChangeElems[i]);
                result = result.concat(rowResult);
            }
            result.push(pos1);
            result.push(pos2);

            //计算得分
            let deltaScore = Score.calculateEffectCrush(result, mapConfig.SCORE_TYPE.LINE_AND_MAGIC, 0);
            let pos: cc.Vec2 = Vec2Util.getTopestAndLefestItemFromArray(result);
            this._addScore(deltaScore, pos, this.cells[pos.x][pos.y].getTopElemType());
            
           
            return result;

        }
        //爆炸 + 魔力鸟
        if ((status1 == mapConfig.ELEM_STATUS.WRAP && status2 == mapConfig.ELEM_STATUS.MAGIC) || (status2 == mapConfig.ELEM_STATUS.WRAP && status1 == mapConfig.ELEM_STATUS.MAGIC)) {
            MusicManager.playRuntimeMusic(this.wrapMusic);   //播放音效
            MusicManager.playRuntimeMusic(this.magicMusic);   //播放音效
            DoubleHitGuidePlayer.recordOrdinaryMagicTimes();
            cc.log('爆炸+ 魔力鸟')
            let changeElems: cc.Vec2[] = [];
            
            //判断哪个是魔力鸟
            let magicPos: cc.Vec2 = null;
            let wrapPos: cc.Vec2 = null;
            if(status1 == mapConfig.ELEM_STATUS.MAGIC){
                magicPos = pos1;
                wrapPos = pos2;
            }else{
                magicPos = pos2;
                wrapPos = pos1;
            }
            let targetType: number = this.cells[wrapPos.x][wrapPos.y].getTopElemType();

            for(let i=0; i<= mapConfig.X_NUMBER-1; i++) {
                for(let j=0; j<= mapConfig.Y_NUMBER-1; j++) {
                    if (!this.cells[i][j]) {
                        continue;
                    }
                    let elemType = this.cells[i][j].getTopElemType();
                    if(elemType == targetType){
                        changeElems.push(cc.p(i,j));

                        let elem = this.cells[i][j].getTopElemInfo()[0];    //显示动画
                        let animation = elem.getComponent(cc.Animation);
                        animation.play(animation.getClips()[3].name);
                    }
                }
            }
            await this._waitTime(mapConfig.ANIMATE_TIMES.SHOW_EFFECT_TIME);
            cc.log('暂停时间')
            for(let i=0; i<= changeElems.length-1; i++) {
                let rowResult = this._getCurrentPosWrapRange(changeElems[i]);
                result = result.concat(rowResult);
            }

            //计算得分
            let deltaScore = Score.calculateEffectCrush(result, mapConfig.SCORE_TYPE.WRAP_AND_MAGIC, 0);
            let pos: cc.Vec2 = Vec2Util.getTopestAndLefestItemFromArray(result);
            this._addScore(deltaScore, pos, this.cells[pos.x][pos.y].getTopElemType());
            
            return result;
        }
        //魔力鸟 + 魔力鸟
        if (status1 == mapConfig.ELEM_STATUS.MAGIC && status2 == mapConfig.ELEM_STATUS.MAGIC) {
            MusicManager.playRuntimeMusic(this.magicMusic);   //播放音效
            DoubleHitGuidePlayer.recordOrdinaryMagicTimes();
            cc.log('魔力鸟+ 魔力鸟')
            let result: cc.Vec2[] = [];
            for(let i=0; i<= mapConfig.X_NUMBER-1; i++) {
                for(let j=0; j<= mapConfig.Y_NUMBER-1; j++) {
                    if (!this.cells[i][j]) {
                        continue;
                    }
                    result.push(cc.p(i, j))
                }
            }

            //计算得分
            let deltaScore = Score.calculateEffectCrush(result, mapConfig.SCORE_TYPE.MAGIC_AND_MAGIC, 0);
            let pos: cc.Vec2 = Vec2Util.getTopestAndLefestItemFromArray(result);
            this._addScore(deltaScore, pos, this.cells[pos.x][pos.y].getTopElemType());
            
            return result;
        }

        cc.log('特殊特效叠加情况，出错未考虑到')

    }

    /**
     * 随机生成 2种类型，用于显示行特效和列特效
     * @returns 0---行， 1---列
     */
    private _getRandomCrushType(): number{
        return  Math.round(Math.random());
    }

    /**
     * 获取指定行内所有元素坐标
     * @param pos 
     */
    private _getCurrentPosRowRange(pos: cc.Vec2): cc.Vec2[]{
        let result: cc.Vec2[] = [];
        for(let j=0; j<= mapConfig.Y_NUMBER-1; j++){
            if(!this.cells[pos.x][j]){
                continue;
            }
            result.push(cc.p(pos.x, j))
        };
        return result;
    }

    /**
     * 获取指定列内所有元素坐标
     * @param pos 
     */
    private _getCurrentPosColRange(pos: cc.Vec2): cc.Vec2[]{
        let result: cc.Vec2[] = [];
        for(let i=0; i<= mapConfig.X_NUMBER-1; i++){
            if(!this.cells[i][pos.y]){
                continue;
            }
            result.push(cc.p(i, pos.y))
        }
        return result;
    }

    /**
     * 获取指定列内所有元素坐标
     * @param pos 
     */
    private _getCurrentPosWrapRange(pos: cc.Vec2): cc.Vec2[]{
        let result: cc.Vec2[] = [];
       
        for(let i = pos.x-1; i<= pos.x+1; i++){
            for(let j = pos.y-1; j<= pos.y +1; j++){
                if(i < 0 || i > mapConfig.Y_NUMBER-1  || j < 0|| j > mapConfig.X_NUMBER-1 ){
                    continue;
                }
                if (!this.cells[i][j]) {
                    continue;
                }
                result.push(cc.p(i, j))
            }
        }
        //4个顶点
        let vertexs: cc.Vec2[] = [cc.p(pos.x-2, pos.y), cc.p(pos.x+2,pos.y), cc.p(pos.x, pos.y-2), cc.p(pos.x, pos.y+2)]
        for(let i in vertexs){
            if(vertexs[i].x < 0 || vertexs[i].x > mapConfig.Y_NUMBER-1 || vertexs[i].y <0 || vertexs[i].y >mapConfig.X_NUMBER-1) {
                continue;
            }
            if(!this.cells[vertexs[i].x][ vertexs[i].y]) {
                continue;
            }
            result.push(vertexs[i])
        }

        return result;
    }

        /**
     * 获取指定的某一类型的所有元素坐标
     * @param type 
     */
    private _getAllPosWithOneType(type: number): cc.Vec2[]{
        let result: cc.Vec2[] = [];
        for(let i=0; i<=mapConfig.X_NUMBER-1; i++){
            for(let j =0; j<= mapConfig.Y_NUMBER-1; j++){
                if(!this.cells[i][j]){
                    continue;
                }
                if (this.cells[i][j].getTopElemType() == type) {
                    result.push(cc.p(i, j))
                }
            }

        }
        return  result;
    }

    /**
     * 普通元素交换的处理逻辑
     */
    private async _normalTouchLogic(){

        let result: cc.Vec2[]= [];
        let firstCell: Cell = this.cells[ this.touchPositions[0].x ][ this.touchPositions[0].y ];
        let secondCell: Cell = this.cells[ this.touchPositions[1].x ][ this.touchPositions[1].y ];

        await firstCell.moveTo(secondCell);
        
        let checkResult1 = await this._checkPoint(this.touchPositions[1]);   //检查相连
        let checkResult2 = await this._checkPoint(this.touchPositions[0]);
        
        let status1: number = firstCell.getTopElemStatus();
        let status2: number = secondCell.getTopElemStatus();
        
        if (checkResult1[0].length < 3  && checkResult2[0].length < 3) { 
            // cc.log('还原位置:');
            await this._waitTime(mapConfig.ANIMATE_TIMES.TO_MOVE);
            await  secondCell.moveTo(firstCell);
            await this._waitTime(mapConfig.ANIMATE_TIMES.TO_MOVE)
        }

         //生成特效动物
         if (checkResult1[2]) {
            this.cells[this.touchPositions[1].x][this.touchPositions[1].y].topElemStatus = checkResult1[2];
            this.cells[this.touchPositions[1].x][this.touchPositions[1].y].getTopElemInfo()[0].getComponent(MovableElem).status = checkResult1[2];
            let handledCheckResult1 = Vec2Util.removeSpesifiedItem(checkResult1[0], this.touchPositions[1]);
            checkResult1[0] = handledCheckResult1;

            MusicManager.playRuntimeMusic(this.effectCreatMusic);
            this.cells[this.touchPositions[1].x][this.touchPositions[1].y].playEffectCreatingAnimation( checkResult1[2], mapConfig.ANIMATE_TIMES.TO_MOVE);
            
        }
        if (checkResult2[2]) {
            this.cells[this.touchPositions[0].x][this.touchPositions[0].y].topElemStatus = checkResult2[2];
            this.cells[this.touchPositions[0].x][this.touchPositions[0].y].getTopElemInfo()[0].getComponent(MovableElem).status = checkResult2[2];
            let handledCheckResult2 = Vec2Util.removeSpesifiedItem(checkResult2[0], this.touchPositions[0]);
            checkResult2[0] = handledCheckResult2;

            MusicManager.playRuntimeMusic(this.effectCreatMusic);
            this.cells[this.touchPositions[0].x][this.touchPositions[0].y].playEffectCreatingAnimation( checkResult2[2],  mapConfig.ANIMATE_TIMES.TO_MOVE);
        }

        result = checkResult1[0];   //合并所有坐标
        if (checkResult2[0].length >0) {
            for (let i=0; i<= checkResult2[0].length-1; i++) {
                result.push(checkResult2[0][i])
            }
        }

        //销毁前的暂停，给用户反应时间
        if(result.length >2){

            await this._waitTime(mapConfig.ANIMATE_TIMES.DESTROY_DELAY);
        }
        //销毁元素
        await this._destroyElem(result);
    }

    /**
     * 批量更新格子视图
     * @returns 需要等待的时间
     */
    private _updateCellsView(): number{
        // cc.log('更新视图')
        let waitTime: number = 0 ;
        for(let j = mapConfig.X_NUMBER-1; j>=0; j--){
            for(let i = mapConfig.Y_NUMBER -1; i>=0; i--){
                if(!this.cells[i][j]){
                    continue;
                }
                let cellUpdateTime = this.cells[i][j].updateCellView();

                if(cellUpdateTime > waitTime){
                    waitTime = cellUpdateTime;
                }
            }
        }
        
        return waitTime;
    }

    /**
     * 暂停指定时间
     * @param time 
     */
    private  _waitTime(time: number){
        let self = this;
        let func = function(waitTime){
            return new Promise((res,rej)=>{
                self.scheduleOnce(()=>{
                    // cc.log('等待时间：',waitTime)
                    res();
                },waitTime);
            })
        }
        return  func(time);
    }

    /**
     * 自动消除，自动检查所有可消除的相连元素，并将其消除
     */
    private async _autoCrush() {
        let isLoop: boolean = false;
        let tempDestroyPos: cc.Vec2[] = [];

        let effectPos: cc.Vec2[] = [];  //合成生成特效的位置数组

        for (let i = mapConfig.Y_NUMBER-1; i>=0; i--) {
            for (let j = mapConfig.X_NUMBER; j>=0; j--) {
                if (!this.cells[i][j]) {    //空白位置
                    continue;
                }
                //若当前位置已经存在于需要销毁的数组内，则直接跳过
                let isPosInDestroyPos: boolean = Vec2Util.isSpesifiedItemInArray(tempDestroyPos, cc.p(i,j));
                if(isPosInDestroyPos){
                    continue;
                }
                let checkResult = await this._checkPoint(cc.p(i,j))
                if ( checkResult[0].length >=3) {
                    for(let k=0; k<= checkResult[0].length-1; k++){
                        tempDestroyPos.push(checkResult[0][k]);
                    }
                    
                    if (checkResult[2]) {

                        // cc.log('消除中生成特效动物')
                        tempDestroyPos = Vec2Util.removeSpesifiedItem(tempDestroyPos, cc.p(i, j));
                        //播放特效
                        this.cells[i][j].topElemStatus = checkResult[2];
                        this.cells[i][j].getTopElemInfo()[0].getComponent(MovableElem).status = checkResult[2];
                        MusicManager.playRuntimeMusic(this.effectCreatMusic);
                        this.cells[i][j].playEffectCreatingAnimation( checkResult[2], mapConfig.ANIMATE_TIMES.TO_MOVE);
                    }
                    isLoop = true;
                }
            }
        }

        //处理需要销毁的数组
        let destroyPos: cc.Vec2[] = Vec2Util.removeRepeatItem(tempDestroyPos);
        for (let i=0; i<= destroyPos.length-1; i++) {
            this.cells[destroyPos[i].x][destroyPos[i].y].getTopElemInfo()[0].opacity =0;
        }

        await this._destroyElem(destroyPos);

        this._updateHiddenELems();

        return isLoop;
    }

    /**
     * 更新指定列上方隐藏元素的数量
     * @param col   指定列号
     * @param elemAccount   该列应该隐藏的元素数量 
     */
    private _updateHiddenELems() {

        let unitHeight: number = cc.director.getWinSize().width / mapConfig.Y_NUMBER ; 
        for(let col =0; col <= mapConfig.Y_NUMBER-1; col++){
            let hidingCol: cc.Node[] = [];
            let topPos = this.topColCellPos[col];
            if(!topPos){
                continue;
            }
            if(topPos.x >0){
                continue;
            }
            for(let i= 0; i<= mapConfig.HIDING_ELEM_NUMBER-1; i++){
                if (this.hiddenElems[col][i] == null) {
                    let newElem = this._createHidingElem(cc.p( -i -1,col), this._getRandomElemType(), mapConfig.ELEM_STATUS.COMMON);

                    this.hiddenElems[col][i] = newElem;
                }
            }
        }  

    }

    /**
     * 检查制定位置是否在地图中
     */
    private _isPosInMap(pos: cc.Vec2): boolean{
        return (pos.x >=0 && pos.x <=mapConfig.X_NUMBER-1 && pos.y >=0  && pos.y <=mapConfig.Y_NUMBER-1);
    }

    /**
     * 检查制定位置的格子顶部元素是否为特效元素
     */
    private _isPosEffect(pos: cc.Vec2): boolean {
        let status: number = this.cells[pos.x][pos.y].getTopElemStatus();
        if(status != mapConfig.ELEM_STATUS.COMMON && status != mapConfig.ELEM_STATUS.CLICK ){
            return  true;
        }
        return false;

    }

    /**
     * 检查指定的同类型相连2 元素的6个可移动过来相连位置的元素类型，是否移动后可消除
     * @param pos1 
     * @param pos2 
     */
    private _isDiagonalOfTwoPosCanMove(pos1: cc.Vec2, pos2: cc.Vec2): boolean{
        let checkType: number = this.cells[pos1.x][pos1.y].getTopElemType();
        //    ？: 需要检查的位置，  1/2 : 检查位置需要移动的位置     *: 输入的位置
        // - - - - - - - - - -
        // - - - ? - - - - - -
        // - - ? 1 ? - - - - -
        // - - - * - - - - - -
        // - - - * - - - - - -
        // - - ? 2 ? - - - - -
        // - - - ? - - - - - -
        //垂直排列
        if(pos1.y == pos2.y){
            //判断哪个坐标在上边
            let upperPos: cc.Vec2 = (pos1.x < pos2.x) ? pos1: pos2;
            let lowerPos: cc.Vec2 = (pos1.x < pos2.x) ? pos2: pos1;

            //确定这2相连位置的顶部和下部相连的位置
            let targetPos1: cc.Vec2 = cc.p(upperPos.x-1, upperPos.y);
            let targetPos2: cc.Vec2 = cc.p(lowerPos.x+1, lowerPos.y);

            //需要检查的位置
            let checkPositions: cc.Vec2[] = [];
            if(this._isPosInMap(targetPos1) && this.cells[targetPos1.x][targetPos1.y] ){
                checkPositions = [cc.p(targetPos1.x, targetPos1.y-1), cc.p(targetPos1.x-1, targetPos1.y), cc.p(targetPos1.x, targetPos1.y+1)]
                // cc.log('上部检查,所有检查位置为：', checkPositions)
                for(let i=0; i<= checkPositions.length-1; i++){
                    if(!this._isPosInMap(checkPositions[i])){     //不在地图范围内
                        continue;
                    }
                    if(!this.cells[checkPositions[i].x][checkPositions[i].y]){      //该位置没有格子
                        continue;
                    }
                    let currentType =  this.cells[checkPositions[i].x][checkPositions[i].y].getTopElemType();
                    if(currentType == checkType){   //类型一致
                        return true;
                    }
                }
            }

            checkPositions = [];    //重置
            if(this._isPosInMap(targetPos2) && this.cells[targetPos2.x][targetPos2.y]){
                checkPositions = [cc.p(targetPos2.x, targetPos2.y-1), cc.p(targetPos2.x+1, targetPos2.y), cc.p(targetPos2.x, targetPos2.y+1)]
                // cc.log('下部检查,所有检查位置为：', checkPositions)
                for(let i=0; i<= checkPositions.length-1; i++){
                    if(!this._isPosInMap(checkPositions[i])){     //不在地图范围内
                        continue;
                    }
                    if(!this.cells[checkPositions[i].x][checkPositions[i].y]){      //该位置没有格子
                        continue;
                    }
                    let currentType =  this.cells[checkPositions[i].x][checkPositions[i].y].getTopElemType();
                    if(currentType == checkType){   //类型一致
                        return true;
                    }
                }
            }

        }

        //    ？: 需要检查的位置，  1/2 : 检查位置需要移动的位置     *: 输入的位置
        // - - - - - - - - - - - - -
        // - - - - ? - - ? - - - - -
        // - - - ? 1 * * 2 ? - - - -
        // - - - - ? - - ? - - - - -
        // - - - - - - - - - - - - -
        //水平排列
        if(pos1.x == pos2.x){
            //确定左右位置
            let lefterPos: cc.Vec2 = (pos1.y < pos2.y) ? pos1: pos2;
            let righterPos: cc.Vec2 = (pos1.y < pos2.y) ? pos2: pos1;

            //确定需要移动的位置
            let targetPos1: cc.Vec2 = cc.p(lefterPos.x, lefterPos.y-1);
            let targetPos2: cc.Vec2 = cc.p(righterPos.x, righterPos.y+1);

            //检查周围的6个元素
            let checkPositions: cc.Vec2[] = [];
            if(this._isPosInMap(targetPos1) && this.cells[targetPos1.x][targetPos1.y]){
                checkPositions = [cc.p(targetPos1.x, targetPos1.y-1), cc.p(targetPos1.x-1, targetPos1.y), cc.p(targetPos1.x+1, targetPos1.y)]
                // cc.log('左部检查,所有检查位置为：', checkPositions)
                for(let i=0; i<= checkPositions.length-1; i++){
                    if(!this._isPosInMap(checkPositions[i])){     //不在地图范围内
                        continue;
                    }
                    if(!this.cells[checkPositions[i].x][checkPositions[i].y]){      //该位置没有格子
                        continue;
                    }
                    let currentType =  this.cells[checkPositions[i].x][checkPositions[i].y].getTopElemType();
                    if(currentType == checkType){   //类型一致
                        return true;
                    }
                }
            }

            checkPositions = [];    //重置
            if(this._isPosInMap(targetPos2) && this.cells[targetPos2.x][targetPos2.y]){
                checkPositions = [cc.p(targetPos2.x-1, targetPos2.y), cc.p(targetPos2.x+1, targetPos2.y), cc.p(targetPos2.x, targetPos2.y+1)]
                // cc.log('右部检查,所有检查位置为：', checkPositions)
                for(let i=0; i<= checkPositions.length-1; i++){
                    if(!this._isPosInMap(checkPositions[i])){     //不在地图范围内
                        continue;
                    }
                    if(!this.cells[checkPositions[i].x][checkPositions[i].y]){      //该位置没有格子
                        continue;
                    }
                    let currentType =  this.cells[checkPositions[i].x][checkPositions[i].y].getTopElemType();
                    if(currentType == checkType){   //类型一致
                        return true;
                    }
                }
            }
        }

        // cc.log('这种方式没有可以移动消除的格子')
        return false;
    }


    /**
     * 检查制定位置的三角形顶点位置的元素是否能移动过来进行消除
     * 
     * 如下所示三角顶部的?1可以往下移动进行消除
     * - - ?1 - - - - - -
     * - * - ?2 - - - - -
     * 
     */
    private _isAngelPosCanMoveToCrush(pos: cc.Vec2): boolean{
        // 需要检查的元素类型
        let checkType: number = this.cells[pos.x][pos.y].getTopElemType();

        // - - - - * - - - - - - 
        // - - - $ - $ - - - - - 
        // - - * - X - * - - - - 
        // - - - $ - $ - - - - - 
        // - - - - * - - - - - - 
        //如上所示，检查上下左右4个方向之后，最终需要检查的位置，总是那4个所示位置
        //而只检查左右时，已经检查过
        let leftPos: cc.Vec2 = cc.p(pos.x, pos.y-1);
        let rightPos: cc.Vec2 = cc.p(pos.x, pos.y+1);

        //leftPos 在地图内，且对应位置格子存在，则检查最左边的元素是否在地图中，且格子不为空
        if(this._isPosInMap(leftPos) && this.cells[leftPos.x][leftPos.y]){
            let leftestPos: cc.Vec2 = cc.p(leftPos.x , leftPos.y-1);
            if(this._isPosInMap(leftestPos) && this.cells[leftestPos.x][leftestPos.y] && checkType == this.cells[leftestPos.x][leftestPos.y].getTopElemType()){
                //确定需要检查的位置
                let checkPositions: cc.Vec2[] = [cc.p(pos.x - 1, pos.y - 1), cc.p(pos.x + 1, pos.y - 1)];
                for(let i=0; i<= checkPositions.length-1; i++){
                    if(this._isPosInMap( checkPositions[i]) && this.cells[checkPositions[i].x][checkPositions[i].y] && checkType == this.cells[checkPositions[i].x][checkPositions[i].y].getTopElemType()){
                        // cc.log('可以消除的3个位置-左：',pos, leftestPos, checkPositions[i])
                        return true;
                    }
                }
            }
        }
        //rightPos 在地图内，且对应位置格子存在，则检查最左边的元素是否在地图中，且格子不为空
        if(this._isPosInMap(rightPos) && this.cells[rightPos.x][rightPos.y]){
            let rightestPos: cc.Vec2 = cc.p(rightPos.x , rightPos.y+1);
            // cc.log('最右部元素位置：', rightestPos.x, rightestPos.y)
            if(this._isPosInMap(rightestPos) && this.cells[rightestPos.x][rightestPos.y] && checkType == this.cells[rightestPos.x][rightestPos.y].getTopElemType()){
                //确定需要检查的位置
                let checkPositions: cc.Vec2[] = [cc.p(pos.x - 1, pos.y + 1), cc.p(pos.x - 1, pos.y +1)];
                for(let i=0; i<= checkPositions.length-1; i++){
                    if(this._isPosInMap( checkPositions[i]) && this.cells[checkPositions[i].x][checkPositions[i].y] && checkType == this.cells[checkPositions[i].x][checkPositions[i].y].getTopElemType()){
                        // cc.log('可以消除的3个位置-右：',pos, rightestPos, checkPositions[i])
                        return true;
                    }
                }
            }
        }
    }

    /**
     * 检查是否还能继续消除
     * @returns 检查结果：boolean
     */
    private _isCellsCanMoveToCrush(): boolean {

        for (let i=0; i<= mapConfig.X_NUMBER-1; i++) {
            for (let j=0; j<= mapConfig.Y_NUMBER-1; j++) {
                if (!this.cells[i][j]) {
                    continue;
                }
                let currentCellStatus: number = this.cells[i][j].getTopElemStatus();
                let currentCellType: number = this.cells[i][j].getTopElemType();

                //有魔力鸟，一定可以移动消除，返回true；
                if(currentCellStatus == mapConfig.ELEM_STATUS.MAGIC){
                    return true;
                }

                //当前位置为特效元素，相邻位置也为特效元素，一定可以消除，返回true
                if(this._isPosEffect(cc.p(i, j))){
                    if(j-1 >=0 && this.cells[i][j-1] && this._isPosEffect(cc.p(i, j-1)) ){   //左边格子也为特效元素
                        return true;
                    }
                    if(j+1 <=0 && this.cells[i][j+1] && this._isPosEffect(cc.p(i, j+1)) ){      //右边格子也为特效元素
                        return true;
                    }
                    if(i-1 >=0 && this.cells[i-1][j] && this._isPosEffect(cc.p(i-1, j)) ){      //上边格子也为特效元素
                        return true;
                    }
                    if(i+1 <=0 && this.cells[i+1][j] && this._isPosEffect(cc.p(i+1, j)) ){      //下边格子也为特效元素
                        return true;
                    }
                }
                
                //检查上下左右4个位置的元素，若有1个位置跟当前位置的类型相同， 则检查其周围6个元素，有则可以移动消除，返回true
                let aroundPositions: cc.Vec2[] = [cc.p(0,-1), cc.p(0,1), cc.p(-1,0), cc.p(1,0)];
                for(let k=0; k<= aroundPositions.length-1; k++){
                    //下个检查位置的坐标和类型
                    let nextPos: cc.Vec2 = cc.p(i + aroundPositions[k].x , j + aroundPositions[k].y);
                    let nextPosType: number = null;
                    if( this._isPosInMap(nextPos) && this.cells[nextPos.x][nextPos.y] ){
                        nextPosType = this.cells[nextPos.x][nextPos.y].getTopElemType();
                    }

                    //有2个同类型元素相邻
                    if(currentCellType == nextPosType && this._isPosInMap(cc.p(i,j)) && this._isPosInMap(nextPos)){
                        //检查相连2元素的周围6个元素
                        let isCanContinue:boolean = this._isDiagonalOfTwoPosCanMove(cc.p(i,j), nextPos);
                        if(isCanContinue){
                            return true;
                        }
                    }
                }

                //若以上条件都不满足，则检查以其为顶点的三角形的其他2个顶点的元素是否可以移动过来进行消除
                let isAnglePosCanMove: boolean = this._isAngelPosCanMoveToCrush(cc.p(i, j));
                if(isAnglePosCanMove){
                    return true;
                }

                if(i == mapConfig.X_NUMBER-1 && j == mapConfig.Y_NUMBER-1){
                    // cc.log('检查到最后1个位置了', i ,j)
                    return false;
                }
               
            }
        }
        // cc.log('有问题')
        return false;
    }

    /**
     * 获取需要的最终打乱结果
     * 
     * 实现思路，设计一个打乱算法
     * 然后在打乱后，找寻3个同类型元素，设置在4个直线相连位置的第1,2,4位置。
     * 即可实现打乱1次之后必定有可移动消除的元素
     * 
     */
    private _mixUp() {
        let preType = null;
        let preCellPos: cc.Vec2[] = [];
        let existCellsPos: cc.Vec2[] = [];      //有格子存在的位置
        
        for(let i=0; i<= mapConfig.X_NUMBER-1; i++){
            for(let j=0; j<= mapConfig.Y_NUMBER-1; j++){
                if(!this.cells[i][j]){
                    continue;
                }
                existCellsPos.push(cc.p(i, j))
            }
        }

        //获取4 相连的位置，用于预设
        let getPreSetPos: Function = (): cc.Vec2[] =>  {
            //获取1个 随机位置
           let randomPosIndex: number = Math.floor( Math.random() * existCellsPos.length );
           let startPos: cc.Vec2 = existCellsPos[randomPosIndex];
           for(let i= startPos.x; i<= mapConfig.X_NUMBER-1; i++){
               for(let j= startPos.y; j<= mapConfig.Y_NUMBER-1; j++){
                   if(!this.cells[i][j]){
                       continue;
                   }
                   //检查4个方向,以及格子方向的之后3个位置是否有格子存在
                   //左检查
                   if(j >=3){
                       let pos1 = cc.p(i, j-1);
                       let pos2 = cc.p(i, j-2);
                       let pos3 = cc.p(i, j-3);
                       if(this.cells[pos1.x][pos1.y] && this.cells[pos2.x][pos2.y] && this.cells[pos3.x][pos3.y]){
                           presetPos = [cc.p(i,j),pos1, pos2, pos3];
                           return presetPos;
                       }
                   }
                   //右检查
                   if(j <= mapConfig.Y_NUMBER-4 ){
                       let pos1 = cc.p(i, j+1);
                       let pos2 = cc.p(i, j+2);
                       let pos3 = cc.p(i, j+3);
                       if(this.cells[pos1.x][pos1.y] && this.cells[pos2.x][pos2.y] && this.cells[pos3.x][pos3.y]){
                           presetPos = [cc.p(i,j),pos1, pos2, pos3];
                           return presetPos;
                       }
                   }
                   //上检查
                   if(i >=3){
                       let pos1 = cc.p(i-1, j);
                       let pos2 = cc.p(i-2, j);
                       let pos3 = cc.p(i-3, j);
                       if(this.cells[pos1.x][pos1.y] && this.cells[pos2.x][pos2.y] && this.cells[pos3.x][pos3.y]){
                           presetPos = [cc.p(i,j),pos1, pos2, pos3];
                           return presetPos;
                       }
                   }
                   //下检查
                   if(i <= mapConfig.X_NUMBER-4){
                       let pos1 = cc.p(i+1, j);
                       let pos2 = cc.p(i+2, j);
                       let pos3 = cc.p(i+3, j);
                       if(this.cells[pos1.x][pos1.y] && this.cells[pos2.x][pos2.y] && this.cells[pos3.x][pos3.y]){
                           presetPos = [cc.p(i,j),pos1, pos2, pos3];
                           return presetPos;
                       }
                   }

                   if(i == mapConfig.X_NUMBER-1 && j == mapConfig.Y_NUMBER-1){
                        return getPreSetPos();
                   }
               }
               
           }
       }

       let presetPos: cc.Vec2[] = getPreSetPos();
        
        //获取打乱后位置
        let randomsort = (a, b) => {
            return Math.random()> 0.5 ? -1 : 1;
        }
        existCellsPos = existCellsPos.sort(randomsort);

        //打乱
        let index =0;
        for(let i=0; i<=mapConfig.X_NUMBER-1; i++){
            for(let j=0; j<= mapConfig.Y_NUMBER-1; j++){
                if(!this.cells[i][j]){
                    continue;
                }
                this.cells[i][j].exchangeTopElem(this.cells[existCellsPos[index].x][existCellsPos[index].y]);
                index ++;
            }
        }
        let searchPresetELemArray = Vec2Util.removeSpesifiedArray(existCellsPos, presetPos);
        let getPreCellPos: Function = () =>{
            preCellPos = [];    //重置，重新计算
            //获取随机的类型
            let randomIndex = Math.floor(Math.random() * searchPresetELemArray.length);

            preType = this.cells[searchPresetELemArray[randomIndex].x][searchPresetELemArray[randomIndex].y].getTopElemType();
            // cc.log('随机类型：', preType, '1熊2猫3鸡4狐5蛙6马')
    
            //获取3个指定类型元素位置
            for(let i=0; i<= searchPresetELemArray.length-1; i++){
                let currentCheckType: number = this.cells[searchPresetELemArray[i].x][searchPresetELemArray[i].y].getTopElemType();
                if( currentCheckType == preType ){
                    preCellPos.push( searchPresetELemArray[i] );
                }
                if(preCellPos.length == 3){
                    return;
                }
            }
            if(preCellPos.length <3) {
                
                return getPreCellPos();
            }
        }

        //获取需要的指定位置
        getPreCellPos();
        
        //预设置
        this.cells[ presetPos[0].x][ presetPos[0].y ] .exchangeTopElem( this.cells[ preCellPos[0].x ][ preCellPos[0].y ]);
        this.cells[ presetPos[2].x][ presetPos[2].y ] .exchangeTopElem( this.cells[ preCellPos[1].x ][ preCellPos[1].y ]);
        this.cells[ presetPos[3].x][ presetPos[3].y ] .exchangeTopElem( this.cells[ preCellPos[2].x ][ preCellPos[2].y ]);

        for(let i= 0; i<= mapConfig.X_NUMBER-1; i++){
            for(let j=0; j<= mapConfig.Y_NUMBER-1; j++){
                if(!this.cells[i][j]){
                    continue;
                }
                this.cells[i][j].addMixUpAction();
            }
        }
    }

    /**
     * 改变显示的分数
     * @param deltaScore 每次显示的分数增量
     * @param pos  提示分数的显示位置
     * @param colorType 颜色类型（与元素类型一致）
     */
    private _addScore(deltaScore: number, pos: cc.Vec2, colorType: number){
        if(!this.isGameLoaded){ //游戏还未加载完成
            return ;
        }
        if(!deltaScore || deltaScore == 0){
            return ;
        }
        // let scoreNode: cc.Node = this.node.parent.getChildByName('scoreArea').getChildByName('score');
        this.currentScore += deltaScore;

        //生成分数提示节点
        let script: EffectLayer = this.node.parent.getChildByName('effectLayer').getComponent('effectLayer');
        script.addDeltaScore(deltaScore, pos, colorType);
        //延迟显示
        this.scheduleOnce(()=>{
            this.node.parent.getChildByName('immediateRanking').getComponent(ImmediateRanking).setCurrentPlayerScore(this.currentScore);
        }, mapConfig.ANIMATE_TIMES.TO_DIE)
    }

    /**
     * 计算障碍物影响效果
     * @param destroyPos 
     * @returns 经计算之后的最终需要消除的坐标数组
     */
    private _monsterCalculate(destroyPos : [cc.Vec2]) :[cc.Vec2] {
        let result: [cc.Vec2] = null;
        return result ;
    }

    /**
     * 清空加载的资源，测试用
     */
    public clearResource() {
        this.cellBgResource = null;
        this.elemResources = null;
    }

    

}