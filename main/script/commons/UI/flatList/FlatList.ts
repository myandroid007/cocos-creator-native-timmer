import FlatListItem from './FlatListItem';
const {ccclass, property} = cc._decorator;

const ON_END_REACHED_THRESHOLD: number = 6;
/**
 * 滑动列表的渲染时间间隔
 */ 
const UPDATE_INTERVAL: number = 0.2;

/**
 * 滑动列表初始化参数
 */
type FlatListPrama = {
    /**
     * 渲染滑动列表的头部，返回被渲染的头部组件节点
     */
    renderHeader?: (tag: number | string, originalNode: cc.Node) => void,

    /**
     * 渲染滑动列表的底部，返回被渲染的底部组件节点 
     */
    renderFooter?: (tag: number | string, originalNode: cc.Node) => void,

    /**
     * 滑动列表的内容为空时，调用此方法
     */
    renderEmpty?: (tag: number | string, originalNode: cc.Node) => void, 

    /**
     * 性能模式，默认关闭。当不使用性能模式时，为每一份数据生成一个列表项。当打开性能模式时，所有数据公用固定的列表项。
     * 当列表项渲染数据不涉及异步操作（如：图片加载）时并需要显示大量数据时，适合使用性能模式
     */
    performanceModel?: boolean,

    /**
     * 决定当距离内容底部还有多远时触发onEndReached回调，此参数为列表项的个数
     */
    onEndReachedThreshold?: number,

    /**
     * 当列表被滚动到距离内容最底部不足onEndReachedThreshold的距离时调用 
     */
    onEndReached?: (tag: number | string) => void,

    /**
     * 需要用于渲染的数据 
     */
    data: Array<Object>,

    /**
     * 渲染每个列表项 
     */
    renderItem?: (tag: number | string, item: Object, itemNode: cc.Node, index: number) => void,
}

/**
 * 滑动列表
 */
@ccclass
export default class FlatList extends cc.Component {
    @property(cc.Prefab)
    headerNodePre: cc.Prefab = null;
    @property(cc.Prefab)
    footerNodePre: cc.Prefab = null; 
    @property(cc.Prefab)
    itemNodePre: cc.Prefab = null;
    @property(cc.Prefab)
    emptyItemNodePre: cc.Prefab = null;

    @property(cc.ScrollView)
    scrollView: cc.ScrollView = null;
    // 初始化列表项的实例个数
    @property(cc.Integer)
    initItemCount: number = 0;
    // 滑动列表的可见缓冲区，当滑动列表超过可视部分缓冲区大小时，开始调整列表项的位置
    @property(cc.Integer)
    bufferZone: number = 0;

    private onEndReachedThreshold: number; 
    private isOnEndReachedThreshold: boolean;
    private flatListParam: FlatListPrama; 

    private updateTimer: number; 
    // 滑动列表内容的初始Y坐标
    private originalContentPosY: number;
    // 记录上次滑动列表内容的Y坐标，用此参数检测是否滑动了滚动列表
    private lastContentPosY: number;

    private itemList: FlatListItem[];
    private itemNodeHeight: number;
    private _isInit: boolean = false;

    /**
     * 初始化滑动列表参数
     * 
     * @param flatListParam 用于初始化滑动列表的参数
     */
    public init(flatListParam: FlatListPrama) {
        this.onEndReachedThreshold = flatListParam.onEndReachedThreshold || ON_END_REACHED_THRESHOLD;
        this.isOnEndReachedThreshold = false;
        this.flatListParam = flatListParam;

        this.updateTimer = 0;
        this.lastContentPosY = this.scrollView.content.y;

        this.itemList = [];
        this._initList();
        this._isInit = true;
    }

    /**
     * 滑动列表是否被初始化
     */
    public isInit(): boolean {
        return this._isInit;
    }

