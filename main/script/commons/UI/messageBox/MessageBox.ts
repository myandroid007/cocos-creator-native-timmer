
import {ButtonType} from '../../../typings/entities';
import {messageBoxDefaultConf} from '../../../conf/messageBoxDefaultConf';
import {MessageBoxConfig, MessageButton} from '../../../typings/entities';
/**
 * 通用消息框
 * 龙涛
 * 2017/1/29s
 */

//消息框默认配置
const DEFAULT_TIP_BOX_CONF = {
    bg:'bg/tipbg', //背景图片
    title: '提示' ,// 消息框标题,
    message: '我是默认提示文本' ,// 消息提示文本内容
    buttons:[{
        type:ButtonType.MB_YES_AND_CLOSE,
        name:'Yes',
        isShowName:true,
        animType:'frame',
        normal:'texture/buttons/btnblu',
        pressed:'texture/buttons/btnpress', 
        hover:'',
        disabled:'texture/buttons/btnpress',
        handle:function(){cc.log('执行Yes按钮默认回调方法');}
    },
    {
        type:ButtonType.MB_NO,
        name:'No',
        isShowName:true,
        animType:'frame',
        normal:'texture/buttons/btnred',
        pressed:'texture/buttons/btnpress', 
        hover:'',
        disabled:'texture/buttons/btnpress',
        handle:function(){cc.log('执行No按钮默认回调方法');}
    }
],  //消息框类型
    isShowCancelBtn:false,//显示在屏幕的位置
    isResidentNode:false,
    icon:''
}


export default class MessageBox  {

   //接收传递过来的配置
   private config : MessageBoxConfig={};
   //消息框外层框
   private box:cc.Node=null;
   //消息框父节点
   private parent:cc.Node=null;

   private alertNode:cc.Node=null;

   private name:string='defaultMessageBox';

   constructor(config:MessageBoxConfig, parent: cc.Node){
      //接收配置参数
      this.config.bg=config.bg || DEFAULT_TIP_BOX_CONF.bg;
      this.config.title=config.title || DEFAULT_TIP_BOX_CONF.title;
      this.config.message=config.message || DEFAULT_TIP_BOX_CONF.message;
      this.config.buttons=config.buttons || DEFAULT_TIP_BOX_CONF.buttons;
      this.config.isShowCancelBtn=config.isShowCancelBtn || DEFAULT_TIP_BOX_CONF.isShowCancelBtn;
      this.config.isResidentNode=config.isResidentNode || DEFAULT_TIP_BOX_CONF.isResidentNode;
      this.config.icon=config.icon || DEFAULT_TIP_BOX_CONF.icon;
      this.parent=parent;
   }


