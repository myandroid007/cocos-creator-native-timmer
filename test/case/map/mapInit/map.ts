import {fruit} from '../../../../main/script/conf/elemTemplates/fruit'
import { mapConfig } from '../../../../main/script/conf/mapConfig';
import GameArea from '../../../../main/script/gameArea/gameArea';
const {ccclass, property} = cc._decorator;

@ccclass
export default class game extends cc.Component {

    // mapInfo :number[][] = null;
    mapInfo: number[][] = [
        [1,-1,1,1,1,1,1,1,-1,
         -1,1,1,1,1,1,1,1,1,
         1,1,1,1,1,1,1,1,1,
         -1,1,1,1,1,1,1,1,1,
         1,1,1,1,1,1,1,1,1,
         1,1,1,1,1,1,1,1,1,
         1,1,1,1,1,1,1,1,1,
         1,1,1,1,1,1,1,1,1,
         1,1,1,1,1,-1,1,1,1
     ],
        [-1,-1,-1,-1,-1,-1,-1,-1,-1,
        50,50,50,50,50,50,50,50,50,
        -1,-1,-1,-1,-1,-1,-1,-1,-1,
        -1,-1,-1,-1,-1,-1,-1,-1,-1,
        50,-1,-1,-1,-1,-1,-1,-1,-1,
        50,-1,-1,-1,-1,-1,-1,-1,-1,
        50,50,50,50,50,50,50,50,50,
        50,50,50,50,50,50,50,50,50,
        50,50,50,50,50,50,50,50,50
         
     ],
        [0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,0
     ]
  
     ];

    
    onLoad() {
     
     this.initWithPrefab();
     //模拟地图数据
    }
    
    
    initWithPrefab(){
        let gameArea = this.node.getChildByName('gameArea');
        let gameAreaScript: GameArea = gameArea.getComponent('gameArea');
        gameAreaScript.clearResource();
        gameAreaScript.init(this.mapInfo,null); 



        // alert('初始化完成');
        
    }
    
    initWithLocalSource(){
        let templateInfo = fruit;
        let gameArea = this.node.getChildByName('gameArea');
        let gameAreaScript = gameArea.getComponent('gameArea');
        gameAreaScript.clearResource();
        gameAreaScript.init(this.mapInfo,templateInfo); 
        
    }
    
    


}

