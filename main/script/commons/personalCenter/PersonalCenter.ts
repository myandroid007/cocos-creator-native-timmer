const { ccclass, property } = cc._decorator;
import PlayerClient from '../../client/Player';
import PlayStatisticsClient from '../../client/PlayStatistics';
import ClientFactory, { ClientType } from '../../commons/net/ClientFactory';
import { EPlayer } from '../../typings/entities';
import Global from '../storage/Global';
import { loginConf } from '../../conf/loginConf';
import BitmapUitl from '../../commons/util/BitmapUitl';

@ccclass
export default class PersonalCenter extends cc.Component {


    //个人中心页面
    @property(cc.Node)
    personalBox: cc.Node = null;

    //玩家信息
    @property(cc.Button)
    playerAvatar: cc.Button = null;
    @property(cc.Label)
    playerNickName: cc.Label = null;
    @property(cc.Button)
    updateNickNameBtn: cc.Button = null;
    @property(cc.Label)
    playerId: cc.Label = null;
    @property(cc.Label)
    level: cc.Label = null;
    @property(cc.Label)
    experience: cc.Label = null;

    //统计信息
    @property(cc.Label)
    totalTimes: cc.Label = null;
    @property(cc.Label)
    firstTimes: cc.Label = null;
    //最高连胜场次数
    @property(cc.Label)
    consecutiveWins: cc.Label = null;
    //历史单场最高分
    @property(cc.Label)
    highestSocre: cc.Label = null;
    //近百场胜率 %xx + 超过 %yy 的玩家
    @property(cc.RichText)
    winAndBeyondRate: cc.RichText = null;

    @property(cc.Button)
    logOutBtn: cc.Button = null;

    //修改昵称页面
    @property(cc.Node)
    modifyNameLayout: cc.Node = null;
    @property(cc.EditBox)
    newName: cc.EditBox = null;
    @property(cc.Label)
    nameTipLabel: cc.Label = null;
    @property(cc.Button)
    modifyNameBtn: cc.Button = null;

    onLoad() {
        // init logic
        

        this.personalBox = cc.director.getScene().getChildByName('personalCenterPage');
        
        //this.modifyNameLayout = this.personalBox.getChildByName('modifyNameBox');
        cc.game.addPersistRootNode(this.personalBox);
        //cc.log(this.personalBox);
       // cc.game.addPersistRootNode(this.modifyNameLayout);
    }
    /**
     * 关闭个人中心
     */
    public closePersonalCenter() {
        this.personalBox.setPositionX(-375);
    }
    /**
     * 加载用户数据事件
     */
    public loadPersonalCenter() {
        this.personalBox.setPositionX(375);
        let userInfo=Global.getItem('userInfo');
        //判断内存中是否有玩家信息
        this._getPlayerById(userInfo.userId).then(value => {
            this._processPlayerData(value);
            //页面玩家渲染数据
            this._renderingPlayerInfo(Global.getItem('player'));
        });

        // if (null == Global.getItem('player')){
        //     //通过thrift请求后台数据
        //     let playerResult = await this._getPlayerById(9521);
        //     //处理获得的数据
        //     this._processPlayerData(playerResult);
        // }

        //处理加载玩家玩耍统计基本信息
        this._getPlayStatisticsById(userInfo.userId).then(value => {
            this._renderingPlayStatistic(value);
        });

    }
    /**
     * 加载用户数据事件
     */
    public reloadData() {
        let userInfo=Global.getItem('userInfo');
        //判断内存中是否有玩家信息
        this._getPlayerById(userInfo.userId).then(value => {
            this._processPlayerData(value);
            //页面玩家渲染数据
            this._renderingPlayerInfo(Global.getItem('player'));
        });

        // if (null == Global.getItem('player')){
        //     //通过thrift请求后台数据
        //     let playerResult = await this._getPlayerById(9521);
        //     //处理获得的数据
        //     this._processPlayerData(playerResult);
        // }

        //处理加载玩家玩耍统计基本信息
        this._getPlayStatisticsById(userInfo.userId).then(value => {
            this._renderingPlayStatistic(value);
        });

    }

    /**
     * 修改昵称
     * @param uid 
     * @param nickName 
     */
    public async modifyNameEvent() {
        if( ! this.validateNewName()){
            return;
        }

        //TODO
        let userInfo=Global.getItem('userInfo');
        let newName:string = this.newName.string;
        let modifyResult = await this._modifyName(userInfo.userId, newName);
        let modifyJsonResult = JSON.parse(modifyResult);
        if(modifyJsonResult.status != "success"){
            this.nameTipLabel.string=modifyJsonResult.data.msg;
            return;
        }

        
        this._processPlayerData(modifyResult);
        this._renderingPlayerInfo(Global.getItem('player'));
        this.closeModifyNamePage();
    }

