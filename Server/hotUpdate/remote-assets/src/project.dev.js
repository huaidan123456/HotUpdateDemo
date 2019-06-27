window.__require = function e(t, n, r) {
  function s(o, u) {
    if (!n[o]) {
      if (!t[o]) {
        var b = o.split("/");
        b = b[b.length - 1];
        if (!t[b]) {
          var a = "function" == typeof __require && __require;
          if (!u && a) return a(b, !0);
          if (i) return i(b, !0);
          throw new Error("Cannot find module '" + o + "'");
        }
      }
      var f = n[o] = {
        exports: {}
      };
      t[o][0].call(f.exports, function(e) {
        var n = t[o][1][e];
        return s(n || e);
      }, f, f.exports, e, t, n, r);
    }
    return n[o].exports;
  }
  var i = "function" == typeof __require && __require;
  for (var o = 0; o < r.length; o++) s(r[o]);
  return s;
}({
  HotUpdateControl: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "e0656xKDGhLqoLeLlHQ78Vh", "HotUpdateControl");
    "use strict";
    cc.Class({
      extends: cc.Component,
      properties: {},
      ctor: function ctor() {
        this._assetsMng = null;
        this._storagePath = "";
        this._manifest = null;
        this._checkResultCallback = null;
        this._progressCallback = null;
        this._finishCallback = null;
        this._checking = false;
        this._updating = false;
        this._checkState = -1;
        this._updateState = -1;
        this._canRetry = false;
      },
      initAssetsManager: function initAssetsManager(manifest, maxTask) {
        if (!cc.sys.isNative) return;
        this._storagePath = (jsb.fileUtils ? jsb.fileUtils.getWritablePath() : "/") + "game-remote-asset";
        cc.log("\u8fdc\u7aef\u8d44\u6e90\u50a8\u5b58\u8def\u5f84: " + this._storagePath);
        this._manifest = manifest;
        var url = this._manifest.nativeUrl;
        cc.loader.md5Pipe && (url = cc.loader.md5Pipe.transformURL(url));
        this._assetsMng = new jsb.AssetsManager(url, this._storagePath, this._versionCompareHandle);
        cc.sys.os === cc.sys.OS_ANDROID && this._assetsMng.setMaxConcurrentTask(maxTask);
      },
      check: function check() {
        if (0 === this._checkState) return;
        if (this._assetsMng && (!this._assetsMng.getLocalManifest() || !this._assetsMng.getLocalManifest().isLoaded())) {
          if (this._checkResultCallback) {
            var error = {
              code: 0,
              info: "\u52a0\u8f7d\u672c\u5730manifest\u5931\u8d25"
            };
            var checkResult = null;
            this._checkResultCallback.call(this._checkResultCallback.target, error, checkResult);
          }
          return;
        }
        this._assetsMng.setEventCallback(this._checkEventCallback.bind(this));
        this._assetsMng.checkUpdate();
        this._checkState = 0;
      },
      hotUpdate: function hotUpdate() {
        if (1 === this._checkState && 0 === this._updateState && this._assetsMng) {
          this._assetsMng.setEventCallback(this._updateEventCallback.bind(this));
          this._assetsMng.update();
          this._updateState = 1;
        }
      },
      retryUpdate: function retryUpdate() {
        if (1 === this._checkState && 2 === this._updateState && this._canRetry && this._assetsMng) {
          this._assetsMng.downloadFailedAssets();
          this._updateState = 1;
          this._canRetry = false;
        }
      },
      setCheckResultCallback: function setCheckResultCallback(callback, target) {
        this._checkResultCallback = callback;
        this._checkResultCallback.target = target;
      },
      setUpdateCallback: function setUpdateCallback(progressCallback, finishCallback, target) {
        this._progressCallback = progressCallback;
        this._progressCallback.target = target;
        this._finishCallback = finishCallback;
        this._finishCallback.target = target;
      },
      _verifyCallback: function _verifyCallback(path, asset) {
        var compressed = asset.compressed;
        var expectedMD5 = asset.md5;
        var relativePath = asset.path;
        var size = asset.size;
        if (compressed) {
          cc.log("\u6821\u9a8c : " + relativePath);
          return true;
        }
        cc.log("\u6821\u9a8c : " + relativePath + "( " + expectedMD5 + ") ");
        return true;
      },
      _versionCompareHandle: function _versionCompareHandle(versionA, versionB) {
        var vA = versionA.split(".");
        var vB = versionB.split(".");
        for (var i = 0; i < vA.length; ++i) {
          var a = parseInt(vA[i]);
          var b = parseInt(vB[i]);
          if (a === b) continue;
          return a - b;
        }
        return vB.length > vA.length ? -1 : 0;
      },
      _checkEventCallback: function _checkEventCallback(event) {
        switch (event.getEventCode()) {
         case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
          if (this._checkResultCallback) {
            var error = {
              code: event.getEventCode(),
              info: "\u672c\u5730manifest\u6ca1\u6709\u53d1\u73b0"
            };
            var checkResult = null;
            this._checkResultCallback.call(this._checkResultCallback.target, error, checkResult);
          }
          this._updateState = -1;
          break;

         case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
         case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
          if (this._checkResultCallback) {
            var _error = {
              code: event.getEventCode(),
              info: "\u4e0b\u8f7dmanifest\u51fa\u9519"
            };
            var _checkResult = null;
            this._checkResultCallback.call(this._checkResultCallback.target, _error, _checkResult);
          }
          this._updateState = -1;
          break;

         case jsb.EventAssetsManager.NEW_VERSION_FOUND:
          if (this._checkResultCallback) {
            var _error2 = null;
            var localVersion = this._am.getLocalManifest().getVersion();
            var remoteVersion = this._am.getRemoteManifest().getVersion();
            var _checkResult2 = {
              isNewVersion: true,
              localVersion: localVersion,
              remoteVersion: remoteVersion
            };
            this._checkResultCallback.call(this._checkResultCallback.target, _error2, _checkResult2);
          }
          this._updateState = 0;
          break;

         case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
          if (this._checkResultCallback) {
            var _error3 = null;
            var _localVersion = this._am.getLocalManifest().getVersion();
            var _remoteVersion = this._am.getRemoteManifest().getVersion();
            var _checkResult3 = {
              isNewVersion: false,
              localVersion: _localVersion,
              remoteVersion: _remoteVersion
            };
            this._checkResultCallback.call(this._checkResultCallback.target, _error3, _checkResult3);
          }
          this._updateState = -1;
          break;

         default:
          return;
        }
        this._assetsMng.setEventCallback(null);
        this._checkState = 1;
      },
      _updateEventCallback: function _updateEventCallback(event) {
        switch (event.getEventCode()) {
         case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
          if (this._finishCallback) {
            var error = {
              code: event.getEventCode(),
              info: "\u672c\u5730manifest\u6ca1\u6709\u53d1\u73b0"
            };
            this._finishCallback.call(this._finishCallback.target, error);
          }
          this._updateState = 2;
          break;

         case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
         case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
          if (this._finishCallback) {
            var _error4 = {
              code: event.getEventCode(),
              info: "\u4e0b\u8f7dmanifest\u51fa\u9519"
            };
            this._finishCallback.call(this._finishCallback.target, _error4);
          }
          this._updateState = 2;
          break;

         case jsb.EventAssetsManager.NEW_VERSION_FOUND:
         case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
          break;

         case jsb.EventAssetsManager.UPDATE_PROGRESSION:
          if (this._progressCallback) {
            var _error5 = null;
            var progressData = {};
            progressData.percent = event.getPercent();
            progressData.percentByFile = event.getPercentByFile();
            progressData.DownloadedBytes = event.getDownloadedBytes();
            progressData.TotalBytes = event.getTotalBytes();
            progressData.DownloadedFiles = event.getDownloadedFiles();
            progressData.TotalFiles = event.getTotalFiles();
            this._progressCallback.call(this._progressCallback.target, _error5, progressData);
          }
          break;

         case jsb.EventAssetsManager.ASSET_UPDATED:
          break;

         case jsb.EventAssetsManager.ERROR_UPDATING:
         case jsb.EventAssetsManager.UPDATE_FAILED:
         case jsb.EventAssetsManager.ERROR_DECOMPRESS:
          if (this._finishCallback) {
            var _error6 = {
              code: event.getEventCode(),
              info: "\u66f4\u65b0\u5931\u8d25"
            };
            this._finishCallback.call(this._finishCallback.target, _error6);
          }
          this._updateState = 2;
          this._canRetry = true;
          break;

         case jsb.EventAssetsManager.UPDATE_FINISHED:
          var searchPaths = jsb.fileUtils.getSearchPaths();
          var newPaths = this._assetsMng.getLocalManifest().getSearchPaths();
          for (var i = 0; i < newPaths.length; i++) -1 == searchPaths.indexOf(newPaths[i]) && Array.prototype.unshift.apply(searchPaths, newPaths[i]);
          cc.sys.localStorage.setItem("HotUpdateSearchPaths", JSON.stringify(searchPaths));
          jsb.fileUtils.setSearchPaths(searchPaths);
          if (this._finishCallback) {
            var _error7 = null;
            this._finishCallback.call(this._finishCallback.target, _error7);
          }
          this._updateState = 2;
        }
      },
      onDestroy: function onDestroy() {
        this._assetsMng.setEventCallback(null);
      }
    });
    cc._RF.pop();
  }, {} ],
  HotUpdateMng: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "424d33C8QhAbZJqBVc1Vrtj", "HotUpdateMng");
    "use strict";
    cc.Class({
      extends: cc.Component,
      properties: {},
      start: function start() {}
    });
    cc._RF.pop();
  }, {} ],
  HotUpdateTest: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "9c434CKEL9O1IksVVd5+sVN", "HotUpdateTest");
    "use strict";
    var UpdatePanel = require("UpdatePanel");
    var JSB_MD5 = require("jsb_r_md5");
    var customManifestStr = JSON.stringify({
      packageUrl: "http://192.168.50.220:5555/tutorial-hot-update/remote-assets/",
      remoteManifestUrl: "http://192.168.50.220:5555/tutorial-hot-update/remote-assets/project.manifest",
      remoteVersionUrl: "http://192.168.50.220:5555/tutorial-hot-update/remote-assets/version.manifest",
      version: "1.10",
      assets: {
        "src/cocos2d-jsb.js": {
          size: 3341465,
          md5: "fafdde66bd0a81d1e096799fb8b7af95"
        },
        "src/project.dev.js": {
          size: 97814,
          md5: "ed7f5acd411a09d4d298db800b873b00"
        },
        "src/settings.js": {
          size: 3849,
          md5: "deb03998a4cfb8f8b468fba8575cb1c9"
        },
        "res/import/03/0379fb962.json": {
          size: 1107,
          md5: "d102d0f14ed6b6cb42cc28d88b3b9069"
        },
        "res/import/0c/0cd5de143.json": {
          size: 80883,
          md5: "f06347880038a1381043ed505d6f8a9a"
        },
        "res/import/0d/0d756af45.json": {
          size: 10137,
          md5: "02dc8b795e79b9fd62e00d4a2c70c8c1"
        },
        "res/import/0d/0dc6a4e59.json": {
          size: 14970,
          md5: "a500f696892df6869341dff5f31b1a33"
        },
        "res/import/41/4128b78b-00ae-4d8a-ae35-4e5ca5c5cde9.json": {
          size: 76,
          md5: "3f79d93ce8d42b186ecd43d868c8d023"
        },
        "res/import/49/49539cb0-3893-459a-b310-7cc1b7f6d335.json": {
          size: 72,
          md5: "8a36388cda7c3773b5bf7a53d8824535"
        },
        "res/import/9e/9e2ae507-fae5-4511-940b-f2e46f81b790.json": {
          size: 74,
          md5: "98f6b1d93a4ee3a1f2074be9ce00fbb2"
        },
        "res/raw-assets/0e/0ed8cf6e-8c04-4569-8d17-626a26e1099f.png": {
          size: 4665,
          md5: "9e8bf9af30ac7a9ea9d3b72f37a193e1"
        },
        "res/raw-assets/13/137d1ca6-e90c-440b-9fa2-4b9ffff569f7.png": {
          size: 1627,
          md5: "75060291e24294abd6a52553fa22317e"
        },
        "res/raw-assets/15/15d5f3f0-f965-4c00-945b-d2c8faee78b6.png": {
          size: 3840,
          md5: "cb525edab8063a845e6bd1e9d29b8cde"
        },
        "res/raw-assets/19/19509bb1-dc08-4cbf-ab8f-2460e207265c.png": {
          size: 9638,
          md5: "6e159c9cc1b971d3921bc8908071a70b"
        },
        "res/raw-assets/26/26e9a867-3d2f-4981-8a33-82d440de7aff.png": {
          size: 6417,
          md5: "5c139729708dd26bd461bcd3e8201823"
        },
        "res/raw-assets/2d/2ddfe005-2129-41d8-aeec-2b1f51f02962.png": {
          size: 2290,
          md5: "874dccfd88108a9f0188bda59c5df183"
        },
        "res/raw-assets/34/3459ab36-782c-4c4e-8aef-7280aff8b272.png": {
          size: 18969,
          md5: "3a810a636f3779b357e854155eafa4b6"
        },
        "res/raw-assets/36/36b6ea73-ff48-430e-a0c7-0e5e8defe341.png": {
          size: 2711,
          md5: "e64625aeb59a1de225e718a7126634ad"
        },
        "res/raw-assets/39/394bac82-54fb-472f-a27f-b5107821bfb8.png": {
          size: 1641,
          md5: "049d2201d7d99fc6dbdb017d8d8bd9b8"
        },
        "res/raw-assets/3c/3cedb8b4-8532-4037-a00e-b8d3e0013158.png": {
          size: 94313,
          md5: "a2e763866c1bdd6b189be69f3d37eedd"
        },
        "res/raw-assets/41/4128b78b-00ae-4d8a-ae35-4e5ca5c5cde9.manifest": {
          size: 6358,
          md5: "c1d18879851e567545ea04bf135a325f"
        },
        "res/raw-assets/49/49539cb0-3893-459a-b310-7cc1b7f6d335.mp3": {
          size: 971644,
          md5: "f45ec6666f06b729d8c0461bc89d4b94"
        },
        "res/raw-assets/4e/4e06c7f1-72ac-4e4e-90de-683e16905156.png": {
          size: 2406,
          md5: "5f0c28e0eed7ec0cb75e45f5937dd7c6"
        },
        "res/raw-assets/50/50da5486-dfa1-46d2-9d4f-686eb5527c1a.png": {
          size: 6911,
          md5: "51cf32529c923146f06019a58398c98d"
        },
        "res/raw-assets/52/5245e25c-010c-45fb-84a3-f3bce95793e7.png": {
          size: 3963,
          md5: "0f050ba45e09986b3d785b7b23ffcc1e"
        },
        "res/raw-assets/6d/6de06a23-d0de-4766-a9e1-a0314136d62e.png": {
          size: 10878,
          md5: "9f89eec7a1b0f615a3c1bab0857aefff"
        },
        "res/raw-assets/70/700faa17-11a6-46cd-aeb5-d6900bc264f8.png": {
          size: 3765,
          md5: "878e89a0a3e02b13beee9f3274f2ca39"
        },
        "res/raw-assets/71/71561142-4c83-4933-afca-cb7a17f67053.png": {
          size: 1050,
          md5: "c06a93f5f1a8a1c6edc4fd8b52e96cbf"
        },
        "res/raw-assets/80/8071df9d-029b-40e8-98f3-8eab08dbf6ca.png": {
          size: 25205,
          md5: "f688777a92fba11bfe85c3061a4476e5"
        },
        "res/raw-assets/82/82fe58d4-ae13-4806-9a41-2e73902ea811.png": {
          size: 24298,
          md5: "b807df8ffcb540f3dd20db75ac95b73b"
        },
        "res/raw-assets/83/83cc2086-d713-47a0-8d86-a8d6068b6258.png": {
          size: 3782,
          md5: "9827ce705349caa604e1aba1d53b0fd9"
        },
        "res/raw-assets/96/96e3e293-4e36-426d-a0a6-eb8d025c0d5b.png": {
          size: 15379,
          md5: "d6ce47aed38348a1ea0f003fa0063079"
        },
        "res/raw-assets/97/97a6316c-7fcb-4ffe-9045-35625bc6abf6.png": {
          size: 2187,
          md5: "f3f41b4c0783a751e561f1b84d91a70b"
        },
        "res/raw-assets/97/97bb9c9c-5568-4419-af04-4ed5a2969a02.png": {
          size: 10370,
          md5: "48ab94f1c34b0e9a047297cab1aeabc4"
        },
        "res/raw-assets/99/99170b0b-d210-46f1-b213-7d9e3f23098a.png": {
          size: 1177,
          md5: "d1118d133683bb4227d5e60c79c846b7"
        },
        "res/raw-assets/99/99acc716-33df-4c4c-879d-cc3407f0cd8c.png": {
          size: 9754,
          md5: "23e7221934021f3fbe6c6a52b023ded8"
        },
        "res/raw-assets/9e/9e2ae507-fae5-4511-940b-f2e46f81b790.mp3": {
          size: 3179,
          md5: "90d17b1a25200c90e292d9a3748c9fec"
        },
        "res/raw-assets/ac/ac11439d-3758-49f5-8728-81ed22c1ed96.png": {
          size: 11935,
          md5: "c20ae4a74c42b2aed28bb8c9247eb5d5"
        },
        "res/raw-assets/ae/ae4e2188-2b7b-42a9-85e1-8fb987600b04.png": {
          size: 634171,
          md5: "07b03f7145b75579708ae05ea2a2c029"
        },
        "res/raw-assets/af/afe329a6-e85e-46a0-98ed-8a34e128907b.png": {
          size: 2209,
          md5: "30ae2fe844c7c53f1d00291051230607"
        },
        "res/raw-assets/b2/b2037f34-04ff-4351-b9da-5be4bb557017.png": {
          size: 1530,
          md5: "bb96dacb8b09e0443d83462cc7b20095"
        },
        "res/raw-assets/b4/b43ff3c2-02bb-4874-81f7-f2dea6970f18.png": {
          size: 1114,
          md5: "83fcc9912e01ae5411c357651fb8b1cf"
        },
        "res/raw-assets/c3/c39ea496-96eb-4dc5-945a-e7c919b77c21.png": {
          size: 2548,
          md5: "ae7a04af25e238a5478170759b55a7ba"
        },
        "res/raw-assets/ca/caaaf9ff-5036-4232-a8a7-88b80b2e4c88.png": {
          size: 1829,
          md5: "94d761c4626df88053787f17fa09914d"
        },
        "res/raw-assets/ca/cacafa85-d8e9-4716-bcdb-7eba457e409c.png": {
          size: 7380,
          md5: "e6bb0f4d041257653f07da2dfe1edd09"
        },
        "res/raw-assets/ce/ce6d2de9-7056-4ba8-a1b1-40b00bb6f469.png": {
          size: 10982,
          md5: "52aa0df577edafe11de1cfdb44422895"
        },
        "res/raw-assets/cf/cfef78f1-c8df-49b7-8ed0-4c953ace2621.png": {
          size: 1140,
          md5: "a4b5953dffeb145b4b70072d91c4052b"
        },
        "res/raw-assets/d5/d5dfe6a8-eb19-4aae-a74f-83b71eaa57dc.png": {
          size: 8755,
          md5: "aeb1055ced334ce20fe030579e187494"
        },
        "res/raw-assets/da/da3e556f-1bce-4c31-87dc-897ea2d788e2.png": {
          size: 11636,
          md5: "d81124346c110eb1377f7b56346b31e4"
        },
        "res/raw-assets/e8/e851e89b-faa2-4484-bea6-5c01dd9f06e2.png": {
          size: 1082,
          md5: "90cf45d059d0408bec327f66eae5764c"
        },
        "res/raw-assets/ec/ec244ee5-6f1f-4920-9b69-d4df0e78ec2d.png": {
          size: 55581,
          md5: "68fdff7430b1b02f3a6e76bea92c6372"
        },
        "res/raw-assets/fc/fccc4d85-6ad4-496d-9b33-ea76e69da132.png": {
          size: 82257,
          md5: "df4359cdcb956f52f2e5b4ef777bbb7d"
        }
      },
      searchPaths: []
    });
    cc.Class({
      extends: cc.Component,
      properties: {
        panel: UpdatePanel,
        manifestUrl: {
          type: cc.Asset,
          default: null
        },
        updateUI: cc.Node,
        _updating: false,
        _canRetry: false,
        _storagePath: ""
      },
      checkCb: function checkCb(event) {
        cc.log("Code: " + event.getEventCode());
        cc.log("State: " + this._am.getState());
        cc.log(" ERROR_NO_LOCAL_MANIFEST: " + jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST);
        cc.log(" ERROR_DOWNLOAD_MANIFEST: " + jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST);
        cc.log(" ERROR_PARSE_MANIFEST: " + jsb.EventAssetsManager.ERROR_PARSE_MANIFEST);
        cc.log(" NEW_VERSION_FOUND: " + jsb.EventAssetsManager.NEW_VERSION_FOUND);
        cc.log(" ALREADY_UP_TO_DATE: " + jsb.EventAssetsManager.ALREADY_UP_TO_DATE);
        cc.log(" UPDATE_PROGRESSION: " + jsb.EventAssetsManager.UPDATE_PROGRESSION);
        cc.log(" ASSET_UPDATED: " + jsb.EventAssetsManager.ASSET_UPDATED);
        cc.log(" ERROR_UPDATING: " + jsb.EventAssetsManager.ERROR_UPDATING);
        cc.log(" UPDATE_FINISHED: " + jsb.EventAssetsManager.UPDATE_FINISHED);
        cc.log(" UPDATE_FAILED: " + jsb.EventAssetsManager.UPDATE_FAILED);
        cc.log(" ERROR_DECOMPRESS: " + jsb.EventAssetsManager.ERROR_DECOMPRESS);
        switch (event.getEventCode()) {
         case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
          this.panel.info.string = "No local manifest file found, hot update skipped.";
          break;

         case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
         case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
          this.panel.info.string = "Fail to download manifest file, hot update skipped.";
          break;

         case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
          this.panel.info.string = "Already up to date with the latest remote version.";
          break;

         case jsb.EventAssetsManager.NEW_VERSION_FOUND:
          this.panel.info.string = "New version found, please try to update.";
          this.panel.checkBtn.active = false;
          this.panel.fileProgress.progress = 0;
          this.panel.byteProgress.progress = 0;
          cc.log(this._am.getLocalManifest().getVersion());
          cc.log(this._am.getRemoteManifest().getVersion());
          break;

         default:
          return;
        }
        cc.log("\u66f4\u65b0\u6587\u4ef6\u603b\u657011: " + this._am.getTotalFiles());
        cc.log("\u66f4\u65b0\u6587\u4ef6\u5927\u5c0f11: " + this._am.getTotalBytes());
        this._am.setEventCallback(null);
        this._checkListener = null;
        this._updating = false;
      },
      updateCb: function updateCb(event) {
        var needRestart = false;
        var failed = false;
        cc.log("Code: " + event.getEventCode());
        cc.log("State: " + this._am.getState());
        switch (event.getEventCode()) {
         case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
          this.panel.info.string = "No local manifest file found, hot update skipped.";
          failed = true;
          break;

         case jsb.EventAssetsManager.UPDATE_PROGRESSION:
          this.panel.byteProgress.progress = event.getPercent();
          this.panel.fileProgress.progress = event.getPercentByFile();
          cc.log("\u66f4\u65b0\u6587\u4ef6\u603b\u6570: " + event.getTotalFiles());
          cc.log("\u66f4\u65b0\u6587\u4ef6\u5927\u5c0f: " + event.getTotalBytes());
          this.panel.fileLabel.string = event.getDownloadedFiles() + " / " + event.getTotalFiles();
          this.panel.byteLabel.string = event.getDownloadedBytes() + " / " + event.getTotalBytes();
          var msg = event.getMessage();
          msg && (this.panel.info.string = "Updated file: " + msg);
          break;

         case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
         case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
          this.panel.info.string = "Fail to download manifest file, hot update skipped.";
          failed = true;
          break;

         case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
          this.panel.info.string = "Already up to date with the latest remote version.";
          failed = true;
          break;

         case jsb.EventAssetsManager.UPDATE_FINISHED:
          this.panel.info.string = "Update finished. " + event.getMessage();
          needRestart = true;
          break;

         case jsb.EventAssetsManager.UPDATE_FAILED:
          this.panel.info.string = "Update failed. " + event.getMessage();
          this.panel.retryBtn.active = true;
          this._updating = false;
          this._canRetry = true;
          break;

         case jsb.EventAssetsManager.ERROR_UPDATING:
          this.panel.info.string = "Asset update error: " + event.getAssetId() + ", " + event.getMessage();
          break;

         case jsb.EventAssetsManager.ERROR_DECOMPRESS:
          this.panel.info.string = event.getMessage();
        }
        if (failed) {
          this._am.setEventCallback(null);
          this._updateListener = null;
          this._updating = false;
        }
        if (needRestart) {
          this._am.setEventCallback(null);
          this._updateListener = null;
          var searchPaths = jsb.fileUtils.getSearchPaths();
          var newPaths = this._am.getLocalManifest().getSearchPaths();
          cc.log("aaaa");
          console.log(JSON.stringify(newPaths));
          Array.prototype.unshift.apply(searchPaths, newPaths);
          cc.sys.localStorage.setItem("HotUpdateSearchPaths", JSON.stringify(searchPaths));
          jsb.fileUtils.setSearchPaths(searchPaths);
          cc.log(searchPaths);
        }
      },
      loadCustomManifest: function loadCustomManifest() {
        if (this._am.getState() === jsb.AssetsManager.State.UNINITED) {
          var manifest = new jsb.Manifest(customManifestStr, this._storagePath);
          this._am.loadLocalManifest(manifest, this._storagePath);
          this.panel.info.string = "Using custom manifest";
        }
      },
      retry: function retry() {
        if (!this._updating && this._canRetry) {
          this.panel.retryBtn.active = false;
          this._canRetry = false;
          this.panel.info.string = "Retry failed Assets...";
          this._am.downloadFailedAssets();
        }
      },
      checkUpdate: function checkUpdate() {
        if (this._updating) {
          this.panel.info.string = "Checking or updating ...";
          return;
        }
        if (this._am.getState() === jsb.AssetsManager.State.UNINITED) {
          cc.log(this.manifestUrl);
          var url = this.manifestUrl.nativeUrl;
          cc.loader.md5Pipe && (url = cc.loader.md5Pipe.transformURL(url));
          cc.log(url);
          this._am.loadLocalManifest(url);
        }
        if (!this._am.getLocalManifest() || !this._am.getLocalManifest().isLoaded()) {
          this.panel.info.string = "Failed to load local manifest ...";
          return;
        }
        this._am.setEventCallback(this.checkCb.bind(this));
        this._am.checkUpdate();
        this._updating = true;
      },
      hotUpdate: function hotUpdate() {
        if (this._am && !this._updating) {
          this._am.setEventCallback(this.updateCb.bind(this));
          if (this._am.getState() === jsb.AssetsManager.State.UNINITED) {
            var url = this.manifestUrl.nativeUrl;
            cc.loader.md5Pipe && (url = cc.loader.md5Pipe.transformURL(url));
            this._am.loadLocalManifest(url);
          }
          this._failCount = 0;
          this._am.update();
          this.panel.updateBtn.active = false;
          this._updating = true;
        }
      },
      show: function show() {
        false === this.updateUI.active && (this.updateUI.active = true);
      },
      onLoad: function onLoad() {
        cc.log("onLoad");
        if (!cc.sys.isNative) return;
        this._storagePath = (jsb.fileUtils ? jsb.fileUtils.getWritablePath() : "/") + "blackjack-remote-asset";
        cc.log("Storage path for remote asset : " + this._storagePath);
        this.versionCompareHandle = function(versionA, versionB) {
          cc.log("JS Custom Version Compare: version A is " + versionA + ", version B is " + versionB);
          var vA = versionA.split(".");
          var vB = versionB.split(".");
          for (var i = 0; i < vA.length; ++i) {
            var a = parseInt(vA[i]);
            var b = parseInt(vB[i] || 0);
            if (a === b) continue;
            return a - b;
          }
          return vB.length > vA.length ? -1 : 0;
        };
        this._am = new jsb.AssetsManager("", this._storagePath, this.versionCompareHandle);
        var panel = this.panel;
        this._am.setVerifyCallback(function(path, asset) {
          var compressed = asset.compressed;
          var expectedMD5 = asset.md5;
          var relativePath = asset.path;
          var size = asset.size;
          if (compressed) {
            panel.info.string = "Verification passed : " + relativePath;
            return true;
          }
          panel.info.string = "Verification passed : " + relativePath + " (" + expectedMD5 + ")";
          var resMD5 = JSB_MD5(jsb.fileUtils.getDataFromFile(path));
          cc.log("path:" + path);
          cc.log("  md51 = " + expectedMD5);
          cc.log("  md52 = " + resMD5);
          cc.log(asset.md5 == resMD5 ? "true" : "false");
          return asset.md5 == resMD5;
        });
        this.panel.info.string = "Hot update is ready, please check or directly update.";
        if (cc.sys.os === cc.sys.OS_ANDROID) {
          this._am.setMaxConcurrentTask(2);
          this.panel.info.string = "Max concurrent tasks count have been limited to 2";
        }
        this.panel.fileProgress.progress = 0;
        this.panel.byteProgress.progress = 0;
      },
      onDestroy: function onDestroy() {
        if (this._updateListener) {
          this._am.setEventCallback(null);
          this._updateListener = null;
        }
      }
    });
    cc._RF.pop();
  }, {
    UpdatePanel: "UpdatePanel",
    jsb_r_md5: "jsb_r_md5"
  } ],
  HotUpdate: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "f61842wBQNNxIS3rR3dI6kI", "HotUpdate");
    "use strict";
    cc.Class({
      extends: cc.Component,
      properties: {},
      start: function start() {}
    });
    cc._RF.pop();
  }, {} ],
  UpdatePanel: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "09b4ft56LFNvpxkrYb/ezC4", "UpdatePanel");
    "use strict";
    module.exports = cc.Class({
      extends: cc.Component,
      properties: {
        info: cc.Label,
        fileProgress: cc.ProgressBar,
        fileLabel: cc.Label,
        byteProgress: cc.ProgressBar,
        byteLabel: cc.Label,
        close: cc.Node,
        checkBtn: cc.Node,
        retryBtn: cc.Node,
        updateBtn: cc.Node
      },
      onLoad: function onLoad() {
        this.close.on(cc.Node.EventType.TOUCH_END, function() {
          this.node.parent.active = false;
        }, this);
      }
    });
    cc._RF.pop();
  }, {} ],
  gameTest: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "6695bDpBDdOxLdxz+FtcmH6", "gameTest");
    "use strict";
    var UpdatePanel = require("UpdatePanel");
    cc.Class({
      extends: cc.Component,
      properties: {
        panel: UpdatePanel,
        manifestUrl: {
          type: cc.Asset,
          default: null
        },
        updateUI: cc.Node,
        _updating: false,
        _canRetry: false,
        _storagePath: ""
      },
      start: function start() {}
    });
    cc._RF.pop();
  }, {
    UpdatePanel: "UpdatePanel"
  } ],
  jsb_r_md5: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "248a5YMV61PnZhkgeLJHtEP", "jsb_r_md5");
    "use strict";
    module.exports = function(data) {
      function fflog(msg) {
        try {
          console.log(msg);
        } catch (e) {}
      }
      function to_zerofilled_hex(n) {
        var t1 = (n >>> 24).toString(16);
        var t2 = (16777215 & n).toString(16);
        return "00".substr(0, 2 - t1.length) + t1 + "000000".substr(0, 6 - t2.length) + t2;
      }
      function int64_to_bytes(num) {
        var retval = [];
        for (var i = 0; i < 8; i++) {
          retval.push(255 & num);
          num >>>= 8;
        }
        return retval;
      }
      function rol(num, places) {
        return num << places & 4294967295 | num >>> 32 - places;
      }
      function fF(b, c, d) {
        return b & c | ~b & d;
      }
      function fG(b, c, d) {
        return d & b | ~d & c;
      }
      function fH(b, c, d) {
        return b ^ c ^ d;
      }
      function fI(b, c, d) {
        return c ^ (b | ~d);
      }
      function bytes_to_int32(arr, off) {
        return arr[off + 3] << 24 | arr[off + 2] << 16 | arr[off + 1] << 8 | arr[off];
      }
      function int128le_to_hex(a, b, c, d) {
        var ra = "";
        var t = 0;
        var ta = 0;
        for (var i = 3; i >= 0; i--) {
          ta = arguments[i];
          t = 255 & ta;
          ta >>>= 8;
          t <<= 8;
          t |= 255 & ta;
          ta >>>= 8;
          t <<= 8;
          t |= 255 & ta;
          ta >>>= 8;
          t <<= 8;
          t |= ta;
          ra += to_zerofilled_hex(t);
        }
        return ra;
      }
      if (!data instanceof Uint8Array) {
        fflog("input data type mismatch only support Uint8Array");
        return null;
      }
      var databytes = [];
      for (var i = 0; i < data.byteLength; i++) databytes.push(data[i]);
      var org_len = databytes.length;
      databytes.push(128);
      var tail = databytes.length % 64;
      if (tail > 56) {
        for (var i = 0; i < 64 - tail; i++) databytes.push(0);
        tail = databytes.length % 64;
      }
      for (i = 0; i < 56 - tail; i++) databytes.push(0);
      databytes = databytes.concat(int64_to_bytes(8 * org_len));
      var h0 = 1732584193;
      var h1 = 4023233417;
      var h2 = 2562383102;
      var h3 = 271733878;
      var a = 0, b = 0, c = 0, d = 0;
      function _add(n1, n2) {
        return 4294967295 & n1 + n2;
      }
      var updateRun = function updateRun(nf, sin32, dw32, b32) {
        var temp = d;
        d = c;
        c = b;
        b = _add(b, rol(_add(a, _add(nf, _add(sin32, dw32))), b32));
        a = temp;
      };
      for (i = 0; i < databytes.length / 64; i++) {
        a = h0;
        b = h1;
        c = h2;
        d = h3;
        var ptr = 64 * i;
        updateRun(fF(b, c, d), 3614090360, bytes_to_int32(databytes, ptr), 7);
        updateRun(fF(b, c, d), 3905402710, bytes_to_int32(databytes, ptr + 4), 12);
        updateRun(fF(b, c, d), 606105819, bytes_to_int32(databytes, ptr + 8), 17);
        updateRun(fF(b, c, d), 3250441966, bytes_to_int32(databytes, ptr + 12), 22);
        updateRun(fF(b, c, d), 4118548399, bytes_to_int32(databytes, ptr + 16), 7);
        updateRun(fF(b, c, d), 1200080426, bytes_to_int32(databytes, ptr + 20), 12);
        updateRun(fF(b, c, d), 2821735955, bytes_to_int32(databytes, ptr + 24), 17);
        updateRun(fF(b, c, d), 4249261313, bytes_to_int32(databytes, ptr + 28), 22);
        updateRun(fF(b, c, d), 1770035416, bytes_to_int32(databytes, ptr + 32), 7);
        updateRun(fF(b, c, d), 2336552879, bytes_to_int32(databytes, ptr + 36), 12);
        updateRun(fF(b, c, d), 4294925233, bytes_to_int32(databytes, ptr + 40), 17);
        updateRun(fF(b, c, d), 2304563134, bytes_to_int32(databytes, ptr + 44), 22);
        updateRun(fF(b, c, d), 1804603682, bytes_to_int32(databytes, ptr + 48), 7);
        updateRun(fF(b, c, d), 4254626195, bytes_to_int32(databytes, ptr + 52), 12);
        updateRun(fF(b, c, d), 2792965006, bytes_to_int32(databytes, ptr + 56), 17);
        updateRun(fF(b, c, d), 1236535329, bytes_to_int32(databytes, ptr + 60), 22);
        updateRun(fG(b, c, d), 4129170786, bytes_to_int32(databytes, ptr + 4), 5);
        updateRun(fG(b, c, d), 3225465664, bytes_to_int32(databytes, ptr + 24), 9);
        updateRun(fG(b, c, d), 643717713, bytes_to_int32(databytes, ptr + 44), 14);
        updateRun(fG(b, c, d), 3921069994, bytes_to_int32(databytes, ptr), 20);
        updateRun(fG(b, c, d), 3593408605, bytes_to_int32(databytes, ptr + 20), 5);
        updateRun(fG(b, c, d), 38016083, bytes_to_int32(databytes, ptr + 40), 9);
        updateRun(fG(b, c, d), 3634488961, bytes_to_int32(databytes, ptr + 60), 14);
        updateRun(fG(b, c, d), 3889429448, bytes_to_int32(databytes, ptr + 16), 20);
        updateRun(fG(b, c, d), 568446438, bytes_to_int32(databytes, ptr + 36), 5);
        updateRun(fG(b, c, d), 3275163606, bytes_to_int32(databytes, ptr + 56), 9);
        updateRun(fG(b, c, d), 4107603335, bytes_to_int32(databytes, ptr + 12), 14);
        updateRun(fG(b, c, d), 1163531501, bytes_to_int32(databytes, ptr + 32), 20);
        updateRun(fG(b, c, d), 2850285829, bytes_to_int32(databytes, ptr + 52), 5);
        updateRun(fG(b, c, d), 4243563512, bytes_to_int32(databytes, ptr + 8), 9);
        updateRun(fG(b, c, d), 1735328473, bytes_to_int32(databytes, ptr + 28), 14);
        updateRun(fG(b, c, d), 2368359562, bytes_to_int32(databytes, ptr + 48), 20);
        updateRun(fH(b, c, d), 4294588738, bytes_to_int32(databytes, ptr + 20), 4);
        updateRun(fH(b, c, d), 2272392833, bytes_to_int32(databytes, ptr + 32), 11);
        updateRun(fH(b, c, d), 1839030562, bytes_to_int32(databytes, ptr + 44), 16);
        updateRun(fH(b, c, d), 4259657740, bytes_to_int32(databytes, ptr + 56), 23);
        updateRun(fH(b, c, d), 2763975236, bytes_to_int32(databytes, ptr + 4), 4);
        updateRun(fH(b, c, d), 1272893353, bytes_to_int32(databytes, ptr + 16), 11);
        updateRun(fH(b, c, d), 4139469664, bytes_to_int32(databytes, ptr + 28), 16);
        updateRun(fH(b, c, d), 3200236656, bytes_to_int32(databytes, ptr + 40), 23);
        updateRun(fH(b, c, d), 681279174, bytes_to_int32(databytes, ptr + 52), 4);
        updateRun(fH(b, c, d), 3936430074, bytes_to_int32(databytes, ptr), 11);
        updateRun(fH(b, c, d), 3572445317, bytes_to_int32(databytes, ptr + 12), 16);
        updateRun(fH(b, c, d), 76029189, bytes_to_int32(databytes, ptr + 24), 23);
        updateRun(fH(b, c, d), 3654602809, bytes_to_int32(databytes, ptr + 36), 4);
        updateRun(fH(b, c, d), 3873151461, bytes_to_int32(databytes, ptr + 48), 11);
        updateRun(fH(b, c, d), 530742520, bytes_to_int32(databytes, ptr + 60), 16);
        updateRun(fH(b, c, d), 3299628645, bytes_to_int32(databytes, ptr + 8), 23);
        updateRun(fI(b, c, d), 4096336452, bytes_to_int32(databytes, ptr), 6);
        updateRun(fI(b, c, d), 1126891415, bytes_to_int32(databytes, ptr + 28), 10);
        updateRun(fI(b, c, d), 2878612391, bytes_to_int32(databytes, ptr + 56), 15);
        updateRun(fI(b, c, d), 4237533241, bytes_to_int32(databytes, ptr + 20), 21);
        updateRun(fI(b, c, d), 1700485571, bytes_to_int32(databytes, ptr + 48), 6);
        updateRun(fI(b, c, d), 2399980690, bytes_to_int32(databytes, ptr + 12), 10);
        updateRun(fI(b, c, d), 4293915773, bytes_to_int32(databytes, ptr + 40), 15);
        updateRun(fI(b, c, d), 2240044497, bytes_to_int32(databytes, ptr + 4), 21);
        updateRun(fI(b, c, d), 1873313359, bytes_to_int32(databytes, ptr + 32), 6);
        updateRun(fI(b, c, d), 4264355552, bytes_to_int32(databytes, ptr + 60), 10);
        updateRun(fI(b, c, d), 2734768916, bytes_to_int32(databytes, ptr + 24), 15);
        updateRun(fI(b, c, d), 1309151649, bytes_to_int32(databytes, ptr + 52), 21);
        updateRun(fI(b, c, d), 4149444226, bytes_to_int32(databytes, ptr + 16), 6);
        updateRun(fI(b, c, d), 3174756917, bytes_to_int32(databytes, ptr + 44), 10);
        updateRun(fI(b, c, d), 718787259, bytes_to_int32(databytes, ptr + 8), 15);
        updateRun(fI(b, c, d), 3951481745, bytes_to_int32(databytes, ptr + 36), 21);
        h0 = _add(h0, a);
        h1 = _add(h1, b);
        h2 = _add(h2, c);
        h3 = _add(h3, d);
      }
      return int128le_to_hex(h3, h2, h1, h0).toLowerCase();
    };
    cc._RF.pop();
  }, {} ]
}, {}, [ "HotUpdate", "HotUpdateControl", "HotUpdateMng", "HotUpdateTest", "UpdatePanel", "gameTest", "jsb_r_md5" ]);