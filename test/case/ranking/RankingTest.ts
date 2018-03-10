import SceneNavigator from '../../../main/script/commons/scene/SceneNavigator';
import RankingList, { MenuTab } from '../../../main/script/commons/UI/ranking/RankingList';
const {ccclass, property} = cc._decorator;

@ccclass
export default class RankingTest extends cc.Component {
    @property(cc.Prefab)
    rankingListPre: cc.Prefab = null;

    private rankingList: RankingList;

    onLoad() {
        // init logic
    }

    enterRankingScene() {
        if (this.rankingList) {
            this.rankingList.show();
        } else {
            let rankingList = cc.instantiate(this.rankingListPre);
            this.rankingList = rankingList.getComponent("RankingList");
            this.rankingList.init(MenuTab.PRIMARY_ZONE, true);
            this.node.addChild(rankingList);
        }
    }
}
