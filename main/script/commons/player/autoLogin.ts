const { ccclass, property } = cc._decorator;
import { loginConf } from '../../conf/loginConf';
import Global from '../storage/Global';

@ccclass
export default class AutoLogin extends cc.Component {

    @property(cc.Label)
    comebackLabel: cc.Label = null;

    @property(cc.Label)
    loadingLabel: cc.Label = null;

    @property(cc.ProgressBar)
    loadingprogressBar:cc.ProgressBar=null;

    speed:number=0.3;
    runLoadingBar:boolean=false;
    hasLoginSuccess:boolean=false;

    xmlhttp:XMLHttpRequest=null;

    onLoad() {
        // init logic
        cc.info("autoLogin scene is onloading")
        this.runLoadingBar = true;
        this.comebackLabel.string="";
        this.xmlhttp=cc.loader.getXMLHttpRequest();
        //调用自动登录逻辑
        this.autoLogin();
    }
    update(dt){
        this.updateProgressBar(this.loadingprogressBar, dt);
    }

    private setGlobalUserInfoJson(userInfoJson){
        userInfoJson.id=userInfoJson.userId;
        userInfoJson.username = userInfoJson.userName;
        userInfoJson.nickname = userInfoJson.nickName;
        Global.setItem('userInfo',userInfoJson);
    }

    /**
     * 调用自动登录方法
     */
    private autoLogin() {
        let userIdentity: any = JSON.parse(cc.sys.localStorage.getItem('userIdentity'));
        //let userIdentity: any = JSON.parse('{"groupIds":[],"loginData":{"uid":9513,"jsessionId":"E007ABAF3D43C6F554F802F480BD0743","version":1,"hash":"f014416bb4911fd1d1a21dc46ded44fe"}}');
        console.log(userIdentity.loginData);
        let loginDataString:string=this.handleAutoLoginParameter(userIdentity.loginData);

        this.handleAutoLogin(loginDataString);

    }

    /**
     * 处理登录逻辑
     * @param loginDataString 登录所需参数
     */
    private handleAutoLogin(loginDataString: string) {
        cc.info("xmlhttp:" + this.xmlhttp);
        this.xmlhttp.open("GET", loginConf.autoLoginServerUrl+loginDataString, true);
        //xmlhttp.setRequestHeader("Content-type", "text/javascript;charset=utf-8");
        this.xmlhttp.setRequestHeader("Accept","text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8");
        // xmlhttp.setRequestHeader("cookie","JSESSIONID=3E52B118FF4B19F17B455DABEC270EA4; bbsUserId=1; JSESSIONID=3E52B118FF4B19F17B455DABEC270EA4");
        
        let ajaxLoginResponse=()=>{
            if (this.xmlhttp.readyState == 4 && this.xmlhttp.status == 200) {
                cc.info("服务端成功返回success");
                cc.info("服务端返回:" + this.xmlhttp.responseText+","+this.xmlhttp.responseText);
                let responseJsonData=JSON.parse(this.xmlhttp.responseText);
                cc.info("处理后的返回数据:"+responseJsonData+",,,"+responseJsonData.status);
                if (responseJsonData.status=='success'){
                    //登录成功后的逻辑处理
                    let userInfo=responseJsonData.msg.userInfo;

                    this.setGlobalUserInfoJson(responseJsonData.msg.userInfo);
                    loginConf.userName=userInfo.nickName;
                    this.handleAfterAutoLoginSuccess();
    
                }else {//自动登录失败,清除本地化数据，跳转到登录页面
                    cc.sys.localStorage.removeItem('userIdentity');
                    cc.director.loadScene("login");
                }
            } 
        }

        this.xmlhttp.onreadystatechange =ajaxLoginResponse;
        this.xmlhttp.send();
    }

    

    /**
     * 更改进度条的加载
     * @param progressBar 进度条对象
     * @param dt 时间帧
     */
    private updateProgressBar(progressBar:cc.ProgressBar, dt:any){
        let progress = progressBar.progress;
        if(progress < 1.0 && (this.runLoadingBar||this.hasLoginSuccess)){
            progress += dt * this.speed;
        }
        let progressPercentage=parseInt(progress*100+"");
        if(progressPercentage==70){
            this.runLoadingBar=false;
        }else if (progressPercentage==100){//登录完成情况
            cc.director.loadScene("gameMain");
        }
        this.loadingLabel.string="正在加载"+progressPercentage+"%";
        progressBar.progress = progress;
    }

    /**
     * 登录成功后继续加载的进度条、显示欢迎字段
     */
    public handleAfterAutoLoginSuccess(){
        this.hasLoginSuccess=true;
        this.comebackLabel.string="欢迎回来，"+loginConf.userName;
    }

    /**
     * 转换成ajax提交的字符串
     * @param userIdentity 本地存的上次登录信息
     */
    private handleAutoLoginParameter(userIdentity: any): string {
        let parameterString: string = "&appName="+loginConf.appName+"&";
        for (var key in userIdentity) {
            parameterString += key + '=' + userIdentity[key]+'&';
        }
        parameterString=parameterString.substring(0,parameterString.length-1);
        return parameterString;
    }



}
