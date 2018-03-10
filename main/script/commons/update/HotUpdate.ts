import ProgressPanel from "../UI/ProgressPanel";

/**
 * 热更新参数
 */
type HotUpdateParam = {
    /** 更新进度面板 */
    panel: ProgressPanel,  

    /** 项目清单文件地址 */
    manifestUrl: cc.RawAsset,

    /** 存储文件名称 */
    projectName: string,

    /**
     *  当为以下两种情况时需要调用本方法 
     *  1. 热更新检测完成且不需要进行热更新
     *  2. 热更新失败时
     */
    onEnd: () => void,

    /** 是否开启手动更新，默认为自动更新 */
    manualUpdate?: boolean,
 }

 /** 热更新功能组件 */
export default class HotUpdate {
    private static _param: HotUpdateParam = null;

    //type {jsb.AssetsManager}
    private static _am: any = null;
    private static _updating: boolean = false;
    private static _canRetry: boolean = false;
    private static _storagePath: string = '';
    private static _failCount: number = 0;

    private static _checkListener: cc.EventListener = null;
    private static _updateListener: cc.EventListener = null;

    /**
     * 初始化热更新组件
     */
    public static init(param: HotUpdateParam) {
        this._param = param;
        this.onLoad();
    }

    /**
     * 检测热更新的回调方法
     * 
     * @param event {jsb.EventAssetsManager} 进行热更新检测时发送的资源管理器事件
     */
    public static checkCb(event: any) {
        cc.log('Chceck Code: ' + event.getEventCode());
        let {panel, onEnd, manualUpdate} = this._param;
        switch (event.getEventCode()) {
            case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
                panel.info.string = "No local manifest file found, hot update skipped.";
                break;
            case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
            case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
                panel.info.string = "Fail to download manifest file, hot update skipped.";
                break;
            case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
                panel.info.string = "Already up to date with the latest remote version.";
                break;
            case jsb.EventAssetsManager.NEW_VERSION_FOUND:
                panel.info.string = 'New version found, please try to update.';
                panel.progressBar.progress = 0;
                break;
            default:
                return;
        }
        
        cc.eventManager.removeListener(this._checkListener);
        this._checkListener = null;
        this._updating = false;

        if (event.getEventCode() == jsb.EventAssetsManager.NEW_VERSION_FOUND) {
            if (!manualUpdate) {
                // 当没有开启手动更新时，默认进行自动更新
                this.hotUpdate();
            }
            // TODO 2018/3/1 实现手动热更新
        } else {
           !!onEnd && onEnd(); 
        }
    }

    /**
     * 进行资源更新的回调方法
     * 
     * @param event {jsb.EventAssetsManager} 进行资源更新时发送的资源管理器事件
     */
    public static updateCb(event: any) {
        let needRestart = false;
        let failed = false;
        let {panel, onEnd} = this._param;
        switch (event.getEventCode())
        {
            case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
                panel.info.string = 'No local manifest file found, hot update skipped.';
                failed = true;
                break;
            case jsb.EventAssetsManager.UPDATE_PROGRESSION:
                panel.progressBar.progress = event.getPercent();
                panel.percentInfo.string = `Downloading...${Math.floor(event.getPercent() * 100)}%`

                let msg = event.getMessage();
                if (!!msg) {
                    panel.info.string = 'Updated file: ' + msg;
                }
                break;
            case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
            case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
                panel.info.string = 'Fail to download manifest file, hot update skipped.';
                failed = true;
                break;
            case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
                panel.info.string = 'Already up to date with the latest remote version.';
                failed = true;
                break;
            case jsb.EventAssetsManager.UPDATE_FINISHED:
                panel.info.string = 'Update finished. ' + event.getMessage();
                needRestart = true;
                break;
            case jsb.EventAssetsManager.UPDATE_FAILED:
                panel.info.string = 'Update failed. ' + event.getMessage();
                this._updating = false;
                this._canRetry = true;
                break;
            case jsb.EventAssetsManager.ERROR_UPDATING:
                panel.info.string = 'Asset update error: ' + event.getAssetId() + ', ' + event.getMessage();
                break;
            case jsb.EventAssetsManager.ERROR_DECOMPRESS:
                panel.info.string = event.getMessage();
                break;
            default:
                break;
        }

        if (failed) {
            cc.eventManager.removeListener(this._updateListener);
            this._updateListener = null;
            this._updating = false;
        }

        if (needRestart) {
            this._restartGame();
        } else {
            // 更新失败且不用重启时，调用结束方法
            !!onEnd && onEnd();            
        }
    }

    /**
     * 设置默认的资源搜索路径并重启游戏
     */
    private static _restartGame() {
        cc.eventManager.removeListener(this._updateListener);
        this._updateListener = null;
        // Prepend the manifest's search path
        let searchPaths = jsb.fileUtils.getSearchPaths();
        let newPaths = this._am.getLocalManifest().getSearchPaths();
        console.log(JSON.stringify(newPaths));
        Array.prototype.unshift.apply(searchPaths, newPaths);
        // This value will be retrieved and appended to the default search path during game startup,
        // please refer to samples/js-tests/main.js for detailed usage.
        // !!! Re-add the search paths in main.js is very important, otherwise, new scripts won't take effect.
        cc.sys.localStorage.setItem('HotUpdateSearchPaths', JSON.stringify(searchPaths));
        jsb.fileUtils.setSearchPaths(searchPaths);

        cc.audioEngine.stopAll();
        cc.game.restart();
    }
    
