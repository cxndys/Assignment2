cc.Class({
    extends: cc.Component,

    properties: {
        player: cc.Node,
        gameManager: cc.Node,

        moveDistance: 48,
        moveSpeed: 90,

        waitDownTime: 0.4,
        waitUpTime: 0.6,

        damageStartOffset: 25,
        damageCooldown: 1.0
    },

    onLoad() {
        cc.log("FlowerEnemy is running");

        this.hiddenY = this.node.y;
        this.shownY = this.hiddenY + this.moveDistance;

        this.state = "waitDown";
        this.timer = this.waitDownTime;
        this.canDamage = true;

        this.anim = this.getComponent(cc.Animation);

        if (this.anim) {
            this.anim.play();
        }
    },

    update(dt) {
        this.moveFlower(dt);
        this.checkPlayerTouch();
    },

    moveFlower(dt) {
        if (this.state === "waitDown") {
            this.timer -= dt;

            if (this.timer <= 0) {
                this.state = "movingUp";
            }
        } else if (this.state === "movingUp") {
            this.node.y += this.moveSpeed * dt;

            if (this.node.y >= this.shownY) {
                this.node.y = this.shownY;
                this.state = "waitUp";
                this.timer = this.waitUpTime;
            }
        } else if (this.state === "waitUp") {
            this.timer -= dt;

            if (this.timer <= 0) {
                this.state = "movingDown";
            }
        } else if (this.state === "movingDown") {
            this.node.y -= this.moveSpeed * dt;

            if (this.node.y <= this.hiddenY) {
                this.node.y = this.hiddenY;
                this.state = "waitDown";
                this.timer = this.waitDownTime;
            }
        }
    },

    checkPlayerTouch() {
        if (!this.player) return;
        if (!this.canDamage) return;

        if (this.node.y < this.hiddenY + this.damageStartOffset) {
            return;
        }

        let playerBox = this.player.getBoundingBoxToWorld();
        let flowerBox = this.node.getBoundingBoxToWorld();

        let damageBox = cc.rect(
            flowerBox.x + 4,
            flowerBox.y + flowerBox.height * 0.35,
            flowerBox.width - 8,
            flowerBox.height * 0.65
        );

        if (playerBox.intersects(damageBox)) {
            cc.log("Mario touched visible flower");
            this.hurtPlayer();
        }
    },

    hurtPlayer() {
        if (!this.canDamage) return;

        this.canDamage = false;

        cc.log("Flower hurt Mario");

        let gm = this.getGameManager();

        if (gm) {
            gm.hurtMario();
        } else {
            cc.log("Flower cannot find GameManager");
        }

        this.scheduleOnce(function () {
            this.canDamage = true;
        }, this.damageCooldown);
    },

    getGameManager() {
        if (!this.gameManager) return null;

        let gm = this.gameManager.getComponent("GameManager");

        if (!gm) {
            let components = this.gameManager.getComponents(cc.Component);

            for (let i = 0; i < components.length; i++) {
                if (typeof components[i].hurtMario === "function") {
                    gm = components[i];
                    break;
                }
            }
        }

        return gm;
    }
});