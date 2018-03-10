import FlatList from '../../commons/UI/flatList/FlatList';
import MailItem, {ItemType} from '../../commons/UI/mail/MailItem';
import ClientFactory, {ClientType} from '../net/ClientFactory';
const {ccclass, property} = cc._decorator

/**
 * 列表可见列表项的个数
 */
const LIST_VIEW_ITEM_COUNT = 6;

/**
 * 排行信息类型
 */
class MailInfo {
    mailMessage: ItemType;
    totalCount: number;
    pageSize: number;
    // totalPage: number,
}

/**
 * 用于展示排行个数
 */
const DISPLAY_RANKING_COUNT = 200;

@ccclass
export default class MailMessage extends cc.Component {

    @property(cc.Button)
    btnClose: cc.Button = null;
    @property(cc.Prefab)
    flatListPre: cc.Prefab = null;

    @property(cc.Node)
    btnRefresh: cc.Node = null;

    private mailInfo: MailInfo = null;
    private curUid: number = 2940;
    onLoad() {

    }

    //-------------------------滑动列表事件监听 start-----------------
    onEndReached() {
        let flatList: FlatList = this.node.getComponent('FlatList');

        if (flatList.getItemDataCount() >= this.mailInfo.totalCount) {
            // 当前排行列表拥有已有所有排行数据，直接返回
            return;
        }
        let curPage = flatList.getItemDataCount() / this.mailInfo.pageSize;
        curPage += flatList.getItemDataCount() % this.mailInfo.pageSize > 0 ? 1 : 0;
        // 请求下一页的排行数据
        // this.rankingClient.listDailyRanking(this.curUid, tag, curPage + 1, dailyRankingStr => {
        //     let dailyRanking = JSON.parse(dailyRankingStr);
        //     flatList.addItemData.call(flatList, dailyRanking.pageData);
        // });
    }

    /**
     * 初始化滑动列表
     */
    // private _initFlatList() {
    //     let flatListNode = cc.instantiate(this.flatListPre);
    //     flatListNode.active = true;
    //     let flatList: FlatList = flatListNode.getComponent("FlatList");
    //     this.rankingClient.listDailyRanking(this.curUid, 1, dailyRankingStr => {
    //         let dailyRanking = JSON.parse(dailyRankingStr),
    //         rankingInfo = new MailInfo();
    //         rankingInfo. = dailyRanking.playerRanking;
    //         rankingInfo.totalCount = dailyRanking.totalCount;
    //         rankingInfo.pageSize = dailyRanking.pageSize;
    //         flatList.init({
    //             // performanceModel: true,
    //             data: dailyRanking.pageData,
    //             onEndReached: this.onEndReached.bind(this)
    //         });
    //     });
    //     this.node.addChild(flatListNode, 7, menuTab);
    // }



}
