const JSB_MD5 = require("jsb_md5");
/** 
 *  关于热更新 
 */
cc.Class({
    extends: cc.Component,

    properties: {

    },

    ctor(){
        this._assetsMng = null;
        this._storagePath = '';
        this._manifest = null;

        // 检查结果回调
        this._checkResultCallback = null;
        // 下载进度回调
        this._progressCallback = null;
        // 下载完成回调
        this._finishCallback = null;


        // 检查状态 -1:未检查 0:正在检查 1:检查完毕 
        this._checkState = -1;
        // 更新状态 -1:不可更新 0:可以更新 1:正在更新 2 更新完毕
        this._updateState = -1;

        // 可以重新尝试下载
        this._canRetry = false;
    },

    /**
     * 初始化管理器
     * @param {*} manifest 
     * @param {*} maxTask 
     */
    initAssetsManager(manifest,maxTask){
        maxTask = maxTask || 1;
        // 热更仅能用于 native build
        if(!cc.sys.isNative){
            return;
        }
        this._storagePath = ((jsb.fileUtils ? jsb.fileUtils.getWritablePath() : '/') + 'game-remote-asset');
        cc.log("远端资源储存路径: " + this._storagePath);

        this._manifest = manifest;
        let url = this._manifest.nativeUrl;
        if(cc.loader.md5Pipe){
            url = cc.loader.md5Pipe.transformURL(url);
        }
        this._assetsMng = new jsb.AssetsManager(url,this._storagePath,this._versionCompareHandle);
        if(cc.sys.os === cc.sys.OS_ANDROID){
            this._assetsMng.setMaxConcurrentTask(maxTask);
        }
        this._assetsMng.setVerifyCallback(this._verifyCallback);
    },
    /**
     * 检查更新 检查是否有更新
     */
    check(){
        // 正在检查
        if(this._checkState === 0){
            return;
        }
        // 判断 本地manifest是否加载
        if(this._assetsMng && (!this._assetsMng.getLocalManifest() || !this._assetsMng.getLocalManifest().isLoaded()))
        {
            if(this._checkResultCallback){
                let error = {code:0,info:"加载本地manifest失败"};
                let checkResult = null;
                this._checkResultCallback.call(this._checkResultCallback.target,error,checkResult);
            }
            return;
        }
        this._assetsMng.setEventCallback(this._checkEventCallback.bind(this));
        this._assetsMng.checkUpdate();
        this._checkState = 0;  // 正在检查
    },

    /**
     * 进行热更新
     */
    hotUpdate(){
        cc.log("aa " + this._checkState  + " " + this._updateState);
        if(this._checkState === 1 && this._updateState === 0){
            if(this._assetsMng){
                this._assetsMng.setEventCallback(this._updateEventCallback.bind(this));
                this._assetsMng.update();
                this._updateState = 1;
            }
        }
    },

    /**
     * 重新尝试更新
     */
    retryUpdate(){
        if(this._checkState === 1 && this._updateState === 2 && this._canRetry){
            if(this._assetsMng){
                this._assetsMng.downloadFailedAssets();
                this._updateState = 1;
                this._canRetry = false;
            }
        }
    },





    /**
     * 设置检查更新结果的回调
     * @param {更新结果信息} callback(error,checkResult)  
     * @param {*} target 
     */
    setCheckResultCallback(callback,target){
        this._checkResultCallback = callback;
        this._checkResultCallback.target = target;
    },

    /**
     * 设置更新回调
     * @param {更新进度} progressCallback(error,progressData) 
     * @param {更新完成} finishCallback(error)
     * @param {*} target 
     */
    setUpdateCallback(progressCallback,finishCallback,target){
        this._progressCallback = progressCallback;
        this._progressCallback.target = target;
        this._finishCallback = finishCallback;
        this._finishCallback.target = target;
    },





    /**
     * 设置校验的会带哦
     * @param {*} path 
     * @param {*} asset 
     */
    _verifyCallback(path,asset){
        // 当 asset被压缩的时候，我们不需要md5校验,因为zip文件已经被删除
        var compressed = asset.compressed;  // 是否被压缩
        var expectedMD5 = asset.md5;        // 
        var relativePath = asset.path;
        var size = asset.size;
        if(compressed){
            cc.log("校验 : " + relativePath);
            return true;
        }else{
            cc.log("Verification passed : " + relativePath + ' (' + expectedMD5 + ')');
            var resMD5 = JSB_MD5(jsb.fileUtils.getDataFromFile(path));
            return asset.md5 == resMD5;
        }
    },

    /**
     * 版本比较
     * @param {版本a} versionA 
     * @param {版本b} versionB 
     */
    _versionCompareHandle(versionA,versionB){
        var vA = versionA.split('.');
        var vB = versionB.split('.');
        for(var i = 0; i < vA.length; ++i){
            var a = parseInt(vA[i]);
            var b = parseInt(vB[i]);
            if(a === b){
                continue;
            }else{
                return a - b;
            }
        }
        if(vB.length > vA.length){
            return -1;
        }else{
            return 0;
        }
    },



    /**
     * 检查更新回调
     */
    _checkEventCallback(event){
        switch(event.getEventCode()){
            case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST: // 本地manifest没有被发现
                this._checkState = 1; // 检查完毕
                this._updateState = -1; // 不可以更新
                this._assetsMng.setEventCallback(null);
                if(this._checkResultCallback){
                    let error = {code:event.getEventCode(),info:"本地manifest没有发现"};
                    let checkResult = null;
                    this._checkResultCallback.call(this._checkResultCallback.target,error,checkResult);
                }
                break;
            case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST: // 下载清单错误
            case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:  // 解析manifest出错 
                this._checkState = 1; // 检查完毕
                this._updateState = -1; // 不可以更新
                this._assetsMng.setEventCallback(null);
                if(this._checkResultCallback){
                    let error = {code:event.getEventCode(),info:"下载manifest出错"};
                    let checkResult = null;
                    this._checkResultCallback.call(this._checkResultCallback.target,error,checkResult);
                }
                break;
            case jsb.EventAssetsManager.NEW_VERSION_FOUND:     //新版本被发现
                this._checkState = 1; // 检查完毕
                this._updateState = 0; // 可以更新
                this._assetsMng.setEventCallback(null);
                if(this._checkResultCallback){
                    let error = null;
                    let localVersion = this._assetsMng.getLocalManifest().getVersion();
                    let remoteVersion = this._assetsMng.getRemoteManifest().getVersion();
                    let checkResult = {isNewVersion:true,localVersion:localVersion,remoteVersion:remoteVersion};
                    this._checkResultCallback.call(this._checkResultCallback.target,error,checkResult);
                }
                break;
            case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:    //已经更新到最新版本
                this._checkState = 1; // 检查完毕
                this._updateState = -1; // 不可以更新
                this._assetsMng.setEventCallback(null);
                if(this._checkResultCallback){
                    let error = null;
                    let localVersion = this._assetsMng.getLocalManifest().getVersion();
                    let remoteVersion = this._assetsMng.getRemoteManifest().getVersion();
                    let checkResult = {isNewVersion:false,localVersion:localVersion,remoteVersion:remoteVersion};
                    this._checkResultCallback.call(this._checkResultCallback.target,error,checkResult);
                }
                break;
            default:
                break;
        }
    },

    /**
     * 更新回调
     */
    _updateEventCallback(event){
        switch(event.getEventCode()){
            case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST: // 本地manifest没有被发现
                this._updateState = 2;  // 更新完毕
                if(this._finishCallback){
                    let error = {code:event.getEventCode(),info:"本地manifest没有发现"};
                    this._finishCallback.call(this._finishCallback.target,error);
                }
                break;
            case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST: // 下载清单错误
            case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:  // 解析manifest出错 
                this._updateState = 2;  // 更新完毕
                if(this._finishCallback){
                    let error = {code:event.getEventCode(),info:"下载manifest出错"};
                    this._finishCallback.call(this._finishCallback.target,error);
                }
                break;
            case jsb.EventAssetsManager.NEW_VERSION_FOUND:     //新版本被发现
                break;
            case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:    //已经更新到最新版本
                break;
            case jsb.EventAssetsManager.UPDATE_PROGRESSION:    //持续更新
            if(this._progressCallback){
                let error = null;
                let progressData = {};
                progressData.percent = event.getPercent();
                progressData.percentByFile = event.getPercentByFile();
                progressData.downloadedBytes = event.getDownloadedBytes();
                progressData.totalBytes = event.getTotalBytes();
                progressData.downloadedFiles = event.getDownloadedFiles();
                progressData.totalFiles = event.getTotalFiles();
                this._progressCallback.call(this._progressCallback.target,error,progressData);
            }
                break;
            case jsb.EventAssetsManager.ASSET_UPDATED:         //资源被更新
                break;
            case jsb.EventAssetsManager.ERROR_UPDATING:        //更新中出错
            case jsb.EventAssetsManager.UPDATE_FAILED:         //更新失败
            case jsb.EventAssetsManager.ERROR_DECOMPRESS:      //解压出错
                this._updateState = 2;  // 更新完毕
                this._canRetry = true;  // 可以尝试重新下载
                if(this._finishCallback){
                    let error = {code:event.getEventCode(),info:"更新失败"};
                    this._finishCallback.call(this._finishCallback.target,error);
                }
                break;
            case jsb.EventAssetsManager.UPDATE_FINISHED:       //更新完成
                // 在下载资源完毕后，加入资源搜索路径
                var searchPaths = jsb.fileUtils.getSearchPaths();
                var newPaths = this._assetsMng.getLocalManifest().getSearchPaths();
                for(let i = 0; i < newPaths.length; i++){
                    if(searchPaths.indexOf(newPaths[i]) == -1){
                        Array.prototype.unshift.apply(searchPaths, newPaths[i]);
                    }
                }
                cc.sys.localStorage.setItem('HotUpdateSearchPaths', JSON.stringify(searchPaths));
                jsb.fileUtils.setSearchPaths(searchPaths);
                this._updateState = 2;  // 更新完毕
                cc.log("更新完毕");
                if(this._finishCallback){
                    let error = null;
                    this._finishCallback.call(this._finishCallback.target,error);
                }
                break;
        }
    },

    onDestroy(){
        this._assetsMng.setEventCallback(null);
    }


});