   async initItem(){
    let self=this;
    let size=cc.director.getWinSize();
    
    //最外层框
    this.box=new cc.Node('Node');
    this.box.name=this.name;
    this.box.anchorX=0.5;
    this.box.anchorY=0.5;
    if(this.config.isResidentNode){
       this.box.setPosition(messageBoxDefaultConf.POSITION_X,messageBoxDefaultConf.POSITION_Y);
    }else{
       this.box.active=false;
    }
   
    //蒙层
    let mask=new cc.Node('Sprite');
    mask.addComponent(cc.Sprite);
    let maskSprite=mask.getComponent(cc.Sprite);
    maskSprite.sizeMode=cc.Sprite.SizeMode.CUSTOM;
    mask.setContentSize(size.width,size.height);
    mask.addComponent(cc.BlockInputEvents);
    this.box.addChild(mask);

    //消息框节点
    let alert=new cc.Node('Sprite');
    alert.name='alert';
    alert.anchorX=0.5;
    alert.anchorY=0.5;
    alert.addComponent(cc.Sprite);
    this.alertNode=alert;
    let alertSprite=alert.getComponent(cc.Sprite);
    alert.setContentSize(messageBoxDefaultConf.BOX_WIDTH,messageBoxDefaultConf.BOX_HEIGHT);
    alertSprite.sizeMode=cc.Sprite.SizeMode.CUSTOM; 

    alertSprite.spriteFrame=await this._getLocalBitmap(this.config.bg);
    this.box.addChild(alert);

    //标题
    let title=new cc.Node('Label');
    title.addComponent(cc.Label);
    title.color=cc.hexToColor("#FFA54F");
    title.name='title';
    let label=title.getComponent(cc.Label);
    label.string=this.config.title;
    label.overflow=cc.Label.Overflow.NONE;
    label.fontSize=messageBoxDefaultConf.FONT_SIZE;
    label.lineHeight=messageBoxDefaultConf.LINE_HEIGHT;
    title.addComponent(cc.Widget);
    let widget=title.getComponent(cc.Widget);
    widget.isAlignTop=true;
    widget.top=messageBoxDefaultConf.BOX_HEIGHT/40;
    alert.addChild(title);

    //提示图标
    let messageLayout=this._initOutsideLayoutNode(messageBoxDefaultConf.BOX_HEIGHT*7/24,messageBoxDefaultConf.TIP_CLEARANCE_VALUE);
        messageLayout.name='messageLayout';
    if(this.config.icon!=''){
      let icon=new cc.Node('Sprite');
      icon.name='icon';
      icon.addComponent(cc.Sprite);
      let iconSprite=icon.getComponent(cc.Sprite);
      iconSprite.sizeMode=cc.Sprite.SizeMode.CUSTOM;
      iconSprite.spriteFrame=await this._getLocalBitmap(this.config.icon);
      icon.setContentSize(messageBoxDefaultConf.TIP_ICON_WIDTH,messageBoxDefaultConf.TIP_ICON_HEIGHT);
      messageLayout.addChild(icon);
    }
    
    //提示文本
    let tip=new cc.Node('Label');
    tip.name='message';
    tip.color=cc.hexToColor("#FFA54F");
    tip.addComponent(cc.Label);
    if(this.config.icon!=''){
        tip.setContentSize(messageBoxDefaultConf.TIP_LABEL_WIDTH,messageBoxDefaultConf.TIP_LABEL_HEIGHT);
    }else{
        tip.setContentSize(400,messageBoxDefaultConf.TIP_LABEL_HEIGHT);
    }
   
    let tipLabel=tip.getComponent(cc.Label);
    tipLabel.horizontalAlign=cc.Label.HorizontalAlign.CENTER;
    tipLabel.verticalAlign=cc.Label.VerticalAlign.CENTER;
    tipLabel.string=this.config.message;
    //if(this.config.icon!=''){
    tipLabel.overflow=cc.Label.Overflow.RESIZE_HEIGHT;
    // }else{
    //   tipLabel.overflow=cc.Label.Overflow.NONE;
    // }
    tipLabel.fontSize=messageBoxDefaultConf.FONT_SIZE;
    messageLayout.addChild(tip);
    alert.addChild(messageLayout);

    //关闭按钮
    let cancelBtn=new cc.Node('Button');
    cancelBtn.name='close';
    cancelBtn.addComponent(cc.Sprite);
    cancelBtn.addComponent(cc.Button);
    cancelBtn.addComponent(cc.Widget);
    let btnSprite=cancelBtn.getComponent(cc.Sprite);
    btnSprite.sizeMode=cc.Sprite.SizeMode.CUSTOM;
    btnSprite.spriteFrame=await this._getLocalBitmap(messageBoxDefaultConf.CALCEL_BTN_ICON_URL);
    cancelBtn.setContentSize(messageBoxDefaultConf.CALCEL_BTN_WIDTH,messageBoxDefaultConf.CALCEL_BTN_HEIGHT);
    let close=cancelBtn.getComponent(cc.Button);
    close.transition=cc.Button.Transition.SCALE;
    close.duration=messageBoxDefaultConf.CALCEL_BTN_ANIM_TIME;
    close.zoomScale=messageBoxDefaultConf.CALCEL_BTN_ANUM_ZOOMSCALE;
    let closeBtnwidget=cancelBtn.getComponent(cc.Widget);
    closeBtnwidget.isAlignTop=true;
    closeBtnwidget.isAlignRight=true;
    closeBtnwidget.top=messageBoxDefaultConf.CALCEL_BTN_ALIGNTOP_VALUE;
    closeBtnwidget.right=messageBoxDefaultConf.CALCEL_BTN_ALIGNRIGHT_VALUE;
    alert.addChild(cancelBtn);
    cancelBtn.on(cc.Node.EventType.TOUCH_END,function(){
        self.box.x=messageBoxDefaultConf.POSITION_X;
    });
    if(!this.config.isShowCancelBtn){
        cancelBtn.active=false;
    }
    
    //初始化底部按钮组
    this._initButoons(alert);

    if(!this.config.isResidentNode){
        this.parent.addChild(this.box);
    }  
   }

   /**
   * 开始初始化 ，根据参数配置消息框
   */
    init(){
        this.initItem();
    }

   /**
    * 设置消息框节点的名字
    * @param name 输入名称
    */
   setBoxName(name :string){
       this.name=name;
   }

   setTitle(title:string){
       let targetNode=this.alertNode.getChildByName('title');
       if(!!targetNode){
        targetNode.getComponent(cc.Label).string=title;
       }
      
   }

   setMessage(message:string){
       let targetNode=this.alertNode.getChildByName('messageLayout').getChildByName('message');
       if(!!targetNode){
           targetNode.getComponent(cc.Label).string=message;
       }
      
   }

   setMessageIcon(spriteFrame:cc.SpriteFrame){
       if(this.config.icon!=''){
        let targetNode=this.alertNode.getChildByName('messageLayout').getChildByName('icon');
        if(!!targetNode){
            targetNode.getComponent(cc.Sprite).spriteFrame=spriteFrame;
         }
       }
   }

   isShowCloseBtn(isShow:boolean){
       let targetNode=this.alertNode.getChildByName('close');
       if(!!targetNode){
        targetNode.active=isShow;
       }
      
   }

   setPersistRootNode(){
       cc.game.addPersistRootNode(this.box);
   }

