import GoodsExchangeWindow, { ExchangeGoods } from "./goodsExchangeWindow";
import ClientFactory from "../net/ClientFactory";
import GoodsExchangeClient from "../../client/GoodsExchange";
import Global from "../storage/Global";
import { PlayerProp } from "../../typings/entities";
import HeadBar from "../../gameMain/HeadBar";

const {ccclass, property} = cc._decorator;




@ccclass
export default class GoodsExchangeButton extends cc.Component {

    @property(cc.Prefab)        //兑换中心弹窗预制
    goodsExchangePrefab: cc.Prefab = null;

    goodsExchangeWindow: cc.Node = null;

    gameId: number = 1;
    addressId: number = 1;      //选择的地址id
    private goodsInfo: ExchangeGoods[] = [];
    private userInfo = null;

    onLoad() {
        // init logic
    }
    
    start(){
        // this._userInfoCheck();

    }

    private _userInfoCheck(){
        let userPropInfo  = Global.getItem('playerPropObj');
        cc.log('用户信息：', userPropInfo);
        if(userPropInfo){
            this.userInfo  = userPropInfo;
            return;
        }
        cc.log('未获取到用户道具，使用默认的测试数量')
        this.userInfo ={
            id: 1,
            gameId:1,
            diamond :  0, 
            gold :  0 , 
            strength : 490 , 
            groove:500,
            point : 3000
        
        }

    }
    
    /**
     * 显示兑换中心页面
     */
    public showGoodsExchangePage(){
        this._userInfoCheck();  //获取用户积分
        this.goodsExchangeWindow = cc.instantiate(this.goodsExchangePrefab);
        this.node.parent.addChild(this.goodsExchangeWindow);    //显示
        let script = this.goodsExchangeWindow.getComponent(GoodsExchangeWindow);
        script.exchangCallBack = this.exchangeGoods.bind(this);
        script.userPiont = this.userInfo.point;

        this._getAndSetGoodsInfo(this.gameId);
    }


    /**
     * 根据goodsId找到货物兑换价格，并在前台扣除显示
     */
    private _resetUserPointByGoodsId(goodsId: number){
        let price: number = 0;
        for(let i=0; i<= this.goodsInfo.length-1; i++){
            if(this.goodsInfo[i].goodsId == goodsId){
                price = this.goodsInfo[i].price;
                break;
            }
        }
        //扣除本地price 相等的积分 
        this.userInfo.point -= price;
        Global.setItem('playerPropObj', this.userInfo);
        // 改变headBar 
        let headBar=cc.director.getScene().getChildByName('head').getComponent(HeadBar);
        headBar.setPiont(this.userInfo.point);
    }

    /**
     * 向后台签到
     */
    private _getGoodsInfoFromServer(){
        return new Promise((res, rej)=>{
            let client: GoodsExchangeClient = <GoodsExchangeClient>ClientFactory.getHttpClient(GoodsExchangeClient, 'goodsExchange');
            client.getExchangeGoods(1,(result)=>{
                res(result);
            })
        })
    }

    /**
     * 获取兑换物品,并将兑换物品设置到弹窗内  。异步
     * @param gameId  游戏id
     */
    private _getAndSetGoodsInfo(gameId: number ){
         //请求网络数据
        this._getGoodsInfoFromServer().then((result)=>{
            let goods: ExchangeGoods[] = JSON.parse(result + '');

            //成功回调里调用进行设置;
            let script: GoodsExchangeWindow = this.goodsExchangeWindow.getComponent(GoodsExchangeWindow);
            script.setGoodsInfo(goods);
            this.goodsInfo = goods;

        }).catch((error)=>{
            cc.log("网络请求出错:", error)
        });
    }

    /**
     * 检查物品是否是实物
     * @param goodsId 
     */
    private _isGoodsReal(goodsId: number): boolean{
        for(let i=0; i<= this.goodsInfo.length-1; i++){
            if(this.goodsInfo[i].goodsId == goodsId){
                return this.goodsInfo[i].isReal
            }
        }
    }

    /**
     * 兑换物品
     * @param goodsId  物品id
     */
    public exchangeGoods(goodsId: number){
       let isRealGoods: boolean = this._isGoodsReal(goodsId);
       if(isRealGoods){
            //TODO  判断是实物。调用网页版填写地址电话
       }
        //请求后台
        this.exchangeGoodsToServer(this.userInfo.uid,this.userInfo.gameId,goodsId,this.addressId).then((result)=>{
            if(result){  
                //兑换成功    显示      
                this.goodsExchangeWindow.getComponent(GoodsExchangeWindow).showExchangeSuccessTip(goodsId);
                //修改用户信息
                this._resetUserPointByGoodsId(goodsId);

            }else{
                cc.error('兑换失败')
            }
        })

    }

    /**
     * 向后台提交数据
     * @param userId 
     * @param gameId 
     * @param goodsId 
     * @param addressId 
     */
    private exchangeGoodsToServer(userId: number, gameId: number, goodsId: number, addressId: number){
        return new Promise((res, rej)=>{
            let client: GoodsExchangeClient = <GoodsExchangeClient>ClientFactory.getHttpClient(GoodsExchangeClient, 'goodsExchange');
            client.exchange(userId,gameId, goodsId, addressId,(result)=>{
                res(result);
            })
        })
    }

}
