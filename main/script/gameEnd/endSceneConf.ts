
export const endSceneConf= {

    ANIMATIONDELAY_TIME : 500,
    WINTIP_TEXT : '获胜了!',
    FAILTIP_TEXT : '战败了...',
    ANIMATIONCHANGECONF_IN : cc.easeCubicActionIn(),
    ANIMATIONCHANGECONF_OUT : cc.easeCubicActionOut(),
    PLAYERSELFRANKING_ANIMATION_CONF:{
        STARTSCALE_VALUE: 2,
        ENDSCALE_VALUE : 1,
        SCALE_TIME : 0.5
    },
    OPPONENTRANKING_ANIMATION_CONF:{
        STARTSCALE_VALUE : 1.5,
        ENDSCALE_VALUE : 1,
        SCALE_TIME : 0.5
    },
    BTNGROUP_ANIMATION_CONF:{
        STARTSCALE_VALUE: 0.8,
        ENDSCALE_VALUE:1,
        SCALE_TIME : 0.5,
        DELAY_TIME : 180
    },
    BTANIMATION_CONF:{
        SCALE_TIME : 2,
        START_SCALE_VALUE : 1.05,
        END_SCALE_VALUE : 1
    },
    RESULTTIPLABELANIMATION_CONF:{
        GO_TIME : 0.6,
        BACK_TIME : 0.15,
        POINT_GO : {
            X : 0,
            Y : 420
        },
        POINT_BACK : {
            X : 0,
            Y : 460
        }
    },
    TRANSITION_TIME:{
        MAX_TIME : 4000,
        MIN_TIME : 1500
    }
}