    /**
     * 初始化滑动列表
     */
    private _initList() {
        let {renderHeader, renderFooter} = this.flatListParam;
        let headerNode = cc.instantiate(this.headerNodePre), 
            footerNode = cc.instantiate(this.footerNodePre);
        if (!!renderHeader) {
            renderHeader(this.node.tag, headerNode);
        }
        if (!!renderFooter) {
            renderFooter(this.node.tag, footerNode);
        }
        this.node.addChild(headerNode, 1, "header");
        this.node.addChild(footerNode, 3, "footer");
        this._initFlatListItems();
    }

    /**
     * 初始化列表项
     */
    private _initFlatListItems() {
        let {data, renderEmpty, renderItem, performanceModel} = this.flatListParam;
        
        //---------初始化列表基本信息
        let itemNode = cc.instantiate(this.itemNodePre);
        this.originalContentPosY = this.scrollView.content.y;
        this.itemNodeHeight = itemNode.height;

        //---------如果没有渲染的数据则显示空信息
        if (this.getItemDataCount() < 1) {
            let emptyNode = cc.instantiate(this.emptyItemNodePre);
            if (!!renderEmpty) {
                renderEmpty(this.node.tag, emptyNode);
            }
            this.scrollView.content.height = this.scrollView.node.height;
            this.scrollView.content.addChild(emptyNode, 1, "listItems")
            return;
        }

        //---------渲染真实的列表项数据
        let itemY: number;
        // 如果没有开启性能模式，则为每一份数据创建一份列表项
        let actualInitItemCount = !performanceModel ? data.length : Math.min(this.initItemCount, data.length);
        this.scrollView.content.height = this.itemNodeHeight * (data.length + 1);
        for (let i = 0; i < actualInitItemCount; i++) {
            let item: FlatListItem;
            if (i == 0) {
                itemY = -Math.abs(this.itemNodeHeight / 2);
                item = itemNode.getComponent(FlatListItem);
            } else {
                itemY -= this.itemNodeHeight;
                item = cc.instantiate(this.itemNodePre).getComponent(FlatListItem);
            }
            item.init();
            this.scrollView.content.addChild(item.node);
            item.updateItem(i, itemY, data[i]);
            renderItem && renderItem(this.node.tag, data[i], item.node, i);
            this.itemList.push(item);
        }
    }

