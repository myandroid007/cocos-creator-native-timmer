import FlatListItem from '../flatList/FlatListItem';
const {ccclass, property} = cc._decorator;

/**
 * 排行列表项的数据类型
 */
export type ItemType = {
    uid: number,
    nickname: string,
    avatar?: string,
    avatarType?: string,
    level: number,
    rowNum: number,
    ranking: number,
    score: number,
    reward: string, 
}

@ccclass
export default class RankingItem extends FlatListItem {

    @property(cc.Sprite)
    goldMedal: cc.Sprite = null;
    @property(cc.Sprite)
    silverMedal: cc.Sprite = null;
    @property(cc.Sprite)
    bronzeMedal: cc.Sprite = null;
    @property(cc.Label)
    rankingNum: cc.Label = null;

    @property(cc.SpriteFrame)
    defaultAvatar: cc.SpriteFrame = null;

    private index: number;

    /**
     * 初始化列表项
     */
    public init() {
        this.index = -1;
    }

    /**
     * 更新排行列表项
     * 
     * @param idx 列表项的索引
     * @param y 列表项所处的Y坐标
     * @param data 列表项数据
     */
    public updateItem(idx: number, y: number, data: ItemType) {
        this.index = idx;
        this.node.setPositionY(y);

        // 更新排行信息
        switch (data.ranking) {
            case 1:
                this._showGoldMedal();
                break;
            case 2:
                this._showSilverMedal();
                break;
            case 3:
                this._showBronzeMedal();
                break;
            default:
                this._showRankingNum(data.ranking);
                break;
        }

        // 更新玩家信息
        let player = this.node.getChildByName("player");
        let avatar = player.getChildByName("avatar");
        let name = player.getChildByName("name");
        let level = player.getChildByName("level");
        if (!!data.avatar) {
            cc.loader.load({url: data.avatar, type: !!data.avatarType ? data.avatarType : 'jpg'}, (err, tex) => {
                if (err) {
                    // cc.error(err.message || err);
                    avatar.getComponent(cc.Sprite).spriteFrame = this.defaultAvatar;
                } else {
                    avatar.getComponent(cc.Sprite).spriteFrame = new cc.SpriteFrame(tex);
                }
            });
        } else {
            avatar.getComponent(cc.Sprite).spriteFrame = this.defaultAvatar;
        }
        name.getComponent(cc.Label).string = data.nickname;
        level.getComponent(cc.Label).string = `LV.${data.level}`;

        // 更新分数信息
        let scoreContent = this.node.getChildByName("score").getChildByName("content");
        scoreContent.getComponent(cc.Label).string = `${data.score}`;

        // 更新奖励信息
        let rewardContent = this.node.getChildByName("reward").getChildByName("content");
        rewardContent.getComponent(cc.Label).string = !!data.reward ? data.reward : '';
    }

    /**
     * 获取当前滑动列表项的索引
     */
    public getIndex() {
        return this.index;
    }

    /**
     * 选中当前的排行项
     */
    public select() {
        this.node.getChildByName("bg").active = true;
        this.node.getChildByName("separator").active = false;
    }

    /**
     * 取消当前选中项
     */
    public unselect() {
        this.node.getChildByName("bg").active = false;
        this.node.getChildByName("separator").active = true;
    }

    /**
     * 当前的排行项是否被选中
     * 
     * @return 如果当前的排行项被选中，则返回true，否则返回false
     */
    public isSelected(): boolean {
        return this.node.getChildByName("bg").active;
    }

    /**
     * 显示金牌
     */
    private _showGoldMedal() {
        this.goldMedal.node.active = true;
        this.silverMedal.node.active = false;
        this.bronzeMedal.node.active = false;
        this.rankingNum.node.active = false;
    }

    /**
     * 显示银牌
     */
    private _showSilverMedal() {
        this.silverMedal.node.active = true;
        this.goldMedal.node.active = false;
        this.bronzeMedal.node.active = false;
        this.rankingNum.node.active = false;
    }

    /**
     * 显示铜牌
     */
    private _showBronzeMedal() {
        this.bronzeMedal.node.active = true;
        this.goldMedal.node.active = false;
        this.silverMedal.node.active = false;
        this.rankingNum.node.active = false;
    }

    /**
     * 显示排行数字
     * 
     * @param rankingNum 排行号
     */
    private _showRankingNum(rankingNum: number) {
        this.rankingNum.string = `${rankingNum}`;
        this.rankingNum.node.active = true;
        this.goldMedal.node.active = false;
        this.silverMedal.node.active = false;
        this.bronzeMedal.node.active = false;
    }
}