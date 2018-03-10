const {ccclass, property} = cc._decorator;

import {mainSceneConf} from './mainSceneConf';
import MainScene from './MainScene';
import OpponentMatchSence from './MainScene';
import Global from '../commons/storage/Global'
import ShopClient from '../client/Shop';
import ClientFactory, {ClientType} from '../commons/net/ClientFactory';
import MessageBox from '../commons/UI/messageBox/MessageBox';

/**
 * 购买金币和体力界面的购买按钮，点击事件绑定脚本
 */
@ccclass
export default class BtnPayOnclickLisener extends cc.Component {

    //购买按钮
    @property(cc.Button)
    btnItem: cc.Button = null;


    exchangeClient: ShopClient=null;

    payMessageBox:cc.Node=null;
    buyMessageBox:cc.Node=null;
    headBar=null;

    onLoad(){
        this.headBar=cc.director.getScene().getChildByName('head').getComponent('HeadBar');
        this.payMessageBox=cc.director.getScene().getChildByName('success');
        this.buyMessageBox=cc.director.getScene().getChildByName('insufficient');
        this.exchangeClient = <ShopClient> ClientFactory.getHttpClient(ShopClient, 'shop');
        this.btnItem.node.on('click', this.onClick, this);
    }

    /**
     * 购买按钮绑定点击事件的方法
     */
    async onClick() {
        let playerPropObj=Global.getItem('playerPropObj');
        if(playerPropObj.diamond<=0){
            this.buyMessageBox.x=375;
        }else{
            let num=this.btnItem.node.parent.tag;

            let paynum=0;
            let addnum=0;
            let type='';
            let limmit=mainSceneConf.STRENGTH_PAGE_CONF.DIAMOND_ARRAY.length;
            if(num>=limmit&&num<=(2*limmit-1)){
                
            }else if(num>=2*limmit&&num<=(3*limmit-1)){
                paynum=mainSceneConf.STRENGTH_PAGE_CONF.DIAMOND_ARRAY[num-2*limmit];
                addnum=mainSceneConf.STRENGTH_PAGE_CONF.STRENGTH_ARRAY[num-2*limmit];
                type='DIAMOND_EXCHANGE_STRENGTH';
            }
            if(playerPropObj.diamond<paynum){
               
                this.buyMessageBox.x=375;
            }else{
                let result=await this.exchangeProp(Global.getItem('userInfo').userId,addnum,type);
                if(result.toString().indexOf('Error')==-1){
                    let resultJSON=JSON.parse(result);
                    if(!!resultJSON){
                        if(resultJSON.statusCode==200&&resultJSON.status=='success'){
                            playerPropObj.diamond-=paynum;
                            switch(type){
                                case 'Gold':
                                     playerPropObj.point+=addnum;
                                break;
                                case 'DIAMOND_EXCHANGE_STRENGTH':
                                     playerPropObj.strength+=addnum;
                                break;
                            }
                        }else if(resultJSON.statusCode!=200){
                            this.payMessageBox
                            .getChildByName('alert')
                            .getChildByName('messageLayout')
                            .getChildByName('message')
                            .getComponent(cc.Label)
                            .string=resultJSON.reason;
                            //this.nowScene.payMessageBox.setMessage(resultJSON.reason);
                        }
                        Global.setItem('playerPropObj',playerPropObj);
                        this.headBar.showPlayerProp();
                    }
                }else{
                    this.payMessageBox
                       .getChildByName('alert')
                       .getChildByName('messageLayout')
                       .getChildByName('message')
                       .getComponent(cc.Label)
                       .string='发生错误，支付失败！';
                   //this.nowScene.payMessageBox.setMessage('发生错误，支付失败！');
                }
                this.payMessageBox.x=375;
            }
        }

    }

    private  exchangeProp(uid:number,payNum:number,type:string){
        let self=this;
        return new Promise<string>((res, rej)=>{
            self.exchangeClient.exchangeProp(uid,payNum,type, function (result) {
                if(result){
                    res(result);
                }
            });
        })
    }
}
