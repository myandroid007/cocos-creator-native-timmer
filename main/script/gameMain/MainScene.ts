



const { ccclass, property } = cc._decorator;

import SceneNavigator from '../commons/scene/SceneNavigator';
import {mainSceneConf} from './mainSceneConf';
import NetChecker from '../commons/net/NetChecker';
import {NetwokType} from '../typings/entities';
import ClientFactory, {ClientType} from '../commons/net/ClientFactory';
import ZoneClient from '../client/Zone';
import MessageBox from '../commons/UI/messageBox/MessageBox';
import {endSceneConf} from '../gameEnd/endSceneConf';
import {ButtonType} from '../typings/entities';
import PropClient from '../client/Prop';
import ShopClient from '../client/Shop';
import Global from '../commons/storage/Global';
import {zoneIdConf} from '../conf/zoneIdConf';

@ccclass
export default class MainScene extends cc.Component {

    
    //气球
    @property(cc.Sprite)
    spriteBallool: cc.Sprite = null;
    //荣耀场按钮
    @property(cc.Button)
    btnGloryField: cc.Sprite = null;
    //解锁奖励页面
    @property(cc.Node)
    upgradeLayout : cc.Node =null;

    @property(cc.SpriteFrame)
    gloryFrames:cc.SpriteFrame=null;
    
    accessMessageBox:MessageBox = null;

    private failStatus:string='forbidden';
    private successStatus:string='success';
     onLoad() {
       // cc.sys.localStorage.setItem('isUnlock',true);
        this.checkIsUnlockGloryField();
        //let userJson = {"id":"9600","userId":"9600","nickname":"qqqqqq","avatar":"https://ss0.bdstatic.com/70cFuHSh_Q1YnxGkpoWK1HF6hhy/it/u=2028940690,1078059060&fm=27&gp=0.jpg"};
        //Global.setItem("userInfo",userJson);
         //TODO  用于直接进入场景跳过登陆用，上线时可考虑删除
        this._GlobalUserHandler();	
		
        this.initMessageBox();
	    //预加载
	    this._preloadGameScene()
        //开始监听网络（暂时认为是游戏启动的第一个场景），为场景添加回调方法
        NetChecker.addEventListener('change','checkNetState',this.checkNetState);
        //启动网络检测服务
        NetChecker.startService();
        //在onload方法里面首先检测一次网络

        //NetChecker.checkNetWork();
        
        //设置场次场景为路由主场景
        SceneNavigator.initRoute({sceneName:'gameMain'});

        //气球动画
        this._runBalloolAction(3);

        //预加载头像等个人中心数据 gzr
        let personCenter = cc.director.getScene().getChildByName('personalCenterPage');
        personCenter.getComponent('PersonalCenter').reloadData();
        //重新显示玩家积分
        let headBar=cc.director.getScene().getChildByName('head').getComponent('HeadBar');
        headBar.getPlayerPoint();
    }
    

    onDestroy(){
        //场景被销毁时，移除监听
        NetChecker.removeEventLisener('change','checkNetState');
    }

