const {ccclass, property} = cc._decorator;
import {mainSceneConf} from './mainSceneConf';
import ClientFactory, {ClientType} from '../commons/net/ClientFactory';
import ShopClient from '../client/Shop';

@ccclass
export default class Diamond extends cc.Component {


    //支付宝选择框
    @property(cc.Toggle)
    zfbToggle:cc.Toggle=null;
    //微信选择框
    @property(cc.Toggle)
    wxToggle:cc.Toggle=null;
    //钻石页面预制项
    @property(cc.Prefab)
    diamondPre: cc.Prefab = null;

    onLoad() {
       cc.game.addPersistRootNode(this.node);
       this._getDiamondData();
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

    private async _getDiamondData(){
        let diamondJSON=null;
        let diamondRule=await this._getSExchangeRule('DIAMOND_PAY');
        if(diamondRule.toString().indexOf('Error')==-1){
            diamondJSON=JSON.parse(diamondRule);
            this.handleResult(diamondJSON);
        }
        this._initDiamondItem();
    }

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