    private validateNewName():boolean{
        cc.info("输入名字："+this.newName.string);
        let reg=/[`~!@#$%^&*()_+<>?:"{},.\/;'[\]]/im;
        if (reg.test(this.newName.string)) {
            this.nameTipLabel.string = '输入名字中含有非法字符';
            return false;
        }
        return true;
    }


    public openModifyNamePage() {
        this.modifyNameLayout.setPositionX(0);
    }

    public closeModifyNamePage() {
        this.modifyNameLayout.setPositionX(-750);
    }

    

    /**
      * 1.向服务端发起请求删除session中的对应uid保存的用户信息
      * 2.删除本地化参数
      * 3.删除内存中的用户信息
      * 4.跳转到登陆场景
      */
    public logout() {
        cc.info("触发logout");
        let xmlhttp;
        if (xmlhttp == null) {
            xmlhttp = cc.loader.getXMLHttpRequest();
        }
        xmlhttp.open("GET", loginConf.logoutServerUrl + '&appName=' + loginConf.appName, true);
        let ajaxLoginResponse = () => {
            if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {//服务端请求成功后
            }
        }

        xmlhttp.onreadystatechange = ajaxLoginResponse;
        xmlhttp.send();

        //1.删除内存中的信息
        Global.removeItem('player');
        Global.removeItem('userInfo');
        //2.删除本地化的信息
        cc.sys.localStorage.removeItem('userIdentity');

        //移除顶部常驻
        let head = cc.director.getScene().getChildByName('head');
        head.setPositionX(-375);
        this.personalBox.setPositionX(-375);

        //3.跳转到登录场景
        cc.director.loadScene('login');
    }

    /**
     * 处理获得的用户数据
     * 1.将获得返回数据转为EPlayer对象存储
     * 2.存入Global
     */
    private _processPlayerData(playerResult: string) {
        cc.info(playerResult);
        let playerJsonResult = JSON.parse(playerResult);
        if (playerJsonResult.status != "success") {//加载失败的情况
            return;
        }
        //加载数据成功
        let playerJsonData = playerJsonResult.data;
        let player: EPlayer = {
            username: playerJsonData.username,
            nickname: playerJsonData.nickname,
            id: playerJsonData.id,
            avatar: playerJsonData.avatar,
            isVirtual: playerJsonData.isVirtual,
            level: playerJsonData.level,
            totalExperience: playerJsonData.totalExperience,
            currentExperience: playerJsonData.point
        }
        Global.getItem('userInfo').userName=player.username;
        Global.getItem('userInfo').username=player.username;
        //存入内存中
        Global.setItem('player', player);

    }

    /**
     * 加载用户数据到界面
     */
    private async _renderingPlayerInfo(player: EPlayer) {
        this.playerNickName.string = player.nickname;
        this.playerId.string = player.id.toString();
        this.level.string = player.level;
        if(null != player.totalExperience && undefined != player.totalExperience) {
            this.experience.string = player.currentExperience + "/" + player.totalExperience;
        }

        let avatarSprite : cc.SpriteFrame;
        if(player.avatar.substring(0,4) != 'http') {
            player.avatar = 'https://ss0.bdstatic.com/70cFuHSh_Q1YnxGkpoWK1HF6hhy/it/u=2028940690,1078059060&fm=27&gp=0.jpg';
        }

        BitmapUitl.getNetworkBitmap(player.avatar).then(value => {
            avatarSprite = value;
            this.playerAvatar.normalSprite = avatarSprite;
            this.playerAvatar.hoverSprite = avatarSprite; 
            this.playerAvatar.disabledSprite = avatarSprite;
            this.playerAvatar.pressedSprite = avatarSprite;
        });
       

    }

    /**
     * 渲染统计信息到界面
     * @param playStatisticResult 
     */
    private _renderingPlayStatistic(playStatisticResult: string) {
        let playStatisticJsonResult = JSON.parse(playStatisticResult);

        if (playStatisticJsonResult.status != "success") {//加载统计数据失败的情况
            return;
        }

        let playStatisticVo = playStatisticJsonResult.data;
        this.totalTimes.string = playStatisticVo.totalTimes;
        this.firstTimes.string = playStatisticVo.firstTimes;
        this.consecutiveWins.string = playStatisticVo.consecutiveWins;
        //最高分数
        this.highestSocre.string = this._getMaxSocres(playStatisticResult);
        this.winAndBeyondRate.string = "<color=#000000>胜率" + playStatisticVo.winRate + "%</c><color=red>超过" + playStatisticVo.beyondOthersRate + "%的玩家</color>";

    }

    private _getMaxSocres(playStatisticResult: string): string {
        let jsonData = JSON.parse(playStatisticResult).data;
        var scoreArray = new Array();
        scoreArray.push(jsonData.zone1HighestScore);
        scoreArray.push(jsonData.zone2HighestSocre);
        scoreArray.push(jsonData.zone3HighestScore);
        scoreArray.push(jsonData.zone4HighestScore);

        let max = scoreArray[0];
        for (let i = 0; i < scoreArray.length; i++) {
            if (max < scoreArray[i]) {
                max = scoreArray[i];
            }
        }
        return max;
    }

    /**
     * 发起Thrift请求，通过玩家id查询玩家基本信息
     * @param uid 玩家id
     */
    private _getPlayerById(uid: number) {
        return new Promise<string>((res, rej) => {
            let playerClient: PlayerClient = <PlayerClient>ClientFactory.getHttpClient(PlayerClient, 'player');
            playerClient.getPlayerByUid(uid, function (result) {
                res(result);
            });
        })
    }

    /**
     * 发起Thrift请求，通过玩家id发起修改玩家昵称的Thrift网络请求
     * @param uid 玩家id
     * @param newName 新的昵称
     */
    private _modifyName(uid: number, newName: string) {
        return new Promise<string>((res, rej) => {
            let playerClient: PlayerClient = <PlayerClient>ClientFactory.getHttpClient(PlayerClient, 'player');
            playerClient.updateNickNameByUid(uid, newName, function (result) {
                res(result);
            });
        })
    }


    /**
     * 发起Thrift请求，通过玩家id查询玩家玩耍基本统计信息
     * @param uid 玩家id
     */
    private _getPlayStatisticsById(uid: number) {
        return new Promise<string>((res, rej) => {
            let playStatisticsClient: PlayStatisticsClient = <PlayStatisticsClient>ClientFactory.getHttpClient(PlayStatisticsClient, 'playStatistic');
            playStatisticsClient.getPlayStatisticsByUid(uid, function (result) {
                res(result);
            });
        })
    }

}
