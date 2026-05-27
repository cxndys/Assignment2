cc.Class({
    extends: cc.Component,

    properties: {
        levelSelectSceneName: "LevelSelect"
    },

    onLoad() {
        cc.log("StartMenuManager running");
    },

    goToLevelSelect() {
        cc.log("Going to Level Select");
        cc.director.loadScene(this.levelSelectSceneName);
    }
});