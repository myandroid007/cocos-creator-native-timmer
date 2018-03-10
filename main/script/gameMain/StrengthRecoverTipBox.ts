const {ccclass, property} = cc._decorator;
import {strengthRecoverTextTipConf} from './strengthRecoverTextTipConf';
import {StrengthRecoveTimeConf} from '../commons/strength/StrengthRecoveTimeConf';
import Global from '../commons/storage/Global';

@ccclass
export default class StrengthRecoverTipBox extends cc.Component {

    @property(cc.Toggle)
    btnToggle:cc.Toggle=null;

    @property(cc.Node)
    notTipBoxNode:cc.Node=null;

    @property(cc.Label)
    content:cc.Label=null;

    private strengthpage:cc.Node=null;
    
    onLoad() {
        this.strengthpage=cc.director.getScene().getChildByName('strengthpage');
        
        this.showStrengthRecoverTipInfo();
       
    }
    onClick(event,customEventData){
        
        switch(customEventData){
            case 'yes':
               this.showBuyPage( this.strengthpage,375);
               this.closeSelfPage();
            break;
            case 'no':
               this.closeSelfPage();
            break;
            case 'toggle':
               this.isChooseNotTip();
            break;
        }
    }

    public isShowStrengthRecoverTipBox = ()=>{
        //cc.sys.localStorage.setItem('isShowStrengthRecoverTip',null);
       
        let isShowStrengthRecoverTip=cc.sys.localStorage.getItem('isShowStrengthRecoverTip');
        cc.log(isShowStrengthRecoverTip);
        if(isShowStrengthRecoverTip=='null'){
            this.node.active=true;
            this.notTipBoxNode.active=false;
           // cc.sys.localStorage.setItem('isShowStrengthRecoverTip',false);
        }else{
            if(isShowStrengthRecoverTip=='true'){
                this.node.active=false;
            }else{
                this.node.active=true;   
            }
           
        }
    }
    private showStrengthRecoverTipInfo(){
        //let tipText=strengthRecoverTextTipConf.TIP_TEXT;
        // for(let i=0;i<StrengthRecoveTimeConf.RECOVER_TIME_ARRAY.TIME_ARRAY.length;i++){
        //     tipText+=StrengthRecoveTimeConf.RECOVER_TIME_ARRAY.TIME_ARRAY[i];
        //     if(i!=StrengthRecoveTimeConf.RECOVER_TIME_ARRAY.TIME_ARRAY.length-1){
        //         tipText+=',' ; 
        //     }
        // }
        this.content.string=strengthRecoverTextTipConf.TIP_TEXT;
    }

    private showBuyPage(targetPage:cc.Node,x:number){
        targetPage.setPositionX(x);
    }

    private closeSelfPage(){
        this.node.active=false;
    }

    isChooseNotTip(){
        if(this.btnToggle.isChecked){
            cc.sys.localStorage.setItem('isShowStrengthRecoverTip',true);
           
        }else{
            cc.sys.localStorage.setItem('isShowStrengthRecoverTip',false);
        }
    }
}
