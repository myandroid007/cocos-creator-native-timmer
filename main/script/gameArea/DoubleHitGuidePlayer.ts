import MusicManager from "../commons/musicManager/musicManager";

/**
 * 连击引导播放器
 * 龙涛
 * 2018/1/11
 */
export default class DoubleHitGuidePlayer {
    
    //普通连击次数
    private static ordinaryTimes:number=0;
    //特效连击次数
    private static effectsTimes:number=0;
    //普通消除次数
    private static ordinaryClickTimes:number=0;
    //普通魔力鸟
    private static ordinaryMagicTimes:number=0;
    //特效魔力鸟
    private static effectsMagicTimes:number=0;
    
    private static ordinaryGuide:cc.Node=null;
    private static effectsGuide:cc.Node=null;
    private static musicArray:cc.AudioClip[]=[];

    /**
     * 播放引导，需要传入目标节点
     * @param targetArray 目标节点数组
     * @param musicArray  播放的音效资源数组
     */
    public static init(targetArray:cc.Node[],musicArray:cc.AudioClip[]){
        if(targetArray.length>0){
            this.ordinaryGuide=targetArray[0];
            this.effectsGuide=targetArray[1];
        }
        this.musicArray=musicArray;
    }

    /**
     * 设置引导
     */
    public static play():void{ 
       if(this.ordinaryClickTimes==4){
          this.ordinaryGuide.getComponent(cc.Label).string='加油了';
          this.implementPlay(this.ordinaryGuide,this.musicArray[4],1);
          this.ordinaryClickTimes=0;
       }
       if(this.ordinaryTimes>0){
          if(this.ordinaryTimes>=1&&this.ordinaryTimes<=3){
              this.ordinaryGuide.getComponent(cc.Label).string='很棒了';
              this.implementPlay(this.ordinaryGuide,this.musicArray[3],1);
          }else if(this.ordinaryTimes>3){
              this.ordinaryGuide.getComponent(cc.Label).string='完美';
              this.implementPlay(this.ordinaryGuide,this.musicArray[0],1);
          }
          if(this.effectsTimes>=2&&this.effectsTimes<=4){
              this.effectsGuide.getComponent(cc.Label).string='厉害了';
          }else if(this.effectsTimes>4){
              this.effectsGuide.getComponent(cc.Label).string='炫酷';
          }
       }else{
          this.ordinaryClickTimes++;
          if(this.effectsTimes>=2&&this.effectsTimes<=4){
              this.effectsGuide.getComponent(cc.Label).string='厲害了';
              this.implementPlay(this.effectsGuide,this.musicArray[0],2);
          }else if(this.effectsTimes>4){
              this.effectsGuide.getComponent(cc.Label).string='炫酷';
              this.implementPlay(this.effectsGuide,this.musicArray[2],2);
          }

       }
    }

    /**
     * 播放引导
     */
    private static implementPlay(target:cc.Node,music:cc.AudioClip,index:number){
        let startX= target.x;
        let startY= target.y;
        let animIn1=cc.scaleTo(0.1,2,2).easing(cc.easeCubicActionIn());
        let animIn2=cc.moveTo(0.1,cc.p(startX+50,startY-50)).easing(cc.easeCubicActionOut());
        let animOut1=cc.scaleTo(0.2,0.5,0.5).easing(cc.easeCubicActionIn());
        let animOut2=cc.moveTo(0.2,cc.p(startX+20,startY-20)).easing(cc.easeCubicActionIn());

        //进入动画结束时回调
        let funcIn=cc.callFunc(function(){
            setTimeout(function(){
                target.runAction(sequnceOut);
            },400);
        },this);

        //出去动画结束时回调
        let funcOut=cc.callFunc(function(){
            target.active=false;
            target.setScale(1,1);
            target.y=startY;
            target.x=startX;
            this.ordinaryClickTimes=0;
            switch(index){
                case 1:
                  if(this.effectsTimes>=2){
                    this.implementPlay(this.effectsGuide,this.musicArray[0],2);
                  }else{
                    if(this.ordinaryMagicTimes>0){
                        this.ordinaryGuide.getComponent(cc.Label).string='完美';
                        this.implementPlay(this.ordinaryGuide,this.musicArray[0],3);
                    }else{
                        if(this.effectsMagicTimes>0){
                            this.effectsGuide.getComponent(cc.Label).string='太酷了';
                            this.implementPlay(this.effectsGuide,this.musicArray[0],4);
                        }  
                    }
                }
                    this.ordinaryTimes=0;
                    break;
                case 2:
                  if(this.ordinaryMagicTimes){
                     this.effectsGuide.getComponent(cc.Label).string='完美';
                     this.implementPlay(this.ordinaryGuide,this.musicArray[0],3);
                  }else{
                    if(this.effectsMagicTimes>0){
                        this.effectsGuide.getComponent(cc.Label).string='太酷了';
                        this.implementPlay(this.effectsGuide,this.musicArray[0],4);
                    }
                  }
                    this.effectsTimes=0;
                    break;
                case 3:
                  if(this.effectsMagicTimes>0){
                      this.effectsGuide.getComponent(cc.Label).string='太酷了';
                      this.implementPlay(this.effectsGuide,this.musicArray[0],4);
                      //this.effectsMagicTimes=0;
                  }
                    this.ordinaryMagicTimes=0;
                    break;
                case 4:
                    this.effectsMagicTimes=0;
                    break;
            }
        },this);

        let spawnIn=cc.spawn(animIn1,animIn2);
        let spawnOut=cc.spawn(animOut1,animOut2);
        let sequnceIn=cc.sequence(spawnIn,funcIn);
        let sequnceOut=cc.sequence(spawnOut,funcOut);
        target.active=true;
        target.runAction(sequnceIn);
        MusicManager.playRuntimeMusic(music);
    }
    public static recordOrdinaryTimes():void{
        this.ordinaryTimes++;
    }

    public static recordOrdinaryClickTimes():void{
        this.ordinaryClickTimes++;
    }

    public static recordEffectsTimes():void{
        this.effectsTimes++;
    }

    public static recordOrdinaryMagicTimes():void{
        this.ordinaryMagicTimes++;
    }

    public static recordEffectsMagicTimes():void{
        this.effectsMagicTimes++;
    }
}
