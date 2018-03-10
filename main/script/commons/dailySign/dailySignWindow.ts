import ScaleToHide from "../UI/display/scaleToHide";
import {SignAward} from '../../typings/entities';
import recieveAwardPage from "./recieveAward";



const {ccclass, property} = cc._decorator;

/**
 * 每日签到弹框的绑定文件，实现了页面关闭，奖励展示，领取按钮等功能。
 * 用户可双击其预制资源修改显示的图片资源，也可以获取此绑定脚本实现数据修改
 * @author 刘磊
 * @since 2018.2.2
 */
@ccclass
export default class DailySignWindow extends cc.Component {

    @property([cc.SpriteFrame])
    awardFrames: [cc.SpriteFrame] = [null];

    @property(cc.Prefab)
    awardItem: cc.Prefab = null;

    @property(cc.Prefab)        //确认领取页面预制
    recieveAwardPagePrefab: cc.Prefab = null;

    @property(cc.SpriteFrame)   //未能识别的奖励图片
    unkownAwardFrame: cc.SpriteFrame = null;

    userId: number = null;  //用户id



    awards: cc.Node[] = [];     //奖励节点集合
    monthSignAwards: SignAward[] = []   //本月签到奖励数据源

    todayAwardIndex: number = null;

    signInfo: Date[] = [];    //签到日期数组

    recieveCallBack: Function = null;


     onLoad() {
        this._setButtonTouchable(false);
    }
    
    public async updateAwards(){
        await this._initSignInfo();
        this._initAward();
        this._grayAwards();
        this._stopTouchPropagation();
        this._changeMonthShow();    //更改月份显示
        this._changeContinueSignTimes();    //更改签到次数
        this._isTodayHasSignedCheck();  //检查今日是否已签到
        this._hideNetTip();
    }

    /**
     * 隐藏网络提示节点
     */
    private _hideNetTip(){
        this.node.getChildByName('netTip').active = false;
    }
    /**
     * 初始化 签到信息
     */
    private async _initSignInfo(){
        let today = new Date();
        let originInfo =  await cc.sys.localStorage.getItem('signInfo' + this.userId);
        if(originInfo){
            let parsedSignInfo = JSON.parse(originInfo);
            if(parsedSignInfo.month == today.getMonth()){
                this.signInfo = parsedSignInfo.dates;
                return;
            }
        }
        await cc.sys.localStorage.setItem('signInfo' + this.userId, JSON.stringify({
            month: today.getMonth(),
            dates: []
        }))
    }

    /**
     * 更新签到信息
     */
    private async _updateSignInfo(){
        this.signInfo.push(new Date());
        await cc.sys.localStorage.setItem('signInfo' + this.userId, JSON.stringify({
            month: new Date().getMonth(),
            dates: this.signInfo
        }))
    }

    /**
     * 关闭当前节点
     */
    public closePage(){

        //添加关闭动画
        let scaleToHide = this.node.addComponent(ScaleToHide);
        //动画完成回调，销毁节点
        scaleToHide.runFinishedCallBack = () => { 
            this.node.destroy();
        };
        this.node.getChildByName('black_mask').destroy();
        scaleToHide.run();
    }


    /**
     * 初始化奖励物品显示
     */
    private _initAward(){
        //tale节点内自带layout组件可自动布局，其子节点能自动排列
        // let mask = this.node.getChildByName('mask');
        let table = this.node.getChildByName('mask').getChildByName('view').getChildByName('content').getChildByName('item');
        table.getComponent(cc.Layout).cellSize = cc.size(table.width /5,table.width /5);
        //生成子节点
        for(let i=0; i<= this.monthSignAwards.length-1; i++){
            let award: cc.Node = cc.instantiate(this.awardItem);
            let awardName = '';
            for(let name in this.monthSignAwards[i]){
                if(this.monthSignAwards[i][name] > 0){
                    awardName = name + '';
                    break;
                }
            }
            award.getChildByName('award').getComponent(cc.Sprite).spriteFrame = this._getSpecifiedFrame(awardName);
            award.getChildByName('amount').getComponent(cc.Label).string = 'x ' + this.monthSignAwards[i][awardName] ;
            table.addChild(award);
            this.awards.push(award);
        }
    }

    /**
     * 将制定物品置灰
     */
    private _grayAwards(){
        let signedDays: number = this.signInfo.length;
        //透明度： 0-255
        for(let i=0; i<= signedDays-1; i++){
            if(this.awards[i].opacity < 255){
                continue;
            }
            this.awards[i].opacity = 120;
            this.todayAwardIndex = i;
        }
    }

    /**
     * 领取奖励
     */
    public recieveAward(){
        this._updateSignInfo();
        this._grayAwards();
        this._setButtonTouchable(false);
        this._updateUserPropInfo();
        this._showRecievePage();
        this._changeContinueSignTimes();    //修改连续签到次数
    }

