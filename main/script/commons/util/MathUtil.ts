   
export default class MathUtil {
 
    /**
    * 获取一个范围的随机数
    * @param maxValue  范围最大值
    * @param minValue  范围最小值
    */
    static  getRandomValueFromArrage(maxValue:number,minValue:number):number{
       let random:number = minValue + Math.round(Math.random() *( maxValue -minValue) );
       return random;
    }

    /**
    * 获取一个范围的随机数(小数类型)
    * @param maxValue  范围最大值
    * @param minValue  范围最小值
    * @param floatNumber 小数点位数
    */
    static  getRandomFloatValueFromArrage(maxValue:number,minValue:number, floatNumber: number):number{
       let random:number = Math.round((minValue  + Math.random() *( maxValue  -minValue))* 10* floatNumber )/10/floatNumber ;
       return random;
    }

    /**
    * 数组排序
    */
    static sort(targetArray:number[]):void{
        for(let i=0;i<targetArray.length;i++){
            for(let j=0;j<targetArray.length;j++){
                if(targetArray[i]>targetArray[j]){
                    let temp=targetArray[i];
                    targetArray[i]=targetArray[j];
                    targetArray[j]=temp;
                }
            }
            
        }
    }

    /**
     * 获取指定数组中最大的元素值
     * @param arr 
     */
    static getMaxValueFromArray(arr: number[]): number{
        let maxValue: number =0;
        arr.forEach((item)=>{
            if(item >maxValue){
                maxValue = item;
            }
        })
        return maxValue;
    }
   
     /**
    * 删除数组指定元素
    * @param val 删除的值
     *@param arr 删除的数组
    * @result 无 
    */
    static removeByValue(val,arr):void{
        for(let i=0; i<arr.length; i++) {
            if(arr[i] == val) {
                arr.splice(i, 1);
                break;
            }
       }
    }
}
