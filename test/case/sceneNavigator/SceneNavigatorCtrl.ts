import SceneNavigator from '../../../main/script/commons/scene/SceneNavigator';
const {ccclass, property} = cc._decorator;

@ccclass
export default class SceneNavigatorCtrl extends cc.Component {

    @property(cc.EditBox)
    editScene: cc.EditBox = null;
    @property(cc.EditBox)
    editSceneInput: cc.EditBox = null;

    @property(cc.ScrollView)
    modal: cc.ScrollView = null;
    @property(cc.Label)
    tipMsgText: cc.Label = null;

    @property(cc.Label)
    sceneInputText: cc.Label = null;

    onLoad() {
        // init logic
        // let lastSceneRoute = SceneNavigator.peek();
        // if (lastSceneRoute.sceneName === 'NavigationScene.fire') {
        //     this.sceneInputText.string = `这是通过上一个场景传过来的值：${SceneNavigator.getSceneInput()}`;
        // }
        
    }

    onEnable() {
        // if (SceneNavigator.peek().sceneName === 'NavigationEndScene.fire') {
        //     this.sceneInputText.string = `这是通过上一个场景传过来的值：${SceneNavigator.getSceneInput()}`;
        // }
    }

    start() {

        if (SceneNavigator.peek().sceneName === 'NavigationEndScene.fire') {
            this.sceneInputText.string = `这是通过上一个场景传过来的值：${SceneNavigator.getSceneInput()}`;
        }
    }

    update(dt: number) {

    }

    loadNavigationScene() {
        SceneNavigator.push({sceneName: 'NavigationScene.fire'});
    }  

    showTipMsg(active: boolean, msg?: string) {
        if (active === undefined) {
            this.modal.node.active = !this.modal.node.active;
        } else {
            this.modal.node.active = active;
        }
        if (this.modal.node.active) {
            this.modal.scrollToTop();
        }
        if (!!msg) {
            this.tipMsgText.string = msg;
        }
    }

    hideTipMsg() {
        this.showTipMsg(false);
    }

    loadScene() {
        this.showTipMsg(true, '当前的场景就是场景导航器从测试列表场景依次加载过来的');
    }

    backLastScene() {
        this.showTipMsg(true, '点击右上角的"返回"按钮');
    }

    backRootScene() {
        this.showTipMsg(true, '点击右上角的"返回列表"按钮');
    }

    backSpecifiedScene() {
        let sceneName = this.editScene.string;
        if (!!sceneName) {
            SceneNavigator.popToRoute({sceneName: sceneName});
        }
    }

    transferSceneInput() {
        let sceneInput = this.editSceneInput.string; 
        if (!!sceneInput) {
            SceneNavigator.push({sceneName: 'NavigationEndScene.fire', sceneInput: sceneInput});
        }
    }
}
