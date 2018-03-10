const {ccclass, property} = cc._decorator;
import {mainSceneConf} from './mainSceneConf';
import ClientFactory, {ClientType} from '../commons/net/ClientFactory';
import ShopClient from '../client/Shop';


@ccclass
export default class NewClass extends cc.Component {
    

    //体力页面预制项
    @property(cc.Prefab)
    strenghPre: cc.Prefab = null;

    onLoad() {
        cc.game.addPersistRootNode(this.node);
        this._getExchangeRuleData();
    }
 
    onClick(event,customEventData){
        switch(customEventData){
            case 'closeStrengthPage':
                this.node.x=-375;
            break;
        }
    }
 
     private async _getExchangeRuleData(){
         let strengthRule=await this._getSExchangeRule('DIAMOND_EXCHANGE_STRENGTH');
         let strengthJSON=null;
         if(strengthRule.toString().indexOf('Error')==-1){
             strengthJSON=JSON.parse(strengthRule);
             this.handleResult(strengthJSON);
         }
         this._initStrengthItem();
     }
 
     /**
      * 处理获取到的数据
      * @param result 数据对象
      * @param type 数据类型
      */
    private handleResult(result){
        for(let i=0;i<result.length;i++){
            mainSceneConf.STRENGTH_PAGE_CONF.STRENGTH_ARRAY[i]=result[i].propNum;
            mainSceneConf.STRENGTH_PAGE_CONF.DIAMOND_ARRAY[i]=result[i].price;
        }
    }
     
     /**
      * 初始化钻石购买页面
      */
     private _initStrengthItem(){
        let parentStrength=this.node.getChildByName('pay');
        for(let i=0;i<mainSceneConf.STRENGTH_PAGE_CONF.STRENGTH_ARRAY.length;i++){
            let item=cc.instantiate(this.strenghPre);
            let buynum=item.getChildByName('buynum');
            let paybtn=item.getChildByName('paybtn');
            let btnChildBuyNum=paybtn.getChildByName('paynum').getComponent(cc.Label);
            btnChildBuyNum.string=`${mainSceneConf.STRENGTH_PAGE_CONF.DIAMOND_ARRAY[i]}`;
            buynum.getComponent(cc.Label).string=`X${mainSceneConf.STRENGTH_PAGE_CONF.STRENGTH_ARRAY[i]}`;
            item.tag=i+2*(mainSceneConf.STRENGTH_PAGE_CONF.STRENGTH_ARRAY.length);
            item.setPositionY(-(i*mainSceneConf.ITEM_SPACING+mainSceneConf.DEFUALT_INSTANCE));
            parentStrength.addChild(item);
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
