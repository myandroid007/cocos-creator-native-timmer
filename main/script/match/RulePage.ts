const {ccclass, property} = cc._decorator;
import BitmapUtil from '../commons/util/BitmapUitl';
import Global from '../commons/storage/Global';


@ccclass
export default class RulePage extends cc.Component {

    private  SELECT_VALUE:number=1;
    private  UNSELECT_VALUE:number=0;
    private  NOW_SELECT_VALUE:number=0;

    @property(cc.Button)
    btnSelect: cc.Button = null;
    onLoad() {
        
       cc.game.addPersistRootNode(this.node); 
    }

    onClick(event,customEventData){
        switch(customEventData){
            case 'select':
                this._setSelectValue();
            break;
            case 'close':
                this._showMatchPage();
            break;
        }
      
    }

    _showMatchPage(){
        
        cc.director.getScene().getChildByName('rulePage').x=1500;
        
     }
    async _setSelectValue(){
        let sprite=this.btnSelect.getComponent(cc.Sprite);
        let value=Global.getItem('selectValue');
        if(this.NOW_SELECT_VALUE==0){
            sprite.spriteFrame=await BitmapUtil.getLocalBitmap('texture/icons/matchScene/boxyes');
            cc.sys.localStorage.setItem(value, true);
            this.NOW_SELECT_VALUE=this.SELECT_VALUE;
        }else{
            sprite.spriteFrame=await BitmapUtil.getLocalBitmap('texture/icons/matchScene/boxno');
            cc.sys.localStorage.setItem(value, false);
            this.NOW_SELECT_VALUE=this.UNSELECT_VALUE;
        }
        
    }
}
