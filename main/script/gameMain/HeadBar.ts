const {ccclass, property} = cc._decorator;
import PropClient from '../client/Prop';
import Global from '../commons/storage/Global';
import ClientFactory, {ClientType} from '../commons/net/ClientFactory';
import {PlayerProp} from '../typings/entities';
import BitmapUitl from '../commons/util/BitmapUitl';

@ccclass
export default class HeadBar extends cc.Component {

    //钻石数量文本
    @property(cc.Label)
    textDiamond: cc.Label = null;
    //积分数量文本
    @property(cc.Label)
    textPoint: cc.Label = null;
    //体力数量文本
    @property(cc.Label)
    textStrength: cc.Label = null;
    //下一次体力恢復時刻
    @property(cc.Label)
    textStrengthRecoverTime: cc.Label = null;

    @property(cc.Button)
    headBtn : cc.Button = null;
    @property(cc.Button)
    diamondBtn : cc.Button = null;
    @property(cc.Button)
    pointBtn : cc.Button = null;
    @property(cc.Button)
    stengthBtn : cc.Button = null;

    //玩家道具对象
    playerPropObj:PlayerProp=null;

    //钻石充值框节点
    diamondpage: cc.Node = null;
    strengthpage:cc.Node = null;

    personalPage : cc.Node =null;
    modifyNamePage :cc.Node=null;

    private allowMinStrength:number=10;
    private allowScene:string='gameMain';

    onLoad() {

        
        //设置不显示fps等信息
        cc.director.setDisplayStats(false);

        cc.game.addPersistRootNode(this.node);
        this.initHeadBtn(); 
       // this.getPlayerPoint();
        this.onEvent();
        this.pointBtn.interactable=false;
        this.diamondpage=cc.director.getScene().getChildByName('diamondpage');
        this.strengthpage=cc.director.getScene().getChildByName('strengthpage');
        this.personalPage = cc.director.getScene().getChildByName('personalCenterPage');
        this.modifyNamePage = cc.director.getScene().getChildByName('modifyNameBox');

    }

    public async initHeadBtn(){
        let user = Global.getItem('userInfo');
        let avatarSprite : cc.SpriteFrame;

        if(user.avatar.substring(0,4) != 'http') {
            user.avatar = 'https://ss0.bdstatic.com/70cFuHSh_Q1YnxGkpoWK1HF6hhy/it/u=2028940690,1078059060&fm=27&gp=0.jpg';
        }

        BitmapUitl.getNetworkBitmap(user.avatar).then(value => {
            avatarSprite = value;
            this.headBtn.normalSprite = avatarSprite;
            this.headBtn.hoverSprite = avatarSprite; 
            this.headBtn.disabledSprite = avatarSprite;
            this.headBtn.pressedSprite = avatarSprite;
        });
    }
   

    onClick(event,customEventData){
        
        switch(customEventData){
            case 'showDiamondPage':
                this.showBuyPage(this.diamondpage,375);
            break;
            case 'showStrengthPage':
                this.showBuyPage(this.diamondpage,-375);
                this.showBuyPage( this.strengthpage,375);
            break;
            case 'showPersonalPage':
                this.personalPage.getComponent('PersonalCenter').loadPersonalCenter();
                break;
        }
    }

    onEvent(){
        this.node.on('showPlayerProp',()=>{

            //显示玩家积分
            this.showPlayerProp();
        });
    }

    public isCanClickBtns = (isCanClick:boolean) => {
         this.headBtn.interactable=isCanClick;
         this.diamondBtn.interactable=isCanClick;
         this.stengthBtn.interactable=isCanClick;
    }
        
    /**
     * 显示或隐藏节点
     * @param targetPage
     * @param x 
     */
    public showBuyPage(targetPage:cc.Node,x:number){
        targetPage.setPositionX(x);
    }
    /**
     * 接收玩家拥有的积分信息，并缓存起来
     */
    public  getPlayerPoint = async() => {
        
        let result = await this._getPlayerProp(Global.getItem('userInfo').id);
        if(result.toString().indexOf('Error')==-1){
            this.playerPropObj =JSON.parse(result);
        }else{
            this.playerPropObj={
                id:  3,  
                gameId : 0,
                diamond :  100, 
                gold :  100 , 
                strength : 100 , 
                groove : 100,
                point : 100
            }
        }
       
        //将用户的积分对象缓存起来
        Global.setItem('playerPropObj',this.playerPropObj);
        //显示玩家积分
        this.showPlayerProp();
    }

    
     /**
     * 显示玩家的积分/体力/钻石
     */
    public showPlayerProp = ():void => {
        let nowProp=Global.getItem('playerPropObj');
        if(!!nowProp){
            this.textDiamond.string=`${nowProp.diamond}`;
            this.textPoint.string=`${nowProp.point}`;
            this.textStrength.string=`${nowProp.strength}/${nowProp.groove}`;
            if(cc.director.getScene().name==this.allowScene){
                if(nowProp.strength<=this.allowMinStrength){
                    //cc.log('iiiiiiiiiiiiii');
                    let strengthTipScript=cc.director.getScene().getChildByName('Canvas')
                                            .getChildByName('StrengthRecoverBox').getComponent('StrengthRecoverTipBox');
                    strengthTipScript.isShowStrengthRecoverTipBox();
                }
            }
            if(nowProp.strength<nowProp.groove){
                let timeTip:string='';
                let nowDate = new Date()
                let nowHour=nowDate.getHours();
                if(nowHour>=18||nowHour<8){
                    timeTip=`08:00:00恢復${nowProp.groove/3}点体力`;
                }else if(nowHour>=8&&nowHour<12){
                    timeTip=`12:00:00恢復${nowProp.groove/3}点体力`;
                }else if(nowHour>=12&&nowHour<18){
                    timeTip=`18:00:00恢復${nowProp.groove/3}点体力`;
                }
                this.textStrengthRecoverTime.string=timeTip;
            }else{
                this.textStrengthRecoverTime.node.active=false;
            }
        }
    }

    /**
     * 获取玩家拥有的道具数据
     * @param id 玩家id
     */
    private  _getPlayerProp(id:string){
        return new Promise<string>((res, rej)=>{
            let propClient: PropClient = <PropClient> ClientFactory.getHttpClient(PropClient,'prop'); 
            propClient.getPlayerProp(parseInt(id), function (playerProp) {
                if (playerProp) {
                    res(playerProp);
                } else {
                    cc.log('获取当前玩家的道具为空');
                }
            });
        });
    }

    /**
     * 修改积分显示
     * @param newPiont  新积分
     */
    public setPiont(newPiont: number){
        this.textPoint.getComponent(cc.Label).string = newPiont + '';
    }
}