    private initMessageBox(){
        this.accessMessageBox=new MessageBox(
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
                isResidentNode:false,
                icon:'' 
            }
        ,this.node);
        this.accessMessageBox.init();
    }
	
	/**
     * 全局的用户处理，进入此场景若无user则添加默认，否则正常运行
     */
    private _GlobalUserHandler(){
        let userInfo = Global.getItem("userInfo");
        if(userInfo){
            return ;
        }
        let userJson = {"id":"9600","userId":"9600","nickname":"qqqqqq","avatar":"https://ss0.bdstatic.com/70cFuHSh_Q1YnxGkpoWK1HF6hhy/it/u=2028940690,1078059060&fm=27&gp=0.jpg"};
        Global.setItem("userInfo",userJson); 
    }
	
    /**
     * 网络类型判断，并作出相应处理
     */
    checkNetState(){
        let netType=NetChecker.getNetConnectionType();
        if(netType==NetwokType.NO_NETWORK){
            NetChecker.alert.x=375;
        //    self._showNetworkInterruptionAlert(self.mobileAlert,false);
        //    self._showNetworkInterruptionAlert(self.netBreakAlert,true);
        }else {
           // NetChecker.alert.x=-375;
            // if(netType==NetwokType.WIFI){
               
            // }else{
            //     self._showNetworkInterruptionAlert(self.netBreakAlert,false);
            //     self._showNetworkInterruptionAlert(self.mobileAlert,true);
            // }   
        }
    }
   
   
    /**
    * 场次按钮点击事件绑定方法
    */
    public async onZoneSelectBtnClick(event,customEventData) {
        switch(customEventData){
            case 'primary':
                 zoneIdConf.CURRENT_FIELD=zoneIdConf.PRIMARY_FIELD;
            break;
            case 'intermediate':
                 zoneIdConf.CURRENT_FIELD=zoneIdConf.INTERMEDIATE_FIELD;
            break;
            case 'senior':
                 zoneIdConf.CURRENT_FIELD=zoneIdConf.ADVANCED_FIELD;
            break;
            case 'glory':
                 zoneIdConf.CURRENT_FIELD=zoneIdConf.GLORY_FIELD;
            break;

        }
        this.handleResultData(await this.canAccess( zoneIdConf.CURRENT_FIELD,Global.getItem("userInfo").userId));
        
    }

    private unlockGloryField(date){
        this.upgradeLayout.getComponent('GloryFieldUnlock').renderingReward(date);
    }
   
    private checkIsUnlockGloryField(){
        if(cc.sys.localStorage.getItem('isUnlock')=='true'){
            this.btnGloryField.getComponent(cc.Sprite).spriteFrame=this.gloryFrames;
        }
        // cc.log(cc.sys.localStorage.getItem('unlockState'));
        // // if(cc.sys.localStorage.getItem('unlockState')!='null'){

        // //     let unlockState=JSON.parse(cc.sys.localStorage.getItem('unlockState'));
           
        // //     if(unlockState.isUnlock){
        // //         this.btnGloryField.getComponent(cc.Sprite).spriteFrame=this.gloryFrames;
        // //     }
        // // }
    }


    /**
     * 检验对手体力情况
     */
    public canAccess(zoneId:number, uid:number) {

        return new Promise<string>((res, rej)=>{
            let zoneClient: ZoneClient = <ZoneClient> ClientFactory.getHttpClient( ZoneClient, 'zone'); 
                zoneClient.canAccess(zoneIdConf.CURRENT_FIELD,uid ,function(result){
                    res(result);
                });
        });
    }

    private handleResultData(accessResult){
       
        let result=null;

        //网络请求失败，需修改
        if(accessResult.toString().indexOf('Error')==-1){
            result=JSON.parse(accessResult);
            if(result.status==this.failStatus){
                this.accessMessageBox.setMessage(result.reason);
                this.accessMessageBox.showMessageBox(true);
            }else if(result.status==this.successStatus){
                zoneIdConf.SIMULATION_DEDUCTION_STREN=result.data.strength;
               
                if(zoneIdConf.CURRENT_FIELD==zoneIdConf.GLORY_FIELD){
                    // cc.log(result);
                    if(!result.data.receiveState.gloryUnlockReceiveState){
                        this.unlockGloryField(result.data.reward);
                    }else{
                        SceneNavigator.push({sceneName:'match'});
                    }
                }else{
                    SceneNavigator.push({sceneName:'match'}); 
                }
               
            }
        }else{
            this.accessMessageBox.setMessage('网络连接发生错误!!!');
            this.accessMessageBox.showMessageBox(true); 
        }
       
        
        
    }
    /**
     * 气球动画
     * @param time 动画的时间
     */
    private _runBalloolAction(time:number){
        let startX=this.spriteBallool.node.x;
        let startY=this.spriteBallool.node.y;
        this.spriteBallool.node.runAction(cc.repeatForever(cc.sequence(
            cc.moveTo(time,startX,startY+80),
            cc.moveTo(time,startX,startY)
        )));
    }
    
    /**
     * 预加载 游戏场景
     */
    private   _preloadGameScene(){
        let load = ()=>{
            return new Promise((res, rej)=>{
                 cc.director.preloadScene("game", function () {
                    cc.log("预加载场景完成");
                    res();
                });
            })
        };
        return load();
    }
}