    /**
     * 获取本次签到奖励
     * @returns [cc.SpriteFrame,string ] 返回的奖励图片和显示的数量，如X10
     */
    private _getCurrentSignAward(): [cc.SpriteFrame, string]{
        for(let i= this.awards.length-1; i>=0; i--){
            if(this.awards[i].opacity < 255){
                let spriteFrame : cc.SpriteFrame = this.awards[i].getChildByName('award').getComponent(cc.Sprite).spriteFrame;
                let amount: string =  this.awards[i].getChildByName('amount').getComponent(cc.Label).string;
                return [spriteFrame, amount];
            }
        }
    }

    /**
     * 显示确认领取页面
     */
    private  _showRecievePage(){
        let recievePage: cc.Node = cc.instantiate(this.recieveAwardPagePrefab);
        this.node.addChild(recievePage);
        //显示奖励
        let award: [cc.SpriteFrame, string] = this._getCurrentSignAward();
        recievePage.getComponent(recieveAwardPage).showAward(award[0], award[1]);
    }

    /**
     * 显示签到提示说明
     */
    public showSignTip(){
        // let tip = new cc.Node();
        // tip.addComponent(cc.Label).string = '打扎好，我是渣渣辉';
        // this.node.addChild(tip);
        // this.scheduleOnce(()=>{
        //     tip.destroy();
        // },2)

        this.node.getChildByName('tip').active = true;
        this.scheduleOnce(()=>{
            this.node.getChildByName('tip').active = false;

        },1.5)
    }

    /**
     * 修改用户道具信息
     */
    private _updateUserPropInfo(){
        let signedDays: number = this.signInfo.length;
        //奖励信息
        let awradInfo = this.monthSignAwards[this.todayAwardIndex];
        if(!this.recieveCallBack){
            alert('未传入领取回调方法！！')
        }else{
            this.recieveCallBack(awradInfo);
        }
    }


    /**
     * 返回指定名称的资源spriteFrame
     * @param name 
     */
    private _getSpecifiedFrame(name: string): cc.SpriteFrame{
        let result: cc.SpriteFrame = null;
        for(let i=0; i<= this.awardFrames.length-1; i++){
            if(this.awardFrames[i].name == name){
                return this.awardFrames[i];
            }
        }

        cc.log('没有此种类型的资源,使用默认不识别图片', name);
        return this.unkownAwardFrame;
    }   

    /**
     * 设置领取按钮的可点击性
     * @param flag 是否可点击
     */
    private _setButtonTouchable(flag: boolean){
        this.node.getChildByName('btn_confirm').getComponent(cc.Button).interactable = flag;
    }

    /** 
     * 停止点击事件冒泡
    */
    private _stopTouchPropagation(){
        this.node.getChildByName('black_mask').on(cc.Node.EventType.TOUCH_START,(event)=>{
            event.stopPropagation();
        })
    }


    /**
     * 修改月份显示
     */
    private _changeMonthShow(){
        let currentMonth = new Date().getMonth() + 1;
        this.node.getChildByName('context_month').getComponent(cc.Label).string = `(${currentMonth}月)`;
        this.node.getChildByName('context_continue_sign').getComponent(cc.Label).string = `${currentMonth}月已连续签到N天`;
    }

    /**
     * 修改当月连续签到次数
     */
    private async _changeContinueSignTimes(){
        let originInfo =  await cc.sys.localStorage.getItem('signInfo' + this.userId);
        let month: string = this.node.getChildByName('context_continue_sign').getComponent(cc.Label).string.slice(0,1);
        if(originInfo){
            let parsedSignInfo = JSON.parse(originInfo);
            if(parsedSignInfo.dates.length >=0){
                this.node.getChildByName('context_continue_sign').getComponent(cc.Label).string = `${month}月已连续签到${parsedSignInfo.dates.length}天`
            };
        }
    }

    /**
     * 今日是否已经领取奖励判断
     */
    private _isTodayHasSignedCheck(){
        let lastDay = new Date( this.signInfo[this.signInfo.length -1] );
        if(lastDay.toString() == "Invalid Date"){       //未签到过
            this._setButtonTouchable(true);
            return;
        }
        let today = new Date();
        
        let isSameYear: boolean = (lastDay.getFullYear() == today.getFullYear())? true: false;
        let isSameMonth: boolean = (lastDay.getMonth() == today.getMonth())? true: false;
        let isSameDay: boolean = (lastDay.getDate() == today.getDate())? true: false;
        cc.log('鉴定：',isSameYear,isSameMonth,isSameDay)
        
        if(isSameYear && isSameMonth && isSameDay ){ //同一天，即今天已领取，禁用按钮
            //     cc.log('xxxxxxxxx')
            this._setButtonTouchable(false);
        }

    }

}
