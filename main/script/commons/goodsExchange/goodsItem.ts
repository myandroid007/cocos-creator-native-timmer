const {ccclass, property} = cc._decorator;

@ccclass
export default class ExchangeGoodsItem extends cc.Component {

    goodsId: number = null;     //需要兑换的物品Id

    onLoad() {
        // init logic
        this._clickListener();
        
    }

    /**
     * 交换
     */
    public exchange(){
        //发送冒泡事件到父节点，内涵goodsId
        let event = new cc.Event.EventCustom('show-detail',true);
        event.detail = {
            goodsId: this.goodsId
        };
        this.node.dispatchEvent(event );
    }

    /**
     * 将按钮置灰/恢复
     * @param flag  是否置灰 
     */
    public grayExchangeButton(flag: boolean){
        //禁用按钮，自带置灰
        this.node.getChildByName('btn_exchange').getComponent(cc.Button).interactable = flag;
    }

    /**
     * 将制定的图片设置为当前显示图片
     * @param frame  指定图片
     */
    public setImg(frame: cc.SpriteFrame){
        this.node.getChildByName('goods').getComponent(cc.Sprite).spriteFrame = frame;
    }

    /**
     * 将积分数量设置为指定值
     * @param amount 
     */
    public setGoodsAmount(amount: number){
        this.node.getChildByName('condition').getChildByName('amount').getComponent(cc.Label).string = amount + '';
    }

    /**
     * 点击监听
     */
    private _clickListener(){
        this.node.getChildByName('goods').on(cc.Node.EventType.TOUCH_START, ()=>{
            this.exchange();
        })
    }
}