   showMessageBox(isShow:boolean){
       if(this.config.isResidentNode){
           if(isShow){
               this.box.x=375;
           }else{
               this.box.x=-375;
           }
       }else{
          this.box.active=isShow;
       }
   }

   getMessageBoxNode():cc.Node{
       return this.box;
   }
   /**
    * 初始化底部按钮组
    * @param target 按钮组父节点
    */
   private async _initButoons(target:cc.Node){
        let self=this;
        let myLayoyt=this._initOutsideLayoutNode(-messageBoxDefaultConf.BOX_HEIGHT/10,messageBoxDefaultConf.BTN_CLEARANCE_VALUE);
        for(let i=0;i<this.config.buttons.length;i++){
            let button=this.config.buttons[i];
            let targetBtn=new cc.Node('Button');
                targetBtn.addComponent(cc.Sprite);
                targetBtn.addComponent(cc.Button);
            let btnSprite=targetBtn.getComponent(cc.Sprite);
                btnSprite.sizeMode=cc.Sprite.SizeMode.CUSTOM;
                btnSprite.spriteFrame=  await this._getLocalBitmap(button.normal);
                targetBtn.setContentSize(messageBoxDefaultConf.BTN_WIDTH,messageBoxDefaultConf.BTN_HEIGHT);
            let okFrame=targetBtn.getComponent(cc.Button);
                if(button.animType=='frame'){
                    okFrame.transition=cc.Button.Transition.SPRITE;
                    okFrame.normalSprite= await this._getLocalBitmap(button.normal);
                    okFrame.pressedSprite= await this._getLocalBitmap(button.pressed);
                    okFrame.disabledSprite= await this._getLocalBitmap(button.disabled);
                }else if(button.animType=='scale'){
                    okFrame.transition=cc.Button.Transition.SCALE;
                    okFrame.duration=0.05;
                    okFrame.zoomScale=1.05;
                }
                if(button.isShowName){
                    let name=new cc.Node('Label');
                    name.addComponent(cc.Label);
                    let nameLabel=name.getComponent(cc.Label);
                    nameLabel.string=button.name;
                    nameLabel.overflow=cc.Label.Overflow.NONE;
                    nameLabel.fontSize=messageBoxDefaultConf.BTN_FONT_SIZE;
                    nameLabel.lineHeight=messageBoxDefaultConf.BTN_LINE_HEIGHT;
                    targetBtn.addChild(name);     
                }
            
                targetBtn.on(cc.Node.EventType.TOUCH_END,function(){
                    self.onClick(button.type,button.handle);
                });
                myLayoyt.addChild(targetBtn); 
        }
        target.addChild(myLayoyt);
    }

    /**
     * 初始化布局节点，需要传入里面节点的间距与距顶部的距离
     * @param distant 里面节点的间距
     * @param spacing 距顶部的距离
     */
    private _initOutsideLayoutNode(distant:number,spacing:number):cc.Node{
        let outermostlayer =new cc.Node('Node');
            outermostlayer.addComponent(cc.Layout);
        let lay=outermostlayer.getComponent(cc.Layout);
            lay.type=cc.Layout.Type.HORIZONTAL;
            lay.resizeMode=cc.Layout.ResizeMode.CONTAINER;
            lay.horizontalDirection=cc.Layout.HorizontalDirection.LEFT_TO_RIGHT;
            lay.spacingX=spacing;
            outermostlayer.addComponent(cc.Widget);
        let widget=outermostlayer.getComponent(cc.Widget);
            widget.isAlignHorizontalCenter=true;
            widget.isAlignBottom=true;
            widget.bottom=distant;
        return outermostlayer;
    }

    /**
     * 各个按钮的点击事件
     */
    private onClick(customEventData,clickCallBack){
        let self=this;
        switch(customEventData){
           case ButtonType.MB_OK:
                
           break;
           case ButtonType.MB_OK_AND_CLOSE:
                if(this.config.isResidentNode){
                   self.box.x=-375;
                }else{
                   self.box.active=false;
                }
               
           break;
           case ButtonType.MB_YES_AND_CLOSE:
               if(this.config.isResidentNode){
                   self.box.x=-375;
               }else{
                   self.box.active=false;
               }
           break;
           case ButtonType.MB_NO:
               if(this.config.isResidentNode){
                   self.box.x=-375;
               }else{
                   self.box.active=false;
               }
           break;
           case ButtonType.MB_RETRY:
               if(this.config.isResidentNode){
                  self.box.x=-375;
               }else{
                  self.box.active=false;
               }
           break;
           case ButtonType.MB_QUIT:
                cc.game.end();
           break;
       }
       //执行按钮的回调方法
       if(!!clickCallBack){
           clickCallBack();
       }
    }
    
    private _getLocalBitmap(url:string){
        return new Promise<cc.SpriteFrame>((res, rej)=>{
            cc.loader.loadRes(url,cc.SpriteFrame,function (err, SpriteFrame) {
                if (err) {
                    cc.error(err);
                } else {
                    res(SpriteFrame);
                }
           });
       });  
    }
}
