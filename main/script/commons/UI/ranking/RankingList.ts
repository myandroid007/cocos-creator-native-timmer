import FlatList from '../flatList/FlatList';
import RankingItem, {ItemType} from './RankingItem';
import ClientFactory, {ClientType} from '../../net/ClientFactory';
import RankingClient from '../../../client/Ranking';
import Global from '../../storage/Global';
const {ccclass, property} = cc._decorator;

export const enum MenuTab {
    /**
     * 初级场次
     */
    PRIMARY_ZONE = 1,

    /**
     * 中级场次
     */
    INTERMEDIATE_ZONE = 2,

    /**
     * 高级场次
     */
    ADVANCED_ZONE = 3,

    /**
     * 荣耀场次
     */
    GLORY_ZONE = 4,
}

/**
 * 列表可见列表项的个数
 */
const LIST_VIEW_ITEM_COUNT = 6;

/**
 * 排行信息类型
 */
class RankingInfo {
    playerRanking: ItemType;
    totalCount: number;
    pageSize: number;
    // totalPage: number,
}

/**
 * 用于展示排行个数
 */
const DISPLAY_RANKING_COUNT = 200;

/**
 * 排行榜
 */
@ccclass
export default class RankingList extends cc.Component {
    @property(cc.Button)
    btnClose: cc.Button = null;

    @property(cc.Sprite)
    menuTab1Bg: cc.Sprite = null;
    @property(cc.Sprite)
    menuTab2Bg: cc.Sprite = null;
    @property(cc.Sprite)
    menuTab3Bg: cc.Sprite = null;
    @property(cc.Sprite)
    menuTab4Bg: cc.Sprite = null;

    @property(cc.Prefab)
    flatListPre: cc.Prefab = null;

    @property(cc.Node)
    btnRefresh: cc.Node = null;

    // 当前选中的排行榜，默认显示荣耀场次的排行
    private selectedTab: MenuTab;
    private isDisplayLatestData: boolean = false;
    private rankingInfoMap: Map<MenuTab, RankingInfo> = new Map();
    private rankingClient: RankingClient;

    // 当前玩家ID
    private curUid: number = 0; 


    onLoad() {
        // 监听刷新按钮
        this.btnRefresh.on(cc.Node.EventType.TOUCH_END, this.refresh.bind(this));
        this.curUid = Global.getItem("userInfo").id;
    }

    //-------------------------滑动列表事件监听 start-----------------
    onEndReached(tag: MenuTab) {
        let flatList: FlatList = this.node.getChildByTag(tag).getComponent('FlatList');
        let rankingInfo = this.rankingInfoMap.get(tag);
        if (flatList.getItemDataCount() >= rankingInfo.totalCount) {
            // 当前排行列表拥有已有所有排行数据，直接返回
            return;
        }
        let curPage = flatList.getItemDataCount() / rankingInfo.pageSize;
        curPage += flatList.getItemDataCount() % rankingInfo.pageSize > 0 ? 1 : 0;
        // 请求下一页的排行数据
        this.rankingClient.listDailyRanking(this.curUid, tag, curPage + 1, dailyRankingStr => {
            let dailyRanking = JSON.parse(dailyRankingStr);
            flatList.addItemData.call(flatList, dailyRanking.pageData);
        });
    }

    renderItem(tag: MenuTab, item: ItemType, itemNode: cc.Node, index: number) {
        let rankingInfo = this.rankingInfoMap.get(tag);
        let rankingItem = itemNode.getComponent(RankingItem);
        if (!!rankingInfo.playerRanking) {
            if (rankingInfo.playerRanking.uid == item.uid) {
                //------如果当前的列表项为玩家自己，则选中当前列表项
                rankingItem.select();

                //------通过玩家排行列表项的位置，自动隐藏和显示滑动列表底部
                let flatList: FlatList = this.node.getChildByTag(tag).getComponent('FlatList');
                // 滑动列表正好紧邻可视区域底部和顶部的Y坐标
                let marginTopPosY = flatList.getViewHeight() / 2 + itemNode.height / 2;
                let marginBottomPosY = -marginTopPosY;
                // let paddingTopPosY = marginTopPosY - itemNode.height;
                let paddingBottomPosY = marginBottomPosY + itemNode.height;
                let curPosY = flatList.getPositionInView(itemNode).y;
                if (curPosY < paddingBottomPosY) {
                    flatList.showFooter();
                    itemNode.active = false;
                } else if (curPosY >= paddingBottomPosY && curPosY < marginTopPosY) {
                    flatList.hideFooter();
                    itemNode.active = true;
                } else if (curPosY >= marginTopPosY) {
                    flatList.showFooter();
                }
            } else {
                rankingItem.unselect();
            }
        }
    }

    renderFooter(tag: MenuTab, originalNode: cc.Node) {
        let rankingInfo = this.rankingInfoMap.get(tag);
        if (!rankingInfo.playerRanking) {
            originalNode.getChildByName('emptyItem').active = true;
            originalNode.getChildByName('item').active = false;
            return;
        }

        let rankingItem: RankingItem = originalNode.getChildByName('item').getComponent(RankingItem);
        if (!!rankingInfo.playerRanking) {
            rankingItem.updateItem.call(rankingItem, 1, 0, rankingInfo.playerRanking);
            rankingItem.node.active = true;
            if (rankingInfo.playerRanking.ranking > LIST_VIEW_ITEM_COUNT) {
                originalNode.active = true;
            } else {
                originalNode.active = false;
            }
            originalNode.getChildByName('emptyItem').active = false;
        }
    }
    //-------------------------滑动列表事件监听 end-----------------

