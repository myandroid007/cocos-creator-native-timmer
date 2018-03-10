import ClientFactory from "../../../main/script/commons/net/ClientFactory";
import DailySignClient from "../../../main/script/client/DailySign";

const {ccclass, property} = cc._decorator;

@ccclass
export default class TestDailySign extends cc.Component {
 
    userId: number = 3;     //用户id
    onLoad() {
        cc.log('重新加载')
    }

    public  reloadScene(){
        cc.game.restart();
    }
    
    /**
     * 清空加载次数
     */
    public  async cleanLoadedTimes(){
        await cc.sys.localStorage.removeItem('loadedInfo');
        cc.log('清空')
    }

    /**
     * 清空加载次数
     */
    public  async cleanSignInfo(){
        for(let i=0; i<=10; i++){
            await cc.sys.localStorage.removeItem('signInfo' + i);
        }
        await cc.sys.localStorage.removeItem('signInfo' + 9600);
        cc.log('清空')
    }
}