    /**
     * 更新失败，重新尝试更新 
     */
    public static retry() {
        if (!this._updating && this._canRetry) {
            this._canRetry = false;
            
            this._param.panel.info.string = 'Retry failed Assets...';
            this._am.downloadFailedAssets();
        }
    }
    
    /** 
     * 检测热更新
     */
    public static checkUpdate() {
        if (!cc.sys.isNative) {
            return;
        }

        let {panel, manifestUrl} = this._param;
        if (this._updating) {
            panel.info.string = 'Checking or updating ...';
            return;
        }
        if (this._am.getState() === jsb.AssetsManager.State.UNINITED) {
            this._am.loadLocalManifest(manifestUrl);
        }
        if (!this._am.getLocalManifest() || !this._am.getLocalManifest().isLoaded()) {
            panel.info.string = 'Failed to load local manifest ...';
            !!this._param.onEnd && this._param.onEnd();
            return;
        }
        this._checkListener = new jsb.EventListenerAssetsManager(this._am, this.checkCb.bind(this));
        cc.eventManager.addListener(this._checkListener, 1);

        this._am.checkUpdate();
        this._updating = true;
    }

    /**
     * 进行热更新
     */
    public static hotUpdate() {
        if (!cc.sys.isNative) {
            return;
        }
        cc.info("start hot update");

        if (this._am && !this._updating) {
            this._updateListener = new jsb.EventListenerAssetsManager(this._am, this.updateCb.bind(this));
            cc.eventManager.addListener(this._updateListener, 1);

            if (this._am.getState() === jsb.AssetsManager.State.UNINITED) {
                this._am.loadLocalManifest(this._param.manifestUrl);
            }

            this._failCount = 0;
            this._am.update();
            this._updating = true;
        }
    }

    // use this for initialization
    public static onLoad() {
        // Hot update is only available in Native build
        if (!cc.sys.isNative) {
            return;
        }
        this._storagePath = ((jsb.fileUtils ? jsb.fileUtils.getWritablePath() : '/') + `${this._param.projectName}-remote-asset`);
        cc.log('Storage path for remote asset : ' + this._storagePath);

        // Setup your own version compare handler, versionA and B is versions in string
        // if the return value greater than 0, versionA is greater than B,
        // if the return value equals 0, versionA equals to B,
        // if the return value smaller than 0, versionA is smaller than B.
        let versionCompareHandle = function (versionA, versionB) {
            cc.log("JS Custom Version Compare: version A is " + versionA + ', version B is ' + versionB);
            let vA = versionA.split('.');
            let vB = versionB.split('.');
            for (let i = 0; i < vA.length; ++i) {
                let a = parseInt(vA[i]);
                let b = parseInt(vB[i] || 0);
                if (a === b) {
                    continue;
                } else {
                    return a - b;
                }
            }
            if (vB.length > vA.length) {
                return -1;
            } else {
                return 0;
            }
        };

        // Init with empty manifest url for testing custom manifest
        this._am = new jsb.AssetsManager('', this._storagePath, versionCompareHandle);
        // if (!cc.sys.ENABLE_GC_FOR_NATIVE_OBJECTS) {
        //     this._am.retain();
        // }

        let {panel} = this._param;
        // Setup the verification callback, but we don't have md5 check function yet, so only print some message
        // Return true if the verification passed, otherwise return false
        this._am.setVerifyCallback(function (path, asset) {
            // When asset is compressed, we don't need to check its md5, because zip file have been deleted.
            let compressed = asset.compressed;
            // Retrieve the correct md5 value.
            let expectedMD5 = asset.md5;
            // asset.path is relative path and path is absolute.
            let relativePath = asset.path;
            // The size of asset file, but this value could be absent.
            let size = asset.size;
            if (compressed) {
                panel.info.string = "Verification passed : " + relativePath;
                return true;
            } else {
                panel.info.string = "Verification passed : " + relativePath + ' (' + expectedMD5 + ')';
                return true;
            }
        });

        panel.info.string = 'Hot update is ready, please check or directly update.';

        if (cc.sys.os === cc.sys.OS_ANDROID) {
            // Some Android device may slow down the download process when concurrent tasks is too much.
            // The value may not be accurate, please do more test and find what's most suitable for your game.
            this._am.setMaxConcurrentTask(2);
            panel.info.string = "Max concurrent tasks count have been limited to 2";
        }
        
        panel.progressBar.progress = 0;
    }

    public static onDestroy() {
        if (!!this._checkListener) {
            cc.eventManager.removeListener(this._checkListener);
            this._checkListener = null;
        }

        if (!!this._updateListener) {
            cc.eventManager.removeListener(this._updateListener);
            this._updateListener = null;
        }

        // if (this._am && !cc.sys.ENABLE_GC_FOR_NATIVE_OBJECTS) {
        //     this._am.release();
        // }
    }
}