import FlatListItem from '../flatList/FlatListItem';
const { ccclass, property } = cc._decorator;

/**
 * 排行列表项的数据类型
 */
export type ItemType = {
    mailId: number,
    title: string,
    content: string,
    type: number,//0系统消息 1私密消息
    status: number,//阅读状态 0 已读 1未读未领取 2已读未领取 3已读已领取  4已删除
    rowNum: number,
    receiveTime: any,
    propRewardId: number
}

@ccclass
export default class MailItem extends cc.Component {

    @property(cc.Sprite)
    closeMail: cc.Sprite = null;
    @property(cc.Sprite)
    openMail: cc.Sprite = null;

    private index: number;

     /**
     * 初始化列表项
     */
    public init() {
        this.index = -1;
    }
    
    onLoad() {

    }
}