    /**
     * 刷新滑动列表 
     * 
     * @param data 刷新滑动列表的新数据
     * @param renderHeader 用于渲染滑动列表头部
     * @param renderFooter 用于渲染滑动列表底部
     * @param isCleanup 当没有新数据传入时，是否清除之前的数据，默认清除
     */
    public refresh(data?: Array<Object>, renderHeader?: (tag: number | string, originalNode: cc.Node) => void, renderFooter?: (tag: number | string, originalNode: cc.Node) => void, isCleanup?: boolean) {
        //--------重新渲染头部
        if (!!renderHeader) {
            renderHeader(this.node.tag, this.node.getChildByName("header"));
        }

        //--------重新渲染底部
        if (!!renderFooter) {
            renderFooter(this.node.tag, this.node.getChildByName('footer'));
        }
        //---------重新渲染列表内容 
        let {performanceModel, renderEmpty, renderItem} = this.flatListParam;
        if (!!data && data.length > 0) {
            let actualInitItemCount;
            if (this.getItemDataCount() < 1) {
                // 之前列表为空列表，全部创建滑动列表项
                actualInitItemCount = !performanceModel ? data.length : Math.min(this.initItemCount, data.length);
                this._addItems(actualInitItemCount);
            } else {
                if (data.length < this.itemList.length) {
                    // 如果实际用于渲染的数据少于已有的列表项，则去除不需要的列表项
                    actualInitItemCount = data.length;
                    this.itemList.splice(actualInitItemCount);
                } else if (!performanceModel) {
                    // 实际数据大于已有列表项，且没有开启性能模式，则为多余的数据生成列表项
                    actualInitItemCount = data.length;
                    this._addItems(data.length - this.itemList.length);
                } else {
                    // 实际数据大于已有列表项，且已经开启性能模式，则为直接使用已有的列表项渲染数据
                    actualInitItemCount = this.itemList.length;
                }
            }
            this.scrollView.content.removeAllChildren();
            let itemY: number; 
            this.flatListParam.data = data;
            this.scrollView.content.height = this.itemNodeHeight * (data.length + 1); 
            this.scrollView.content.y = this.originalContentPosY;
            for (let i = 0; i < actualInitItemCount; i++) {
                if (i == 0) {
                    itemY = -Math.abs(this.itemNodeHeight / 2);
                } else {
                    itemY -= this.itemNodeHeight;
                }
                let item = this.itemList[i];
                item.node.active = true;
                item.init();
                this.scrollView.content.addChild(item.node);
                item.updateItem(i, itemY, data[i]);
                renderItem && renderItem(this.node.tag, data[i], item.node, i);
            }
        } else {
            if (this.getItemDataCount() > 0 && (isCleanup === undefined || isCleanup)) {
                // 当没有传入数据，且需要清除清空旧数据时，渲染空列表
                this.scrollView.content.removeAllChildren(); 
                let emptyNode = cc.instantiate(this.emptyItemNodePre);
                if (!!renderEmpty) {
                    renderEmpty(this.node.tag, emptyNode);
                }
                this.scrollView.content.height = this.scrollView.node.height;
                this.scrollView.content.addChild(emptyNode, 1, "listItems");
            }
            this.scrollView.content.y = this.originalContentPosY;
        }

        //---------临时变量重置
        this.isOnEndReachedThreshold = false;  // 重置滑动监听变量参数
    }

    /**
     * 批量添加滑动列表项
     * 
     * @param num 需要添加的滑动列表项个数
     */
    private _addItems(num: number) {
        for (let i = 0; i < num; i++) {
            this.itemList.push(cc.instantiate(this.itemNodePre).getComponent(FlatListItem));    
        }
    }

    /**
     * 向已有的滑动列表中添加新的列表项数据
     * 
     * @param data 列表项数据数组
     */
    public addItemData(data: Array<Object>) {
        if (!!data && data.length > 0) {
            this.flatListParam.data = this.flatListParam.data.concat(data);
            this.scrollView.content.height = this.itemNodeHeight * (this.flatListParam.data.length + 1);

            // 没有开启性能模式，为新添加的数据添加列表项
            if (!this.flatListParam.performanceModel) {
                let itemLength = this.itemList.length, 
                    itemY: number;
                this._addItems(data.length);
                for (let i = 0; i < data.length; i++) {
                    if (i == 0) {
                        itemY = this.itemList[itemLength - 1].node.y - this.itemNodeHeight;
                    } else {
                        itemY -= this.itemNodeHeight;
                    }
                    let item = this.itemList[itemLength + i];
                    item.init();
                    this.scrollView.content.addChild(item.node);
                    item.updateItem(itemLength + i, itemY, data[i]);
                }
            }
            // 重置滑动监听变量参数
            this.isOnEndReachedThreshold = false;
        }
    }

    /**
     * 获取当前列表内容项的个数
     * 
     * @return 滑动动列表当前数据项的个数
     */
    public getItemDataCount(): number {
        return !! this.flatListParam && !!this.flatListParam.data ? this.flatListParam.data.length : 0;
    }

    /**
     * 获取滑动列表可视区域的高度
     * 
     * @return 滑动列表的可视区域高度
     */
    public getViewHeight(): number {
        return this.scrollView.node.height;
    }

    /**
     * 获取列表项相对于滑动可视窗口的相对位置
     * 
     * @param item 需要获取相对位置的滑动列表项节点
     * @param 列表项相对于可视窗口的相对位置
     */ 
    public getPositionInView(item: cc.Node): cc.Vec2 { 
        let worldPos = item.parent.convertToWorldSpaceAR(item.position);
        let viewPos = this.scrollView.node.convertToNodeSpaceAR(worldPos);
        return viewPos;
    }

