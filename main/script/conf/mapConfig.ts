export const mapConfig ={
    X_NUMBER : 9,    //格子数量
    Y_NUMBER : 9,

    MOVE_ELEMS :[1,2,3,4,5,6,7,8],    //可移动的元素类型

    TOUCH_TYPE:{        //点击触摸类型
        CLICK: 'click',
        TOUCH: 'touch',
    },

    ELEM_KINDS: {
        MIN_KINDS: 1,
        MAX_KINDS: 5
    },


    CELL_PARAMS: ['isCanMove', 'isCanDestroy',  'type', 'status'],

    ELEM_STATUS: {
        COMMON: 1 ,
        CLICK: 2,
        ROW: 3,
        COLUMN: 4,
        WRAP: 5,
        MAGIC: 6
    },

    //元素执行动画的时间
    ANIMATE_TIMES: {    
        TO_MOVE: 0.1,
        TO_DIE: 0.24,
        TO_DROP_DOWN: 0.3,
        TO_ROTATE: 0.48,
        TO_DOWN_SHAKE: 0.25,  //下落后元素抖动的时间
        DESTROY_DELAY: 0.24,    //销毁延迟执行时间 
        SHOW_EFFECT_TIME: 0.2,    // 特效播放时间
        MAGIC_SHAKE: 0.5,       //魔力鸟造成的摇动时间
        MIX_UP: {
            TO_HIDE_AND_SHOW: 0.3,  //缩小/放大的过程时间
            HIDE_TIME: 0.5      //隐藏时间
        }
    },

    
    // UNIT_DROP_DOWN_SPEED: 0.5,
    UNIT_DROP_DOWN_SPEED: 0.06,

    //隐藏的每列元素数量
    HIDING_ELEM_NUMBER: 18,

    //地图区域垂直偏移量（单位：像素）
    HEIGHT_SKEW: 30,    


    //2个元素交换时，这2个元素的类型
    TWO_ELEM_TYPE:{
        BOTH_COMMON_ELEM: 0,
        ONE_MAGIC_ONE_COMMON: 1,
        ONE_EFFECT_ONE_COMMON: 2,
        LINE_AND_LINE: 3,
        LINE_AND_WRAP: 4,
        LINE_AND_MAGIC: 5,
        WRAP_AND_WRAP: 6,
        WRAP_AND_MAGIC: 7,
        MAGIC_AND_MAGIC: 8
    },

    //计算得分的类型
    SCORE_TYPE:{
        COMMON:  'COMMON',
        LINE: 'LINE',
        WRAP: 'WRAP',
        MAGIC: 'MAGIC',
        LINE_AND_LINE: 'LINE_AND_LINE',
        LINE_AND_WRAP: 'LINE_AND_WRAP',
        LINE_AND_MAGIC: 'LINE_AND_MAGIC',
        WRAP_AND_WRAP: 'WRAP_AND_WRAP',
        WRAP_AND_MAGIC: 'WRAP_AND_MAGIC',
        MAGIC_AND_MAGIC: 'MAGIC_AND_MAGIC',

    },



    //下落完成后，抖动时，每次位置改变的值，，数组长度为抖动次数
    MOVE_DOWN_SHAKE_RANGE: [8, 3],

    //收到魔力鸟改变时，元素抖动的角度，数组长度为抖动次数
    MAGIC_SHAKE_ANGLE: [-45, 75,  -50, 30, -10],

}
