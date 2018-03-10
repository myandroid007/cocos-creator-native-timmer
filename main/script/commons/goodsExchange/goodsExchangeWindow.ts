import GoodsDetailWindow from "./goodsDetailWindow";
import ExchangeGoodsItem from "./goodsItem";
import NewClass from "../../match/RulePage";
import Alert from "../UI/android/Alert";

export interface ExchangeGoods{
    goodsId: number,
    name: string,        //名称
    alias: string,      //别名
    desc: string,
    price: number,      //价格
    isReal: boolean,   //是否是实物，需要物流的实物
    isActive: boolean,      //是否激活上架
    stock: number,      //库存数量
    currencyType: string    //兑换钱币类型 
}
const {ccclass, property} = cc._decorator;


/**
 * 兑换物品时的物品展示页面
 * @author 刘磊
 * @date 2018.2.28
 */
@ccclass
export default class GoodsExchangeWindow extends cc.Component {
    
    @property(cc.Prefab)        //物品列表预制
    goodsItem: cc.Prefab = null;

    @property(cc.Prefab)        //详情页面预制
    detailPrefab: cc.Prefab = null; 

    @property([cc.SpriteFrame])
    goodsImg: cc.SpriteFrame[] = [];

    exchangCallBack: Function = null; //实际的兑换方法，由外部传入
    userPiont: number = null;   //用户积分
    private goodsInfo: ExchangeGoods[] = null;  //兑换物品信息
    private detailWindow: cc.Node = null; //详情节点
    private goods: cc.Node[] = [];

    onLoad() {
        // init logic
        this._showGoodsDetailLinstener();   //开始监听
    }


    /**
     * 关闭页面
     */
    public  closePage(){
        this.node.destroy();
    }

    /**
     * 设置物品信息，并自动更新显示
     * @param goodsInfo 
     */
    public setGoodsInfo(goodsInfo: ExchangeGoods[]){
        this.goodsInfo = goodsInfo;
        this._showGoods(goodsInfo);
    }

    private _hideTip(){
        this.node.getChildByName('tip').active = false;
    }

    /**
     * 显示兑换物品
     * @param goodsInfo         物品信息
     */
    private _showGoods(goodsInfo: ExchangeGoods[]){
        let panel: cc.Node = this.node.getChildByName('panel');

        let content: cc.Node = cc.find('panel/goodsArea/view/content', this.node);
        goodsInfo.forEach((goods: ExchangeGoods)=>{
            let newGoods: cc.Node = cc.instantiate(this.goodsItem);
            let newGoodsScript: ExchangeGoodsItem = newGoods.getComponent(ExchangeGoodsItem);

            newGoodsScript.goodsId = goods.goodsId;
            newGoodsScript.setImg(this._getSpecifiedImgBygoodsName(goods.name));
            newGoodsScript.setGoodsAmount(goods.price);

            content.addChild(newGoods);
            this.goods.push(newGoods);      //将所有单个物品储存起来
        })
        this._updateGoodsTouchable();
        this._hideTip();
    }

    /**
     * 根据goodsId 扣除页面内用户对应积分
     */
    private _deductUserPiontByGoodsId(goodsId: number){
        let goodsInfo: ExchangeGoods = this._getGoodsInfoById(goodsId);
        this.userPiont -= goodsInfo.price;
    }

    /**
     * 更新物品显示
     */
    private _updateGoodsTouchable(){
        //   判断用户积分与现有物品需要的积分，进行更新
        for(let i=0; i<= this.goods.length-1; i++){
            let goodsAmount: number = parseInt( this.goods[i].getChildByName('condition').getChildByName('amount').getComponent(cc.Label).string);
            if(this.userPiont < goodsAmount) {
                this.goods[i].getComponent(ExchangeGoodsItem).grayExchangeButton(false);
            }
        }
        cc.log('现在积分：', this.userPiont)
    }

