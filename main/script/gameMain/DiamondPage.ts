const {ccclass, property} = cc._decorator;
import {mainSceneConf} from './mainSceneConf';
import ClientFactory, {ClientType} from '../commons/net/ClientFactory';
import ShopClient from '../client/Shop';
import MessageBox from '../commons/UI/messageBox/MessageBox';
import {ButtonType} from '../typings/entities';
import NetChecker from '../commons/net/NetChecker';

@ccclass
export default class DiamondPage extends cc.Component {

    
    //支付宝选择框
    @property(cc.Toggle)
    zfbToggle:cc.Toggle=null;
    //微信选择框
    @property(cc.Toggle)
    wxToggle:cc.Toggle=null;
    //钻石页面预制项
    @property(cc.Prefab)
    diamondPre: cc.Prefab = null;

    messageBox:MessageBox=null;

    payMessageBox:MessageBox=null;
    buyMessageBox:MessageBox=null;


    onLoad() {
       cc.game.addPersistRootNode(this.node);
       this._getExchangeRuleData();
       this._initAlert();
    }

    private _initAlert(){
        let messageConf = {
            bg:'bg/paytipbg', //背景图片
            title: '提示' ,// 消息框标题,
            message: '网络连接已中断' ,// 消息提示文本内容
            buttons:[{
                type:ButtonType.MB_QUIT,
                name:'退出',
                isShowName:true,
                animType:'frame',
                normal:'texture/buttons/btnblu',
                pressed:'texture/buttons/btnpress', 
                hover:'',
                disabled:'texture/buttons/btnpress',
                handle:function (){}
            },
            {
                type:ButtonType.MB_RETRY,
                name:'重试',
                isShowName:true,
                animType:'frame',
                normal:'texture/buttons/btnred',
                pressed:'texture/buttons/btnpress', 
                hover:'',
                disabled:'texture/buttons/btnpress',
                handle:NetChecker.checkNetWork
            }
        ],  //消息框类型
            isShowCancelBtn:false,//显示在屏幕的位置
            isResidentNode:true,
            icon:'' 
        }
        this.messageBox = new MessageBox(messageConf,this.node.parent);
        this.messageBox.setBoxName('netInterruption');
        this.messageBox.init();
        this.messageBox.setPersistRootNode();
        
        NetChecker.alert=this.messageBox.getMessageBoxNode();

        this.payMessageBox=new MessageBox(
            {
                bg:'bg/paytipbg', //背景图片
                title: '提示' ,// 消息框标题,
                message: '购买成功' ,// 消息提示文本内容
                buttons:[{
                    type:ButtonType.MB_OK_AND_CLOSE,
                    name:'确定',
                    isShowName:false,
                    animType:'scale',
                    normal:'texture/buttons/btnpaysure',
                    pressed:'texture/buttons/btnpress', 
                    hover:'',
                    disabled:'texture/buttons/btnpress',
                    handle:function (){}
                },
            ],  //消息框类型
                isShowCancelBtn:false,//显示在屏幕的位置
                isResidentNode:true,
                icon:'' 
            }
        ,this.node.parent);
        this.payMessageBox.setBoxName('success');
        this.payMessageBox.init();
        this.payMessageBox.setPersistRootNode();

        this.buyMessageBox=new MessageBox(
            {
                bg:'bg/paytipbg', //背景图片
                title: '提示' ,// 消息框标题,
                message: '钻石不足，是否购买？' ,// 消息提示文本内容
                buttons:[
                    {
                        type:ButtonType.MB_NO,
                        name:'取消',
                        isShowName:true,
                        animType:'scale',
                        normal:'texture/buttons/btnblu',
                        pressed:'texture/buttons/btnpress', 
                        hover:'',
                        disabled:'texture/buttons/btnpress',
                        handle:function (){}
                    },
                    {
                        type:ButtonType.MB_OK_AND_CLOSE,
                        name:'确定',
                        isShowName:true,
                        animType:'scale',
                        normal:'texture/buttons/btnred',
                        pressed:'texture/buttons/btnpress', 
                        hover:'',
                        disabled:'texture/buttons/btnpress',
                        handle:this.showBuyDiamondPage
                    }
                ],  //消息框类型
                isShowCancelBtn:false,//显示在屏幕的位置
                isResidentNode:true,
                icon:'' 
            }
        ,this.node.parent);
        this.buyMessageBox.setBoxName('insufficient');
        this.buyMessageBox.init();
        this.buyMessageBox.setPersistRootNode();
    }
    onClick(event,customEventData){
        switch(customEventData){
            case 'closeDiamondPage':
                this.node.x=-375;
            break;
            case 'wx':
                this.zfbToggle.isChecked=false;
                this.wxToggle.isChecked=true;
            break;
            case 'zfb':
                this.zfbToggle.isChecked=true;
                this.wxToggle.isChecked=false;
            break;
        }
    }
    showBuyDiamondPage(){
       cc.director.getScene().getChildByName('diamondpage').x=375;
    }
    private async _getExchangeRuleData(){
        let diamondJSON=null;
        let diamondRule=await this._getSExchangeRule('DIAMOND_PAY');
        if(diamondRule.toString().indexOf('Error')==-1){
            diamondJSON=JSON.parse(diamondRule);
            this.handleResult(diamondJSON);
        }
        this._initDiamondItem();
    }

    /**
     * 处理获取到的数据
     * @param result 数据对象
     * @param type 数据类型
     */
    private handleResult(result){
            for(let i=0;i<result.length;i++){
                mainSceneConf.DIAMOND_PAGE_CONF.DIAMOND_ARRAY[i]=result[i].propNum;
                mainSceneConf.DIAMOND_PAGE_CONF.RMB_ARRAY[i]=result[i].price;
                mainSceneConf.DIAMOND_PAGE_CONF.GIVE_DIAMOND_ARRAY[i]=result[i].rewardPropNum;
            }
    }
    
    /**
     * 初始化钻石购买页面
     */
    private _initDiamondItem():void{
        let parentDiamond=this.node.getChildByName('pay');
        for(let i=0;i<mainSceneConf.DIAMOND_PAGE_CONF.DIAMOND_ARRAY.length;i++){
            let item=cc.instantiate(this.diamondPre);
            let buynum=item.getChildByName('buynum');
            let givenum=item.getChildByName('givenum');
            let paybtn=item.getChildByName('paybtn');
            let btnChildBuyNum=paybtn.getChildByName('paynum').getComponent(cc.Label);
            btnChildBuyNum.string='￥ '+mainSceneConf.DIAMOND_PAGE_CONF.RMB_ARRAY[i];
            givenum.getComponent(cc.Label).string='送'+mainSceneConf.DIAMOND_PAGE_CONF.GIVE_DIAMOND_ARRAY[i];
            buynum.getComponent(cc.Label).string='X'+mainSceneConf.DIAMOND_PAGE_CONF.DIAMOND_ARRAY[i];
            item.tag=i;
            item.setPositionY(-(i*mainSceneConf.ITEM_SPACING+mainSceneConf.DEFUALT_INSTANCE));
            parentDiamond.addChild(item);
        }
    }
    

    private  _getSExchangeRule(type:string){
        return new Promise<string>((res, rej)=>{
            let exchangeClient: ShopClient = <ShopClient> ClientFactory.getHttpClient(ShopClient, 'shop'); 
            exchangeClient.listPropTradingItems(type, function (diamond) {
                if (diamond) {
                    res(diamond);
                } else {
                    cc.log('获取当前兑换套餐为空');
                }
            });
        })
    }

   
}
