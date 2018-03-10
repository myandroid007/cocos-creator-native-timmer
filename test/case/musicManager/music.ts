import MusicManager from "../../../main/script/commons/musicManager/musicManager";

const {ccclass, property} = cc._decorator;

@ccclass
export default class Music extends cc.Component {

    @property(cc.AudioClip)
    bgMusic: cc.AudioClip = null;

    @property(cc.AudioClip)
    clickMusic: cc.AudioClip = null;


    bgMusicSet: boolean  = true;
    otherMusicSet: boolean = true;

    onLoad() {
        
    }

    /**
     * 播放背景音乐
     */
    playBgMusic(){
        MusicManager.playBgMusic(this.bgMusic);
    }

    /**
     * 播放点击音乐
     */
    playClickMusic(){
        MusicManager.playRuntimeMusic(this.clickMusic);
    }

    getReverseBgSet(){
        let currentBgMusicSet = !this.bgMusicSet;
        this.bgMusicSet = currentBgMusicSet;
        return currentBgMusicSet
    } 
    getReverseOtherSet(){
        let currentOtherMusicSet = !this.otherMusicSet;
        this.otherMusicSet = currentOtherMusicSet;
        return currentOtherMusicSet
    } 


    setBgMusicPlay(){
        let userSet = this.getReverseBgSet();
        // cc.log(`当前背景音乐设置：${userSet}`)
        let bgSetBtn = this.node.getChildByName('bgMusicSet').getChildByName('Label');
        if(userSet == true) {
            bgSetBtn.getComponent(cc.Label).string = '背景音乐播放-开'
            
        }else {
            
            bgSetBtn.getComponent(cc.Label).string = '背景音乐播放-关'
        }
        
        MusicManager.setBgMusicPlayable(userSet);
    }
    
    setOtherMusicPlay(){
        let userSet = this.getReverseOtherSet();
        let bgSetBtn = this.node.getChildByName('otherMusicSet').getChildByName('Label');
        if(userSet == true) {
            bgSetBtn.getComponent(cc.Label).string = '其他音乐播放-开'
            
        }else {
            
            bgSetBtn.getComponent(cc.Label).string = '其他音乐播放-关'
        }
        
        // cc.log(`当前其他音乐设置：${userSet}`)
        MusicManager.setRuntimeMusicPlayable(userSet);

    }
}
