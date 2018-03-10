const {ccclass, property} = cc._decorator;

@ccclass
export default class NewClass extends cc.Component {


     onLoad() {
        this.time(1, null);
        
    }

    /**
     * 定时方法
     * @param inteval 
     * @param callBack 
     */
     time(inteval: number, callBack: Function){
        let i = 0;
        let  mainFunc =()=>{
            i++;
            //把i发送到浏览器的js引擎线程里
            // console.log(2222)
            let origin = this.node.getChildByName('time').getComponent(cc.Label).string 
            this.node.getChildByName('time').getComponent(cc.Label).string = i +'';
        }
        let  id = setInterval(mainFunc,1000);


    }
}
