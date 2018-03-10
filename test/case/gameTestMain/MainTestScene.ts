const {ccclass, property} = cc._decorator;

@ccclass
export default class MainTestScene extends cc.Component {

    @property(cc.Button)
    label: cc.Button = null;
    onLoad() {
        
        
    }
    toScene() {
       cc.director.loadScene('gameMain');
    }
}
