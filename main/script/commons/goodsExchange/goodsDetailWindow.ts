import GoodsExchangeWindow from "./goodsExchangeWindow";

const {ccclass, property} = cc._decorator;



/**
 * 兑换物品时的物品详情页面
 * @author 刘磊
 * @date 2018.2.28
 */
@ccclass
export default class GoodsDetailWindow extends cc.Component {

    goodsId: number = null; //物品id
    userPoint: number = null;   //用户的积分
   
    onLoad() {
        // init logic
        
    }

    /**
     * 判断用户积分，根据情况禁用按钮
     */
    public updateButtonTouchable(){
        let exchangeAmount: number = parseInt( this.node.getChildByName('panel').getChildByName('btn_exchange').getChildByName('propAmount'). getComponent(cc.Label).string);
        if(this.userPoint < exchangeAmount){
            //禁用兑换按钮
            this.node.getChildByName('panel').getChildByName('btn_exchange').getComponent(cc.Button).interactable = false;
        }else{
            this.node.getChildByName('panel').getChildByName('btn_exchange').getComponent(cc.Button).interactable = true;
        }
    }

    /**
     * 兑换物品
     */
    public exchange(){
        if(!this.goodsId){
            cc.error('物品id不正常')
            return;
        }
        this.node.parent.getComponent(GoodsExchangeWindow).exchange(this.goodsId);
    }

    /**
     * 关闭页面
     */
    public closePage(){
        this.node.destroy();
    }

    /**
     * 修改物品图片
     * @param img 
     */
    public  changeGoodsImage(img: cc.SpriteFrame){
        this.node.getChildByName('panel').getChildByName('img').getComponent(cc.Sprite).spriteFrame = img;
    }
    
    /**
     * 修改物品名称
     * @param img 
     */
    public  changeGoodsName(name: string){
        this.node.getChildByName('panel').getChildByName('name').getComponent(cc.Label).string = name;
    }
    
    /**
     * 修改物品描述
     * @param desc 
     */
    public changeGoodsDescription(desc: string){
        this.node.getChildByName('panel').getChildByName('desc').getComponent(cc.Label).string = desc;
    }
    
    /**
     * 修改交换金额
     * @param amount 金额（积分）
     */
    public changeExchangeAmount(amount: number){
        this.node.getChildByName('panel').getChildByName('btn_exchange').getChildByName('propAmount'). getComponent(cc.Label).string = amount + '';
    }
}
