/**
 * 公用匹配UI组件
 * @author 龙涛
 * 2017/12/15  修改
 */
import {EPlayer, MatchBoxConfigure} from '../../../typings/entities';
import CommonTimer from '../../timer/CommonTimer';
import BitmapUtil from '../../util/BitmapUitl';
import MathUtil from '../../util/MathUtil';


 let self=null;
 (<any>cc).delayCallback=function (){
    self.onMatchCompleted();
 }

/**
 * 设置默认参数配置
 */
const DEFAULT_MATCH_BOX_CONF = {
    type:'landscape',                                     
    scale:0.9,  
    iconSize:120,
    iconDistance:20,
    labelPositionY:95,  
    //nodeLocationY:600,s
    nodeLocationY:-80,                                        
    opponentNum: 5,                                       
    isShowVsIcon: false,
    isRandom:false, 
    nodeNamePrefixs: ['outlayout','spriteIcon','boxbg'],
    defultFrame : 'texture/icons/matchScene/headiconbox'
}
/**
 * 对手匹配UI组件
 */

export default class OpponentMatchAreaUI {

   //最大对手数量
   private maxNum : number = 5;
   //控制当前显示
   private index : number =0;
   //该组件的父节点
   //private parentNode : cc.Node = null;
   //该组件的父节点
   private prenickName : cc.Prefab = null;
   //接收传递过来的配置
   private config : MatchBoxConfigure={};
   //回调方法
   private onMatchCompleted: Function = () =>{};
   //占位数组
   private locations:number[]=[];
   //字体
   private font:cc.Font=null;
   //默认头像图片
   private defualtHeadIcon:cc.SpriteFrame=null;

   private parentNode:cc.Node=null;

//    constructor(config: MatchBoxConfigure,font:cc.Font,prenickName:cc.Prefab, onMatchCompleted?: Function) {
    constructor(config: MatchBoxConfigure,parentNode:cc.Node,font:cc.Font,prenickName:cc.Prefab, onMatchCompleted?: Function) {
        this.config.type = config.type || DEFAULT_MATCH_BOX_CONF.type;
        this.config.scale = config.scale || DEFAULT_MATCH_BOX_CONF.scale;
        this.config.iconSize = config.iconSize || DEFAULT_MATCH_BOX_CONF.iconSize;
        this.config.iconDistance = config.iconDistance || DEFAULT_MATCH_BOX_CONF.iconDistance;
        this.config.labelPositionY = config.labelPositionY || DEFAULT_MATCH_BOX_CONF.labelPositionY;
        this.config.nodeLocationY = config.nodeLocationY || DEFAULT_MATCH_BOX_CONF.nodeLocationY;
        this.config.opponentNum = config.opponentNum || DEFAULT_MATCH_BOX_CONF.opponentNum;
        this.config.isShowVsIcon = config.isShowVsIcon || DEFAULT_MATCH_BOX_CONF.isShowVsIcon;
        this.config.isRandom = config.isRandom || DEFAULT_MATCH_BOX_CONF.isRandom;
        this.config.nodeNamePrefixs = config.nodeNamePrefixs || DEFAULT_MATCH_BOX_CONF.nodeNamePrefixs;
        this.config.defultFrame=config.defultFrame || DEFAULT_MATCH_BOX_CONF.defultFrame;
        this.parentNode=parentNode;
        this.font=font;
        this.prenickName=prenickName;
        this.onMatchCompleted=onMatchCompleted;
        self=this;
   }


  /**
   * 根据配置初始化节点
   */
   public init() { 
       
       let mylayout=this._initOutsideLayoutNode();
       if(this.config.opponentNum>this.maxNum){
          this.config.opponentNum=this.maxNum;
       }
       if(this.config.opponentNum>=3){
           for(let i=0;i<this.config.opponentNum;i++){
               this.locations[i]=i;
           }
           
       }
       switch(this.config.type){
           case 'landscape':
               for(var i:number=0;i<this.config.opponentNum;i++){
                   let box=new cc.Node("Sprite");
                   box.name=this.config.nodeNamePrefixs[1]+i
                   box.addComponent(cc.Sprite);
                   let boxsprite= box.getComponent(cc.Sprite);
                   boxsprite.sizeMode=cc.Sprite.SizeMode.CUSTOM;
                   box.width=this.config.iconSize+8;
                   box.height=this.config.iconSize+8;
                   let sp=new cc.Node("Sprite");
                   sp.addComponent(cc.Sprite);
                   let sprite= sp.getComponent(cc.Sprite);
                   sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
                   sp.width=this.config.iconSize;
                   sp.height=this.config.iconSize;
                   let lab=cc.instantiate(this.prenickName);
                   lab.setPosition(0,-this.config.labelPositionY);
                   lab.getComponent(cc.Label).string='';
                   lab.getComponent(cc.Label).font=this.font;
                   sp.addChild(lab);
                   box.addChild(sp);
                   mylayout.addChild(box);
               }
           break;
       }
       this._loadDefultSpriteFrame(this.config.defultFrame);
       this.parentNode.addChild(mylayout);
   }
   

