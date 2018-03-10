/**
 * 文件说明：
 * 此文件存放项目中所有的接口。
 */


// /**
//  * 签到奖励
//  */
// export interface   SignAward  {
//     name: string,       //奖励名称
//     amount: number ,   //奖品数量
//     description: string,  //奖品描述
// }
/**
 * 签到奖励
 */
export interface   SignAward  {
    // name: string,       //奖励名称
    // amount: number ,   //奖品数量
    // description: string,  //奖品描述
    diamond: number,      //  钻石
    gold: number,         //金币
    strength: number,      //体力
    point: number          //积分
}

/**
 * 声明匹配窗口配置参数接口
 */
export  interface MatchBoxConfigure {
    type?: string,              //匹配框类型
    scale?: number,             //匹配框缩放比例
    iconSize?:number,           //头像图标大小
    iconDistance?:number,       //头像图标间距
    labelPositionY?:number,     //名称文本y坐标
    nodeLocationY?:number,      //节点在父节点里面的y坐标  
    opponentNum?: number,       //对手数量
    isShowVsIcon?: boolean,     //是否显示Vs图标标志
    isRandom?: boolean ,        //是否随机标志
    nodeNamePrefixs?: string[], //各个节点的名称前缀数组
    defultFrame?: string
}

export  interface PlayResult{
    id : number ,
    ranking : number ,
    score : number ,
    nickname : string ,  
    avatar : string   
}

export  interface EPlayer {
    username : string , 
    nickname : string , 
          id : number, 
      avatar : string , 
  isVirtual  : boolean,
   gameScore?: number, //虚拟玩家最终得分
       level?: string, 
currentExperience?:number,
totalExperience? : number
}

export const enum ButtonType{
    MB_OK,     //ok按钮
    MB_OK_AND_CLOSE,// ok按钮点击后自动关闭提示框
    MB_YES_AND_CLOSE,//是按钮，点击后自动关闭消息框
    MB_NO,// 否按钮
    MB_RETRY,// 重试按钮
    MB_QUIT// 退出按钮
}
//消息框内部按钮配置接口
export interface MessageButton {
    type: ButtonType//按钮类型
    name: string,//按钮上的字
    isShowName?:boolean,
    animType?:string,
    normal?: string, //按钮静止时图片
    pressed?: string ,//按钮按下时图片
    hover?:string ,//鼠标移过时图片
    disabled?: string, //按钮不可点击时图片
    handle?: Function //按钮点击后的场景回调方法
}

//消息框配置接口
export interface MessageBoxConfig{
    bg?:string, //背景图片
    title?: string, // 消息框标题,
    message?: string,// 消息提示文本内容
    buttons?:MessageButton[],  //消息上的按钮数组
    isShowCancelBtn?:boolean, //是否显示关闭按钮
    isResidentNode?:boolean,
    icon?:string//文本提示前的图标
}


/**
 * 通用场景参数
 */
export interface CommonSceneParam {
    /**
     * 场景输入数据 
     */
    sceneInput?: Object,

    /**
     * 场景加载时的加载提示页面，如果不指定则使用默认的加载提示页面
     */
    loadingView?: Object,

    /**
     * 当用户没有加载权限时，需要调用的方法 
     */
    onNoPermission?: (message: string) => {},

    /**
     * 当加载场景出错时，需要调用的方法 
     */
    onLaunchError?: (error: Error) => {},

    /**
     * 当加载场景完成时，需要调用的方法 
     */
    onLaunched?: Function,
}

/**
 * 场景路由
 */
export interface SceneRoute extends CommonSceneParam {
    /**
     * 场景名称 
     */
    sceneName: string,
}

export  interface PlayerProp  {
    id:  number,  
    gameId:number,
    diamond :  number, 
    gold :  number , 
    strength : number , 
    groove:number,
    point : number
}


/**
 * 网络类型
 * @author 龙涛
 * 2018/1/19
 */
export const  enum NetwokType{
    NO_NETWORK='NO NET CONNECT',
    WIFI='WIFI',
    MOBILE_CHINA_MOBILE_2G='中国移动2G',
    MOBILE_CHINA_MOBILE_3G='中国移动3G',
    MOBILE_CHINA_MOBILE_4G='中国移动4G',
    MOBILE_CHINA_UNICOM_2G='中国联通2G',
    MOBILE_CHINA_UNICOM_3G='中国联通3G',
    MOBILE_CHINA_UNICOM_4G='中国联通4G',
    MOBILE_CHINA_TELECOM_2G='中国电信2G',
    MOBILE_CHINA_TELECOM_3G='中国电信3G',
    MOBILE_CHINA_TELECOM_4G='中国电信4G'
  }


