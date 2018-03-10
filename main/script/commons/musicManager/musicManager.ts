const {ccclass, property} = cc._decorator;

@ccclass
export default class MusicManager  {

    private static isPlayBgMusic:  boolean = true ; //是否播放背景音乐
    private static isPlayRuntimeMusic: Boolean = true;     //是否播放其他音乐

    private static currentBgMusic: cc.AudioSource = null;
    private static currentRuntimeMusic: cc.AudioSource = null;

    static init() {
        if(cc.sys.localStorage.getItem('musicBgSet')!=null){
            this.isPlayBgMusic = JSON.parse( cc.sys.localStorage.getItem('musicBgSet'));
        }
        else{
            this.isPlayBgMusic = true;
        }

        
        if(cc.sys.localStorage.getItem('musicRuntimeSet')!=null){
            this.isPlayRuntimeMusic =  JSON.parse(cc.sys.localStorage.getItem('musicRuntimeSet'));
        }
        else{
            this.isPlayRuntimeMusic = true;
        }

        this._appBackgroudListener();

    }

    /**
     * 手机后台 和前台运行监听，并对应执行音乐的暂停和播放
     */
    private static _appBackgroudListener(){
        cc.game.on(cc.game.EVENT_HIDE, () => {
            cc.audioEngine.pauseAll();
        });

        cc.game.on(cc.game.EVENT_SHOW, () => {
            cc.audioEngine.resumeAll();
        });
    }

    /**
     * 循环播放传入的背景音乐
     * @param bgMusic 
     */
    public static playBgMusic(bgMusic: cc.AudioClip){
        if(!this.isPlayBgMusic){
            // cc.log('bgMusic个人设置为不播放')
            return;
        }
        //传入音乐为空
        if (!bgMusic) {
            cc.log('音乐剪辑为空');
            return ;
        }
        if (this.currentBgMusic) {
            // cc.log('重置：')
            this.currentBgMusic.stop();
            this.currentBgMusic = null;
        }
        this.currentBgMusic = new cc.AudioSource();
        this.currentBgMusic.clip = bgMusic;
        this.currentBgMusic.play();
        this.currentBgMusic.loop = true;
        this.currentBgMusic.volume = 0.5
    }
    
    /**
     * 单次播放传入的指定音乐
     * @param music 
     */
    public static playRuntimeMusic(music: cc.AudioClip){
        //用户设置为不播放音乐
        if (this.isPlayRuntimeMusic == false) {
            // cc.log('runTimeMusic个人设置为不播放')
            return;
        }
        if(!music){
            cc.log('音乐剪辑为空');
            return ;
        }
        this.currentRuntimeMusic = new cc.AudioSource();
        this.currentRuntimeMusic.clip = music;
        this.currentRuntimeMusic.play();
        this.currentRuntimeMusic.loop = false;
        this.currentRuntimeMusic.volume = 0.5
    }

    /**
     * 根据传入的用户设置，设置背景音乐的可播放行
     * @param userSet 
     */
    public static  setBgMusicPlayable(userSet: boolean){
        this.isPlayBgMusic = userSet;
        
        cc.sys.localStorage.setItem('musicBgSet', userSet);
        if (!userSet) {
            this._puaseBgMusicPlay();
        }else{
            this._resumeBgMusicPlay();
        }
    }
    
    /**
     * 根据传入的用户设置，设置即时音乐的可播放行
     * @param userSet 
     */
    public static  setRuntimeMusicPlayable(userSet: boolean){
        this.isPlayRuntimeMusic = userSet;
        cc.sys.localStorage.setItem('musicRuntimeSet', userSet);
        if (!userSet) {
            this._puaseRuntimeMusicPlay();
        }else{
            this._resumeRuntimeMusicPlay();
        }
    }

    /**
     * 暂停背景音乐的播放
     */
    private static _puaseBgMusicPlay(){
        // cc.log('暂停背景音乐')
        if(this.currentBgMusic) {
            this.currentBgMusic.pause();
        }
    }
    
    /**
     * 暂停即时音乐的播放
     */
    private static _puaseRuntimeMusicPlay(){
        // cc.log('暂停其他音乐')
        if(this.currentRuntimeMusic) {
            this.currentRuntimeMusic.pause();
        }
    }
    
    /**
     * 恢复背景音乐的播放
     */
    private static _resumeBgMusicPlay(){
        // cc.log('resume背景音乐')
        if(this.currentBgMusic && this.isPlayBgMusic) {
            this.currentBgMusic.resume();
        }
    }
    
    /**
     * 恢复即时音乐的播放
     */
    private static _resumeRuntimeMusicPlay(){
        // cc.log('resume其他音乐')
        if(this.currentRuntimeMusic && this.isPlayRuntimeMusic) {
            this.currentRuntimeMusic.resume();
        }
    }
}