    /**
     * 显示物品详情
     */
    private _showGoodsDetailLinstener(){
        //方法内监听子节点发送的显示详情事件
        //根据事件内的goodsId进行详情页面显示

        this.node.on('show-detail',(event)=>{
            let goodsId: number = event.detail.goodsId;
            let goodsInfo: ExchangeGoods = this._getGoodsInfoById(goodsId);
            let detailWindow: cc.Node = cc.instantiate(this.detailPrefab);  //实例化详情界面
            let script: GoodsDetailWindow = detailWindow.getComponent(GoodsDetailWindow);
            
            script.goodsId = goodsId;
            script.changeGoodsImage(this._getSpecifiedImgBygoodsName(goodsInfo.name));
            script.changeGoodsName(goodsInfo.alias);
            script.changeGoodsDescription(goodsInfo.desc);
            script.changeExchangeAmount(goodsInfo.price);
            script.userPoint = this.userPiont;
            script.updateButtonTouchable();
            
            this.node.addChild(detailWindow);   //显示
            this.detailWindow = detailWindow;

        })
    }

    /**
     * 显示兑换成功提示
     */
    public showExchangeSuccessTip(goodsId: number){
        //
        this.detailWindow.destroy();    //销毁
        //显示成功弹窗
        let tip: cc.Node = cc.instantiate(this.node.getChildByName('exchangeDescriptionWindow'));
        tip.active = true;
        let label = tip.getChildByName('panel').getChildByName('context').getComponent(cc.Label);
        label.string = "兑换成功";
        label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        this.node.addChild(tip);

        this.scheduleOnce(()=>{
            tip.destroy();
        },1.5)

        this._deductUserPiontByGoodsId(goodsId);        //更新页面积分
        this._updateGoodsTouchable();   //更新点击显示
    }

    /**
     * 显示兑换失败提示
     */
    public showExchangeFailTip(){
        let tip: cc.Node = cc.instantiate(this.node.getChildByName('exchangeDescriptionWindow'));
        tip.active = true;
        let label = tip.getChildByName('panel').getChildByName('context').getComponent(cc.Label);
        label.string = "兑换失败";
        label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        this.node.addChild(tip);

        this.scheduleOnce(()=>{
            tip.destroy();
        },1.5)
    }

    /**
     * 显示兑换说明弹窗
     */
    public showExchangeDesciptionWindow(){
        this.node.getChildByName('exchangeDescriptionWindow').active = true;
    }
    
    /**
     * 将描述弹窗设置为 inactive，不激活
     */
    public inactiveDescriptionWindow(){
        this.node.getChildByName('exchangeDescriptionWindow').active = false;
    }

    /**
     * 兑换物品
     * @param goodsId 
     */
    public exchange(goodsId: number){
        let goodsInfo: ExchangeGoods = this._getGoodsInfoById(goodsId);
        this.exchangCallBack(goodsId);      
    }

    /**
     * 设置按钮可点击性
     * @param btn  按钮节点 
     * @param touchable  可点击性，boolean 
     */
    private _setButtonTouchable(btn: cc.Node, touchable: boolean){
        btn.getChildByName('btn_exchange').getComponent(cc.Button).interactable = touchable;
    }

    /**
     * 根据goodsId 获取物品信息
     * @param goodsId 
     */
    private _getGoodsInfoById(goodsId: number): ExchangeGoods{
        if( !this.goodsInfo || this.goodsInfo.length ==0){
            cc.error('物品信息为空')
            return;
        }
        for(let i=0; i<= this.goodsInfo.length-1; i++){
            if(this.goodsInfo[i].goodsId == goodsId){
                return this.goodsInfo[i];
            }

        }
    }

    /**
     * 根据物品名称，获取对应的图片资源
     * @param goodsName 
     */
    private _getSpecifiedImgBygoodsName(goodsName: string): cc.SpriteFrame{
        for(let i=0; i<= this.goodsImg.length-1; i++){
            if(this.goodsImg[i].name == goodsName){
                return this.goodsImg[i];
            }
        }
        cc.log('没有指定的物品信息,物品名称为：', goodsName);
        return this.goodsImg[0];
    }

}
