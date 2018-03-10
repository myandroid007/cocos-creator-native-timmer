/**
 * 基于内存的全局数据存储，提供全局的数据共享
 */
export default class Global {
    
    /**
     * 根据键值存储全局数据 
     * @param key 数据键值 
     * @param value 需要存储的全局数据
     */
    static setItem(key: string, value: any): void {
        if (!!key && !!value) {
            this[key] = value;
        }
    }

    /**
     * 根据指定的键值获取对应的数据 
     * @param key 需要获取数据的键值
     * @returns 获取的数据
     */
    static getItem(key: string): any {
        if (!!key) {
            return this[key];
        }
        return null;
    }

    /**
     * 根据指定的键值移除对应的数据 
     * @param key 需要移除数据的键值
     */
    static removeItem(key: string): void {
        if (!!key && !!this[key]) {
            delete this[key];
        }
    }
}