    /**
     * 初始化排行榜
     *
     * @param selectedTab 打开排行榜默认选中的菜单项，如果不传，则默认选中荣耀场
     * @param isDisplayLatestData 每次打开排行榜都显示最新数据，如果不传默认显示旧数，只有用户自己刷新时才显示新数据
     */
    public init(selectedTab?: MenuTab, isDisplayLatestData?: boolean) {
        this.selectedTab = selectedTab || MenuTab.GLORY_ZONE;
        this.isDisplayLatestData = isDisplayLatestData;
        this.rankingClient = <RankingClient> ClientFactory.getHttpClient(RankingClient, 'ranking');
        this._changeSelectedMenuStatus(this.selectedTab);
        this._initFlatList(this.selectedTab);
    }

    /**
     * 初始化多个滑动列表
     */
    private _initFlatList(menuTab: MenuTab) {
        let flatListNode = cc.instantiate(this.flatListPre);
        flatListNode.active = true;
        let flatList: FlatList = flatListNode.getComponent("FlatList");
        this.rankingClient.listDailyRanking(this.curUid, menuTab, 1, dailyRankingStr => {
            let dailyRanking = JSON.parse(dailyRankingStr),
                rankingInfo = new RankingInfo();
            rankingInfo.playerRanking = dailyRanking.playerRanking;
            rankingInfo.totalCount = dailyRanking.totalCount;
            rankingInfo.pageSize = dailyRanking.pageSize;
            this.rankingInfoMap.set(menuTab, rankingInfo);
            flatList.init({
                renderItem: this.renderItem.bind(this),
                renderFooter: this.renderFooter.bind(this),
                // performanceModel: true,
                data: dailyRanking.pageData,
                onEndReached: this.onEndReached.bind(this)
            });
        });
        this.node.addChild(flatListNode, 7, menuTab);
    }

    /**
     * 选择指定的排行榜菜单
     *
     * @param menuTab 需要选择的排行榜菜单
     */
    public selectMenu(event, menuTab: string | MenuTab) {
        let selectedTab: MenuTab = typeof menuTab === 'string' ? parseInt(menuTab) : menuTab;
        if (menuTab != this.selectedTab) {
            this._changeSelectedMenuStatus(selectedTab);
            this._showFlatList(selectedTab);
        }

        this.selectedTab = selectedTab;
    }

    /**
     * 刷新当前显示的排行列
     */
    public refresh(event) {
        let flatList: FlatList = this.node.getChildByTag(this.selectedTab).getComponent('FlatList');
        this.rankingClient.listDailyRanking(this.curUid, this.selectedTab, 1, dailyRankingStr => {
            let dailyRanking = JSON.parse(dailyRankingStr),
                rankingInfo = this.rankingInfoMap.get(this.selectedTab);
            rankingInfo.playerRanking = dailyRanking.playerRanking;
            rankingInfo.totalCount = dailyRanking.totalCount;
            rankingInfo.pageSize = dailyRanking.pageSize;
            flatList.refresh(dailyRanking.pageData, null, this.renderFooter.bind(this));
        });
    }

    /**
     * 改变被选中菜单的状态
     *
     * @param menuTab 被选中的菜单选项
     */
   private _changeSelectedMenuStatus(menuTab: MenuTab) {
            // 改变之前选中菜单项的状态
            switch (this.selectedTab) {
                case MenuTab.PRIMARY_ZONE:
                    this.menuTab1Bg.node.active = false;
                    break;
                case MenuTab.INTERMEDIATE_ZONE:
                    this.menuTab2Bg.node.active = false;
                    break;
                case MenuTab.ADVANCED_ZONE:
                    this.menuTab3Bg.node.active = false;
                    break;
                case MenuTab.GLORY_ZONE:
                    this.menuTab4Bg.node.active = false;
                    break;
                default:
                    break;

            }
            // 改变当前选中菜单项的状态
            switch (menuTab) {
                case MenuTab.PRIMARY_ZONE:
                    this.menuTab1Bg.node.active = true;
                    break;
                case MenuTab.INTERMEDIATE_ZONE:
                    this.menuTab2Bg.node.active = true;
                    break;
                case MenuTab.ADVANCED_ZONE:
                    this.menuTab3Bg.node.active = true;
                    break;
                case MenuTab.GLORY_ZONE:
                    this.menuTab4Bg.node.active = true;
                    break;
                default:
                    break;
            }
    }

    /**
     * 显示对应菜单的排行滑动列表
     *
     * @param menuTab 菜单选项卡
     */
    private _showFlatList(menuTab: MenuTab) {
        // 隐藏之前显示的排行滑动列表
        let flatList = this.node.getChildByTag(this.selectedTab);
        if (!!flatList) {
            flatList.active = false;
        }

        // 显示当前选中的排行滑动列表
        flatList = this.node.getChildByTag(menuTab);
        if (!flatList) {
            this._initFlatList(menuTab);
        } else {
            flatList.active = true;
        }
    }

    /**
     * 显示排行列表
     */
    public show() {
        if (this.isDisplayLatestData) {
            this.refresh(null);
        }
        this.node.active = true;
    }

    /**
     * 关闭排行榜
     */
    public close() {
        this.node.active = false;
    }
}
