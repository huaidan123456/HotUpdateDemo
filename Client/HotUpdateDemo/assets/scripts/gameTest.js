// Learn cc.Class:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/class.html
//  - [English] http://docs.cocos2d-x.org/creator/manual/en/scripting/class.html
// Learn Attribute:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://docs.cocos2d-x.org/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] https://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html
var UpdatePanel = require('UpdatePanel');
var HotUpdateControl = require('HotUpdateControl');
cc.Class({
    extends: cc.Component,

    properties: {
        updateControl:HotUpdateControl,
        panel: UpdatePanel,
        manifestUrl: {
            type: cc.Asset,
            default: null
        },
        updateUI: cc.Node,
        _updating: false,
        _canRetry: false,
        _storagePath: '',
    },


    start () {
        this.panel.fileProgress.progress = 0;
        this.panel.byteProgress.progress = 0;
        this.updateControl.initAssetsManager(this.manifestUrl,3);
        this.updateControl.setCheckResultCallback(function(error,checkResult){
            if(error){
                this.panel.info.string = "检查失败: code = " + error.code + ", info = " + error.info; 
            }else{
                cc.log(checkResult);
                if(checkResult.isNewVersion){
                    this.panel.info.string = "正在更新";
                    this.updateControl.hotUpdate();
                }else{
                    this.panel.info.string = "已经是最新版本了";
                }
            }
        },this);

        this.updateControl.setUpdateCallback(function(error,progressData){
            cc.log(progressData.downloadedFiles +' / ' + progressData.totalFiles);
            cc.log(progressData.downloadedBytes +' / ' + progressData.totalBytes);
            this.panel.byteProgress.progress = progressData.percent;
            this.panel.fileProgress.progress = progressData.percentByFile;
            this.panel.fileLabel.string = progressData.downloadedFiles +' / ' + progressData.totalFiles;
            this.panel.byteLabel.string = progressData.downloadedBytes +' / ' + progressData.totalBytes;
        },function(error){
            if(error){
                this.panel.info.string = "更新失败: code = " + error.code + ", info = " + error.info; 
            }else{
                this.panel.info.string = "更新完成";
                cc.audioEngine.stopAll();
                cc.game.restart();
            }
        },this);

        this.scheduleOnce(function(){
            this.panel.info.string = "正在检查更新";
            this.updateControl.check();
        },5);
        
    },

});
