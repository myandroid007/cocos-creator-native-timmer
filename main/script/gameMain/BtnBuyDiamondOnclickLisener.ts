const {ccclass, property} = cc._decorator;
import {mainSceneConf} from './mainSceneConf';
import MainScene from './MainScene';


/**
 * 购买钻石按钮绑定脚本
 */
import Global from '../commons/storage/Global'

 @ccclass
export default class BtnBuyDiamondOnclickLisener extends cc.Component {

    //购买钻石按钮
    @property(cc.Button)
    btnItem: cc.Button = null;


    onLoad(){
        this.btnItem.node.on('click', this.callback, this);
    }
 
    /**
     * 购买钻石按钮点击事件绑定方法
     */
    callback(event) {
        let num=this.btnItem.node.parent.tag;
        let addnum=mainSceneConf.DIAMOND_PAGE_CONF.DIAMOND_ARRAY[num];
        let playerPropObj=Global.getItem('playerPropObj');
        //playerPropObj.diamond+=addnum;
        //MainScene.paytipBox.active=true;
    }
}
