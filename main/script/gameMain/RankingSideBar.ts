import ClientFactory, {ClientType} from '../commons/net/ClientFactory';
import RankingClient from '../client/Ranking';
import RankingList, {MenuTab} from '../commons/UI/ranking/RankingList';
import {ItemType} from '../commons/UI/ranking/RankingItem';
const {ccclass, property} = cc._decorator;

@ccclass
export default class RankingSideBar extends cc.Component {
    @property(cc.Sprite)
    firstPlace: cc.Sprite = null;
    @property(cc.Sprite)
    secondPlace: cc.Sprite = null;
    @property(cc.Sprite)
    thirdPlace: cc.Sprite = null;

    @property(cc.Node)
    btnShowMore: cc.Node = null;

    @property(cc.Prefab)
    rankingListPre: cc.Prefab = null;

    private rankingList: RankingList;
    private rankingClient: RankingClient;
    private briefRankingItem: Array<ItemType> = [];

    onLoad() {
        // 为显示更多排行按钮添加事件监听
        this.btnShowMore.on(cc.Node.EventType.TOUCH_END, this._showMore.bind(this));

        // 初始化排行客户端
        this.rankingClient = <RankingClient> ClientFactory.getHttpClient(RankingClient, 'ranking');
        this._showBrief();
    }

    /**
     * 显示简略排行信息，默认显示荣耀场的前三位
     */
    private _showBrief() {
        this.rankingClient.listSpecifiedDailyRanking(MenuTab.GLORY_ZONE, 0, 3, rankingItemsStr => {
            this.briefRankingItem = JSON.parse(rankingItemsStr);
            if (!!this.briefRankingItem && this.briefRankingItem.length > 0) {
                if (!!this.briefRankingItem[0] && !!this.briefRankingItem[0].avatar) {
                    cc.loader.load({url: this.briefRankingItem[0].avatar, type: !!this.briefRankingItem[0].avatarType ? this.briefRankingItem[0].avatarType : 'jpg'}, (err, tex) => {
                        if (!err) {
                            this.firstPlace.getComponent(cc.Sprite).spriteFrame = new cc.SpriteFrame(tex);
                        }
                        // ignore error
                    });
                }
                if (!!this.briefRankingItem[1] && !!this.briefRankingItem[1].avatar) {
                    cc.loader.load({url: this.briefRankingItem[1].avatar, type: !!this.briefRankingItem[1].avatarType ? this.briefRankingItem[1].avatarType : 'jpg'}, (err, tex) => {
                        if (!err) {
                            this.secondPlace.getComponent(cc.Sprite).spriteFrame = new cc.SpriteFrame(tex);
                        }
                        // ignore error
                    });
                }
                if (!!this.briefRankingItem[2] && !!this.briefRankingItem[2].avatar) {
                    cc.loader.load({url: this.briefRankingItem[2].avatar, type: !!this.briefRankingItem[2].avatarType ? this.briefRankingItem[2].avatarType : 'jpg'}, (err, tex) => {
                        if (!err) {
                            this.thirdPlace.getComponent(cc.Sprite).spriteFrame = new cc.SpriteFrame(tex);
                        }
                        // ignore error
                    });
                }
            }
        });
    }

    /**
     * 显示更多排行信息
     */
    private _showMore() {
        if (this.rankingList) {
            this.rankingList.show();
        } else {
            let rankingList = cc.instantiate(this.rankingListPre);
            this.rankingList = rankingList.getComponent("RankingList");
            this.rankingList.init();
            this.node.parent.addChild(rankingList);
        }
    }
}
