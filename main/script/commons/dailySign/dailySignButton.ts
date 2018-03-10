const {ccclass, property} = cc._decorator;
import DailySignWindow from "./dailySignWindow";
import {SignAward, PlayerProp} from '../../typings/entities';
import ClientFactory from "../net/ClientFactory";
import DailySignClient from "../../client/DailySign";
import Global from "../storage/Global";
import HeadBar from "../../gameMain/HeadBar";


/**
 * 用于绑定签到按钮的脚本，实现如显示签到框等功能
 * @author 刘磊
 * @since 2018.2.2
 */
@ccclass
export default class DailySignButton extends cc.Component {

    @property(cc.Prefab)        //签到预制框
    dailySignWindowPrefab: cc.Prefab = null;

    signWindow: cc.Node = null;
    monthAwards = null;

    onLoad() {
        this.updateLoadedTimes();
    }

    /**
     * 显示签到页面
     */
    public  showDailySignPage(){
        let dailySign: cc.Node = cc.instantiate(this.dailySignWindowPrefab);
        this.signWindow = dailySign;
        let script = dailySign.getComponent(DailySignWindow);
        script.recieveCallBack = this._updateUserInfo.bind(this);
        script.userId = Global.getItem("userInfo").userId;


        this._getAwardsFromServer().then((result)=>{
            this.monthAwards = JSON.parse(result + "");
            script.monthSignAwards = this.monthAwards;
            script.updateAwards();
        });
        this.node.parent.addChild(dailySign);
        return;
    }

    /**
     * 签到回调
     * @param awardIno 
     */
    private _updateUserInfo(awardIno: SignAward){
        cc.log('点击回调, 奖励为：', awardIno )
        this._signToServer().then(()=>{
            let nowProp: PlayerProp = Global.getItem('playerPropObj');
            cc.log('全局道具：', nowProp);
            nowProp.diamond = nowProp.diamond + awardIno.diamond;
            nowProp.point = nowProp.point + awardIno.point;
            nowProp.gold = nowProp.gold + awardIno.gold;
            nowProp.strength = nowProp.strength + awardIno.strength;
    
            Global.setItem('playerPropObj', nowProp )
    
            // 改变headBar 
            let headBar=cc.director.getScene().getChildByName('head').getComponent(HeadBar);
            headBar.setPiont(nowProp.point);
        });
    }

    /**
     * 向后台签到
     */
    private _signToServer(){
        return new Promise((res, rej)=>{
            let dailySignClient: DailySignClient = <DailySignClient> ClientFactory.getHttpClient( DailySignClient, 'dailySign'); 
            dailySignClient.sign(1, 1,function(){
                cc.log('签到成功')
                res();
            });
        })
    }

    /**
     * 签到
     * 签到按钮绑定的签到点击方法
     */
    public  sign(){
        this.showDailySignPage();
        this.updateLoadedTimes();
    }

    /**
     * 更新当日加载主场景次数
     */
    public async updateLoadedTimes(){
        let originInfo = await cc.sys.localStorage.getItem('loadedInfo');
        let loadedInfo = null;  //解析后的数据
        if( originInfo){    //存在
            loadedInfo =  JSON.parse( originInfo ) ;
            let date1: Date = loadedInfo.dailySignTime;
            let date2: Date = new Date();
            let isTwoDayASameDay: boolean = (date1[2] == date2.getDate() && date1[1] == date2.getMonth() && date1[0] == date2.getFullYear()) ? true : false

            if(!isTwoDayASameDay){  //不是同一天，肯定是第一次进入，直接显示弹框
                this.showDailySignPage();
            }
        }else{
            //为空，用户第一次登陆
            this.showDailySignPage();
        }

        //当日登陆次数
        let newTimes = 1;
        if(loadedInfo){
            newTimes = loadedInfo.loadedTimes + 1;
        }
       
        //封装存储数据
        let currentTime: Date = new Date();
        let year: number = currentTime.getFullYear();       //获取年， 月， 日
        let month: number = currentTime.getMonth();
        let day: number = currentTime.getDate();
        //存储
        cc.sys.localStorage.setItem('loadedInfo', JSON.stringify({
            dailySignTime: [year, month, day],
            loadedTimes: newTimes
        }) );
    }


    /**
     * 从后台获取当月签到奖励
     */
    private _getAwardsFromServer(){
        return new Promise((res, rej)=>{
            let dailySignClient: DailySignClient = <DailySignClient> ClientFactory.getHttpClient( DailySignClient, 'dailySign'); 
            dailySignClient.getCurrentMonthSignAwards(1, 1,function(result){
                // cc.log('结果：', result)
                res(result);
                return result;
            });
        })
    }

}