    /**
     * 显示列表底部组件
     */
    public showFooter() {
        this.node.getChildByName('footer').active = true;
    }

    /**
     * 隐藏列表底部组件
     */
    public hideFooter() {
        this.node.getChildByName('footer').active = false;
    }

    /**
     * 渲染列表项
     */
    private _renderItems() {
        if (!this.flatListParam.renderItem) return; 
        let curItemCount = this.itemList.length;
        for (let i = 0; i < curItemCount; i++) {
            this.flatListParam.renderItem(this.node.tag, 
                this.flatListParam.data[this.itemList[i].getIndex()], this.itemList[i].node, this.itemList[i].getIndex());
        }
    }

    /**
     * 当滚动滑动列表时，更新对应的信息
     * 
     * @param dt 时间变量
     * @param isDown 是否向下滑动滑动了列表
     */
    private _updateItemsWhenScrolling(dt: number, isDown: boolean) {
        this.updateTimer += dt;
        if (this.updateTimer < UPDATE_INTERVAL) {
            // 定时器没有达到更新时间或者为空列表，则不进行滑动计算
            return; 
        }
        this.updateTimer = 0;

        // 非性能模式，不用更新列表项
        if (!this.flatListParam || !this.flatListParam.performanceModel) return;

        let curItemCount = this.itemList.length;
        let offset = curItemCount * this.itemNodeHeight;
        for (let i = 0; i < curItemCount; i++) {
            let item = this.itemList[i];
            let itemNode = item.node;
            let viewPos = this.getPositionInView(itemNode);
            if (isDown) {
                // if away from buffer zone and not reaching top of content
                if (viewPos.y < -this.bufferZone && itemNode.y + offset < 0) {
                    let newIdx = item.getIndex() - curItemCount;
                    item.updateItem(newIdx, itemNode.y + offset, this.flatListParam.data[newIdx]);
                }
            } else {
                // if away from buffer zone and not reaching bottom of content
                if (viewPos.y > this.bufferZone && itemNode.y - offset > -this.scrollView.content.height + this.itemNodeHeight) {
                    let newIdx = item.getIndex() + curItemCount;
                    item.updateItem(newIdx, itemNode.y - offset, this.flatListParam.data[newIdx]);
                }
            }
        }
    }

    /**
     * 添加到达滑动列表内容底部(参考阈值)的事件监听器
     * 
     * @param isUp 是否向上滑动了列表 
     */
    private _addOnEndReachedListener(isUp: boolean) {
        if (!isUp) return;

        if (!!this.flatListParam.onEndReached && !this.isOnEndReachedThreshold) {
            let maxContentPosY = this.scrollView.content.height - this.originalContentPosY;
            let thresholdHeight = this.onEndReachedThreshold * this.itemNodeHeight;
            if (this.lastContentPosY >= maxContentPosY - thresholdHeight) {
                this.flatListParam.onEndReached(this.node.tag);
                this.isOnEndReachedThreshold = true;
            }
        }
    }

    update(dt: number) {
        if (this.getItemDataCount() < 1) return;

        // scrolling direction
        let isDown = this.scrollView.content.y < this.lastContentPosY;
        let isUp = this.scrollView.content.y > this.lastContentPosY;
        // 没有滚动，不更新
        if (!isDown && !isUp) return;
        // update lastContentPosY
        this.lastContentPosY = this.scrollView.content.y;

        if (!!this.flatListParam && !!this.flatListParam.performanceModel) {
            // 当为性能模式时，更新滚动列表项
            this._updateItemsWhenScrolling(dt, isDown);
        }
        this._renderItems();
        this._addOnEndReachedListener(isUp);
    }
}