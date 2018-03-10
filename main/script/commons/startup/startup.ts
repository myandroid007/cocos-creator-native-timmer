import HotUpdate from "../update/HotUpdate";
import ProgressPanel from "../UI/ProgressPanel";

const {ccclass, property} = cc._decorator;

@ccclass
export default class Startup extends cc.Component {

    /** 热更新相关组件 */
    @property(ProgressPanel)
    panel: ProgressPanel = null;
    @property(cc.RawAsset)
    manifestUrl: cc.RawAsset = null;

    onLoad() {
        // TODO 2018/3/1 硬更新检测

        //----------热更新检测------------
        HotUpdate.init({
           panel: this.panel,
           manifestUrl: this.manifestUrl,
           projectName: 'eliminate',
           onEnd: this.validateLogin.bind(this),
        });
        HotUpdate.checkUpdate();

        //-------------登录验证-----------

        // TODO 2018/3/1 资源预加载
    }

    onDestroy() {
        HotUpdate.onDestroy();
    }

    /**
     * 登录验证，如果本地有用户的验证信息则进行自动登录，否则进入登录界面
     */
    validateLogin() {
        let userIdentity = cc.sys.localStorage.getItem('userIdentity');
        if (!userIdentity) {
            cc.director.loadScene("login");
        } else {
            // 本地保存有上次用户的登录信息，进入自动登录页面
            cc.director.loadScene("autologin");
        }
    }
}
