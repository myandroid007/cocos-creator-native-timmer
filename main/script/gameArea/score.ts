import { scoreConfig } from "../conf/scoreConfig";
import Vec2Util from '../commons/util/Vec2Util';
import { mapConfig } from "../conf/mapConfig";


/**
 * 
 * 计算得分的文件，得分规则如下：
 * 基础得分（普通消除） 10分
 * 特效消除得分： （基础分 * 对应倍数）
 *          直线特效---1.5倍
 *          爆炸特效----2倍
 *          魔力鸟特效 ---2.5倍
 *          直线+ 直线 ---3倍
 *          直线+ 爆炸 --- 3.5倍
 *          炸弹 + 炸弹-----4倍
 *          魔力鸟 + 魔力鸟----5倍
 * 连续消除得分：
 *          当连续消除次数>2 时，第N次连消的得分为 N*30 + 基本消除得分。
 * 
 * 详情见 scoreConfig内配置
 * @author 刘磊
 * @since 2018.1.17
 */
export const Score = {

    /**
     * 计算普通消除时的得分
     * @param destroyPositions 需要销毁的坐标位置 
     * @param autoCrushTimes 第几次自动消除
     */
    calculateNormalCrush: (destroyPositions: cc.Vec2[], autoCrushTimes: number) =>{
        if(destroyPositions.length < 3){
            // cc.info('销毁数组为空')
            return 0;
        }
        //普通得分
        let score: number = destroyPositions.length * scoreConfig.BASE_SCORE;    
        //连击得分
        if(autoCrushTimes > 1){
            score += autoCrushTimes * scoreConfig.AUTO_CRUSH_AWARD;
        }
        return score;
    },

    /**
     * 计算特效消除得分并返回 
     * @param destroyPositions x需要销毁的坐标数组 
     * @param effectType 特效类型 
     * @param autoCrushTimes  自动消除的次数
     */
    calculateEffectCrush: (destroyPositions: cc.Vec2[], effectType: string, autoCrushTimes: number) =>{
        if(destroyPositions.length == 0){
            return 0;
        }
        //去重
        destroyPositions = Vec2Util.removeRepeatItem(destroyPositions);
        // 特效得分
        let score: number = destroyPositions.length * scoreConfig.BASE_SCORE * scoreConfig.EFFECT_MULTIPLE[effectType];
        //连击奖励
        if(autoCrushTimes > 0){
            score += autoCrushTimes * scoreConfig.AUTO_CRUSH_AWARD;
        }
        return score;
    },
}
