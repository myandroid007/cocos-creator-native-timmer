import {mapConfig} from '../../conf/mapConfig';

const {ccclass, property} = cc._decorator;

/**
 * 地图上所有元素的基类
 */
@ccclass
export default class BaseElem extends cc.Component {

    
    type:number = 1;        //不同元素，不同type值

    status: number = 1;     //同一元素，不同状态，如普通，爆炸状态

    width: number = cc.director.getWinSize().width / mapConfig.Y_NUMBER;
    height: number = cc.director.getWinSize().width / mapConfig.Y_NUMBER;

    isCanMove: boolean = true;
    isCanDestroy: boolean = true;

    animateCmds = [];   //存放该节点要执行的动作命令


    isHiddenElem: boolean = false;      //是否是隱藏元素
    isPreToMoveDown: boolean = false;   //是否是标记为即将下落的元素，为true 则表示已经被某个空格表示，之后会下落到该位置


    onLoad() {
        this.node.width = cc.director.getWinSize().width / mapConfig.X_NUMBER;
        this.node.height = cc.director.getWinSize().width / mapConfig.X_NUMBER;
        let parentNode = this.node.parent;
        this.node.on(cc.Node.EventType.TOUCH_START, function() {
            // cc.log('触摸结束节点监听，不处理，冒泡到父节点进行处理')
        });
        // //当手指在目标节点区域内离开屏幕时。
        // this.node.on(cc.Node.EventType.TOUCH_END, function() {
        //     // cc.log('触摸结束节点监听，不处理，冒泡到父节点进行处理')
        // });
        //当手指在目标节点区域内离开屏幕时。
        this.node.on(cc.Node.EventType.TOUCH_MOVE, function() {
            // cc.log('触摸结束节点监听，不处理，冒泡到父节点进行处理')
        });
        //当手指在目标节点区域外离开屏幕时。
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, function() {
            // cc.log('触摸结束节点监听，不处理，冒泡到父节点进行处理')
        });

    }



    /**
     * 设置元素类型
     * @param type  
     */
    setType(type: number){
        this.type = type;
    }

    /**
     * 销毁当前节点
     * @param playTime  开始播放时间
     */
    addDestroyCmd(playTime: number){
        this.animateCmds.push({
            actionName: 'toDie',
            playTime: playTime,
        })
    }
    
    /**
     * 添加销毁延迟执行命令
     * @param playTime  开始播放时间
     */
    addDelayActionCmd(playTime: number){
        this.animateCmds.push({
            actionName: 'toDelay',
            playTime: playTime,
        })
    }
    
    
    /**
     * 将元素自身移动到指定位置
     * @param direc 需要移动的重点位置
     */
    addMoveToCmd(pos: cc.Vec2, playTime: number){
        this.animateCmds.push({
            actionName: 'moveTo',
            playTime: playTime,
            pos: pos,
        })
    }
    
    /**
     * 添加 移动并还原的动画命令
     * @param selfPos 
     * @param backPos 
     * @param playTime 
     */
    addMoveAndBackCmd(selfPos: cc.Vec2, backPos: cc.Vec2, playTime: number){
        this.animateCmds.push({
            actionName: 'moveTo',
            playTime: playTime,
            pos: backPos,
        });
        this.animateCmds.push({
            actionName: 'moveTo',
            playTime: playTime,
            pos: selfPos
        })
    }
    /**
     * 添加 移动并还原的动画命令
     * @param selfPos 
     * @param backPos 
     * @param playTime 
     */
    addMagicShakeCmd( playTime: number){
        this.animateCmds.push({
            actionName: 'magicShake',
            playTime: playTime,
        });
    }
    

    /**
     * 按照指定路径进行下落
     * @param path  记录路径的向量坐标
     * @param playTime  总体下落时间
     */
    addMoveDownByPathCmd(path: cc.Vec2[], playTime: number){

        let nodePosition: cc.Vec2 = this.node.getPosition();
        let unitHeight: number = cc.director.getWinSize().width / mapConfig.Y_NUMBER;
        let delta: number = 0;      //路径转折点之间的y间距 之差
        let lastPosition: cc.Vec2 = null;   //上次的位置


        if (path.length == 1) {
            this.animateCmds.push({
                actionName: 'moveTo',
                playTime: nodePosition.y / unitHeight * mapConfig.UNIT_DROP_DOWN_SPEED,
                pos: path[0]
            })
        }else{
            for(let i =0; i<= path.length-1; i++){
                if ( i>=1) {
                    lastPosition = path[i-1];
                    delta =  lastPosition.y - path[i].y ;
                    this.animateCmds.push({
                        actionName: 'moveTo',
                        playTime: delta / unitHeight * mapConfig.UNIT_DROP_DOWN_SPEED,
                        pos: path[i]
                    })
                    continue;
                }
                
            }
        }

        //制作抖动动画，并添加到命令数组中
        let lastPathPos: cc.Vec2 = path[path.length -1];
        let temp: cc.Vec2 = cc.p(lastPathPos.x, lastPathPos.y - mapConfig.MOVE_DOWN_SHAKE_RANGE[0]);
        let temp1: cc.Vec2 = cc.p(lastPathPos.x, lastPathPos.y + mapConfig.MOVE_DOWN_SHAKE_RANGE[1]);
        let temp2: cc.Vec2 = lastPathPos;

        this.animateCmds.push({
            actionName: 'moveTo',
            playTime: 0.05,
            pos: temp
        })
        this.animateCmds.push({
            actionName: 'moveTo',
            playTime: 0.05,
            pos: temp1
        })
        this.animateCmds.push({
            actionName: 'moveTo',
            playTime: 0.05,
            pos: temp2
        })
    }   

    /**
     * 显示从正常大小缩小到不可见的动画
     */
    public addScaleHideCmd(){
        this.animateCmds.push({
            actionName: 'scaleHide',
            playTime: mapConfig.ANIMATE_TIMES.MIX_UP.TO_HIDE_AND_SHOW,
        });
    }

    /**
     * 显示从最小恢复到正常大小的动画
     */
    public addScaleShowCmd(){
        this.animateCmds.push({
            actionName: 'scaleShow',
            playTime: mapConfig.ANIMATE_TIMES.MIX_UP.TO_HIDE_AND_SHOW,
        });
    }


    /**
     * 显示混淆动画
     */
    public addMixUpCmd(){
        this.animateCmds.push({
            actionName: 'scaleHide',
            playTime: mapConfig.ANIMATE_TIMES.MIX_UP.TO_HIDE_AND_SHOW,
        });
        this.animateCmds.push({
            actionName: 'toDelay',
            playTime: mapConfig.ANIMATE_TIMES.MIX_UP.HIDE_TIME,
        });
        this.animateCmds.push({
            actionName: 'scaleShow',
            playTime: mapConfig.ANIMATE_TIMES.MIX_UP.TO_HIDE_AND_SHOW,
        });

    }   

    
   
   
}
