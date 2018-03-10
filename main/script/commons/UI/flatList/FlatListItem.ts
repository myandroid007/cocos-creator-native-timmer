const {ccclass, property} = cc._decorator;

@ccclass
export default abstract class FlatListItem extends cc.Component {
    /**
     * 初始化列表项
     */
    public abstract init();

    /**
     * 更新列表项数据
     * 
     * @param idx 列表项索引
     * @param y 列表项所处的Y坐标
     * @param data 更新列表项的数据
     */
    public abstract updateItem(idx: number, y: number, data: Object);

    /**
     * 获取当前滑动列表项的索引
     */
    public abstract getIndex();

    /**
     * 选中列表项
     */
    public abstract select();

    /**
     * 取消当前选中的列表项
     */
    public abstract unselect();

    /**
     * 当前列表项是否被选中
     * 
     * @return 如果列表项被选中则返回true，否则返回false
     */
    public abstract isSelected(): boolean;
}
