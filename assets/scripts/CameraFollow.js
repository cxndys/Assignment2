cc.Class({
    extends: cc.Component,

    properties: {
        target: cc.Node,      // Player
        mapNode: cc.Node,     // TileMap node

        offsetX: 80,
        fixedY: 140,

        useManualLimit: true,
        manualLeftLimit: 0,
        manualRightLimit: 2000
    },

    onLoad() {
        this.camera = this.getComponent(cc.Camera);

        this.leftLimit = this.manualLeftLimit;
        this.rightLimit = this.manualRightLimit;

        if (!this.useManualLimit && this.mapNode) {
            let tiledMap = this.mapNode.getComponent(cc.TiledMap);

            if (tiledMap) {
                let mapSize = tiledMap.getMapSize();
                let tileSize = tiledMap.getTileSize();

                let mapWidth = mapSize.width * tileSize.width * this.mapNode.scaleX;

                this.leftLimit = this.mapNode.x;
                this.rightLimit = this.mapNode.x + mapWidth;

                cc.log("Auto map right limit: " + this.rightLimit);
            }
        }

        this.followTarget();
    },

    lateUpdate(dt) {
        this.followTarget();
    },

    followTarget() {
        if (!this.target) return;

        let zoom = 1;

        if (this.camera) {
            zoom = this.camera.zoomRatio;
        }

        let designSize = cc.view.getDesignResolutionSize();
        let halfScreenWidth = designSize.width / 2 / zoom;

        let desiredX = this.target.x + this.offsetX;

        let minCameraX = this.leftLimit + halfScreenWidth;
        let maxCameraX = this.rightLimit - halfScreenWidth;

        if (maxCameraX < minCameraX) {
            maxCameraX = minCameraX;
        }

        let cameraX = desiredX;

        if (cameraX < minCameraX) {
            cameraX = minCameraX;
        }

        if (cameraX > maxCameraX) {
            cameraX = maxCameraX;
        }

        this.node.setPosition(cameraX, this.fixedY);
    }
});