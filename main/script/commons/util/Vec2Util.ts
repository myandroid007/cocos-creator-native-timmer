/**
 * 本类是用于一些关于cc.Vec2 操作的类
 * @author 刘磊
 * @since 2018.1.9
 */
export default class Vec2Util {

        /**
     * 将指定Vec2数组中重复的元素去除
     * @param result 去重后的坐标数组 
     */
    public static removeRepeatItem(originVecArray: cc.Vec2[]): cc.Vec2[] {
        let result: cc.Vec2[] = [];
        for (let i=0; i<= originVecArray.length-1; i++) {
            if (result.length == 0) {
                result.push(originVecArray[i])
                continue;
            }
            let isHasThisNode: boolean = false;
            for (let j= 0; j<= result.length-1; j++) {
                if (originVecArray[i].equals(result[j])) {
                    isHasThisNode = true
                    //2个坐标相等，跳过此锚点
                    break;
                }
            }
            if(!isHasThisNode){
                // cc.log('添加了')
                result.push(originVecArray[i]);   
            }
        }
        return result;
    }


     /**
     * 将指定的cc.Vec2 数组中删除指定元素，并将删除后的数组返回
     * @param originVecArray    原始数组
     * @param spesifiedItem     原始指定元素
     */
    public static removeSpesifiedItem( originVecArray: cc.Vec2[], spesifiedItem: cc.Vec2): cc.Vec2[]{
        let result: cc.Vec2[] = [];
        for (let i=0; i<= originVecArray.length-1; i++) {
            if (spesifiedItem.equals(originVecArray[i])) {
                continue;
            }
            result.push(originVecArray[i]);
        }
        return result;
    }

     /**
     * 将指定的cc.Vec2 数组中删除指定数组，并将删除后的数组返回
     * @param originVecArray    原始数组
     * @param spesifiedArray     原始指定元素
     */
    public static removeSpesifiedArray( originVecArray: cc.Vec2[], spesifiedArray: cc.Vec2[]): cc.Vec2[]{
        let result: cc.Vec2[] = [];
        for(let i= 0; i<= spesifiedArray.length-1; i++){
            if(i==0){
                result = this.removeSpesifiedItem(originVecArray, spesifiedArray[i]);
                continue;
            }
            result = this.removeSpesifiedItem(result, spesifiedArray[i]);
        }
        return result;
    }

    /**
     * 指定的元素是否存在于指定的数组中
     * @returns  是否存在
     */
    public static isSpesifiedItemInArray(originVecArray: cc.Vec2[], spesifiedItem: cc.Vec2): boolean{
        if(originVecArray.length == 0){
            return false;
        }
        for (let i=0; i<= originVecArray.length-1; i++) {
            if (spesifiedItem.equals(originVecArray[i])) {
                return true;
            }
        }
        return false;
    }

    /**
     * 获取指定数组中最小的1个元素
     */
    public static getTopestAndLefestItemFromArray(originVec2Array: cc.Vec2[]): cc.Vec2{
        let result = originVec2Array[0];
        //确定最上部的元素
        for(let i=1; i<= originVec2Array.length-1; i++){
            if(originVec2Array[i].y < result.y){
                result = originVec2Array[i];
            }
        }
        
        // 在最上部的基础上确定最左部的元素
        for(let i=1; i<= originVec2Array.length-1; i++){
            if(originVec2Array[i].y == result.y  && originVec2Array[i].x <result.x){
                result = originVec2Array[i];
            }
        }
        return result;
    }
   
}