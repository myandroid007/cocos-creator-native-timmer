const {ccclass, property} = cc._decorator;

@ccclass
export default class ProgressPanel extends cc.Component {

    @property(cc.Label)
    info: cc.Label = null;
    @property(cc.ProgressBar)
    progressBar: cc.ProgressBar = null;
    @property(cc.Label)
    percentInfo: cc.Label = null;

    onLoad() {
        // init logic
    }
}
