const {ccclass, property} = cc._decorator;

@ccclass
export default class BitmapUtil {

    
     /**
     * 加载网络图片
     * @param url 图片地址
     */
    static getNetworkBitmap(url:string,){
        return new Promise<cc.SpriteFrame>((res, rej)=>{
            cc.loader.load({url:url,type: 'jpg'},function (err, texture) {
                if (err) {
                    cc.error(err);
                } else {
                    res(new cc.SpriteFrame(texture));
                }
            });
            
        });  
    }

    /**
     * 加载本地图片
     * @param iconurl 图片路径
     */
    static getLocalBitmap(url:string){
        return new Promise<cc.SpriteFrame>((res, rej)=>{
            cc.loader.loadRes(url,cc.SpriteFrame,function (err, SpriteFrame) {
                if (err) {
                    cc.error(err);
                } else {
                    res(SpriteFrame);
                }
            });
        });  
    }

     /**
     * 读取图片集合
     */
    static getBitmapDir(url: string) {
        return new Promise<cc.SpriteFrame[]>((res, rej)=>{
            cc.loader.loadResDir(url, cc.SpriteFrame, function (err, assets) {
                if (err) {
                    cc.error(err);
                } else {
                    res(assets);
                }
            });
        });  
    }
    
}
