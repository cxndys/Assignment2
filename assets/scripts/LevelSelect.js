cc.Class({
    extends: cc.Component,

    properties: {
        level1SceneName: "Game",
        level2SceneName: "Game2"
    },

    playLevel1() {
        cc.director.loadScene(this.level1SceneName);
    },

    playLevel2() {
        cc.director.loadScene(this.level2SceneName);
    },

    goBackMenu() {
        cc.director.loadScene(this.menuSceneName);
    }
});