   /**
    * 显示对手
    * @param opponentList 临时数组，传递几个显示几个
    * @result 无 
    */
    public addOpponent(opponentList:EPlayer[]){
        var self= this;
        let size= opponentList.length;
        for(let i=0;i<size;i++){
            if(!!opponentList[i]){
                let location=0;
                if(self.config.opponentNum>=3){
                    if(self.config.isRandom){
                        if(self.index>0){
                             location=self._getShowLocation();
                        }
                    }else{
                        location=self.index;
                    }
                }
                //let layoutNode=cc.director.getScene().getChildByName(self.config.nodeNamePrefixs[0]);
                let layoutNode=this.parentNode.getChildByName(self.config.nodeNamePrefixs[0]);
                let iconNode=layoutNode.getChildByName(self.config.nodeNamePrefixs[1]+location);
                let iconChildren=null;
                if(iconNode!=null){
                    iconChildren=iconNode.children[0]
                }
                cc.loader.load({url:opponentList[i].avatar,type: 'jpg' }, async function (err, texture) {
                    let spriteFrameNow=null;
                    if (err) {
                        spriteFrameNow= await BitmapUtil.getLocalBitmap('test/match/my');
                    }else{
                        spriteFrameNow=new cc.SpriteFrame(texture); 
                    } 
                   
                    if(!!iconChildren&&!!spriteFrameNow) {
                        iconChildren.getComponent(cc.Sprite).spriteFrame=spriteFrameNow;
                    }
                    
                });
               
                MathUtil.removeByValue(location,self.locations);
                if(iconChildren!=null){
                    let label=iconChildren.children;
                    let labelComponent=label[0].getComponent(cc.Label);
                    let nick='';
                    if(!!opponentList[i].nickname){
                        nick=opponentList[i].nickname.trim();
                        
                    }else{
                        if(!!opponentList[i].username){
                            nick=opponentList[i].username.trim();
                        }else{
                            nick='无昵称';
                        }
                    }
                    let nickname=nick;
                    if(nick.length>5){
                        nickname=nick.substring(0,5)+'...';
                    }
                    labelComponent.string=nickname;
                    label[0].color=cc.Color.BLACK;
                    let scale=self.config.scale;
                    iconChildren.setScale(scale);
                    if(self.locations.length<=0){
                        self._callTimer();
                    }
                }else{
                    //cc.log('未找到相应节点');
                }
                self.index++; 
            }
               
        }
    }


   public getSurplusVacancy():number{
       return this.locations.length;
   }

//    public clearOpponentDate(){
      
//        let layoutNode=this.parentNode.getChildByName(self.config.nodeNamePrefixs[0]);
//        for(let i=0;i<this.config.opponentNum;i++){
//            let iconNode=layoutNode.getChildByName(self.config.nodeNamePrefixs[1]+i);
//            let iconChildren=iconNode.children[0];
//            iconChildren.getComponent(cc.Sprite).spriteFrame=null;
//            let label=iconChildren.children;
//            label[0].getComponent(cc.Label).string='';
//        }

//    }
   public remove():void{
    
   }


   /**
    * 设备平台判断，根据平台调用相应的定时器
    */
   private _callTimer(){
       CommonTimer.setTimeout(2000,'cc.delayCallback();',self.onMatchCompleted);
   }



    /**
    * 加载默认帧
    * @param url 默认帧路径
    * @result 无 
    */
    private  async _loadDefultSpriteFrame(url:string){
        let sprite:cc.SpriteFrame =await BitmapUtil.getLocalBitmap(url)
        for(let i=0;i<this.config.opponentNum;i++){
            let parent=this.parentNode.getChildByName(this.config.nodeNamePrefixs[0]);
            let childrenbox=parent.getChildByName(this.config.nodeNamePrefixs[1]+i);   
            childrenbox.getComponent(cc.Sprite).spriteFrame=sprite;
            childrenbox.setScale(this.config.scale);
            childrenbox.children[0].setScale(this.config.scale);
        }
    }

    /**
    * 创建布局节点
    * @result 返回布局节点
    */
   private _initOutsideLayoutNode():cc.Node{
       let outermostlayer =new cc.Node('Node');
       outermostlayer.setPosition( 0,this.config.nodeLocationY);
       outermostlayer.name=this.config.nodeNamePrefixs[0];
       outermostlayer.addComponent(cc.Layout);
       let lay=outermostlayer.getComponent(cc.Layout);
       lay.type=cc.Layout.Type.HORIZONTAL;
       lay.resizeMode=cc.Layout.ResizeMode.CONTAINER;
       lay.horizontalDirection=cc.Layout.HorizontalDirection.LEFT_TO_RIGHT;
       lay.spacingX=this.config.iconDistance;
       outermostlayer.addComponent(cc.Widget);
       let widget=outermostlayer.getComponent(cc.Widget);
       widget.isAlignHorizontalCenter=true;
      // cc.game.addPersistRootNode(outermostlayer);
       return outermostlayer;
   }


    /**
    * 产生随机数
    * @result 无 
    */
   private _getShowLocation():number{
       let num=this.locations.length;
       let location=Math.floor(Math.random()*1000)%num;
       return this.locations[location];
   }
}
