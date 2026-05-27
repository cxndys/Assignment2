cc.Class({
    extends: cc.Component,

    properties: {
        player: cc.Node,
        gameManager: cc.Node,

        
        rewardType: "mushroom",

        mushroomPrefab: cc.Prefab,
        coinPrefab: cc.Prefab,

        coinScore: 100,

        spawnOffsetY: 18,
        bumpHeight: 6,
        bumpTime: 0.08,

        coinMoveUpDistance: 32,
        coinMoveTime: 0.35,

        idleAnimName: "question_idle",
        usedSpriteFrame: cc.SpriteFrame
    },

    onLoad() {
        this.used = false;
        this.originalY = this.node.y;

        this.sprite = this.getComponent(cc.Sprite);
        this.anim = this.getComponent(cc.Animation);

        if (this.anim) {
            this.anim.play(this.idleAnimName);
        }

        cc.log("QuestionBox running on: " + this.node.name);

        let rb = this.getComponent(cc.RigidBody);

        if (rb) {
            rb.enabledContactListener = true;
        }
    },

    onBeginContact(contact, selfCollider, otherCollider) {
        let otherNode = otherCollider.node;

        let isPlayer =
            otherNode === this.player ||
            otherNode.name.toLowerCase().includes("player") ||
            otherNode.name.toLowerCase().includes("mario");

        if (!isPlayer) return;
        if (this.used) return;

        if (this.playerHitFromBottom(otherNode)) {
            cc.log("Mario hit question block from bottom");
            this.activateBlock();
        } else {
            cc.log("Question block touched, but not from bottom");
        }
    },

    playerHitFromBottom(playerNode) {
        let playerBox = playerNode.getBoundingBoxToWorld();
        let blockBox = this.node.getBoundingBoxToWorld();

        let playerLeft = playerBox.x;
        let playerRight = playerBox.x + playerBox.width;
        let playerCenterY = playerBox.y + playerBox.height / 2;

        let blockLeft = blockBox.x;
        let blockRight = blockBox.x + blockBox.width;
        let blockCenterY = blockBox.y + blockBox.height / 2;

        let playerRb = playerNode.getComponent(cc.RigidBody);

        let playerMovingUp = true;

        if (playerRb) {
            playerMovingUp = playerRb.linearVelocity.y > -20;
        }

        let playerIsBelowBlock = playerCenterY < blockCenterY;

        let horizontalTolerance = 10;

        let playerOverlapsBlockHorizontally =
            playerRight >= blockLeft - horizontalTolerance &&
            playerLeft <= blockRight + horizontalTolerance;

        return (
            playerMovingUp &&
            playerIsBelowBlock &&
            playerOverlapsBlockHorizontally
        );
    },

    activateBlock() {
        if (this.used) return;

        this.used = true;

        cc.log("QUESTION BOX ACTIVATED");

        this.changeToUsedBlock();

        if (this.rewardType === "coin") {
            this.spawnCoin();
        } else {
            this.spawnMushroom();
        }

        this.bumpBlock();

        if (window.GameManager && window.GameManager.playPowerUpAppearSound) {
            if (this.rewardType === "mushroom") {
                window.GameManager.playPowerUpAppearSound();
            }
        }
    },

    changeToUsedBlock() {
        if (this.anim) {
            this.anim.stop();
        }

        if (this.sprite && this.usedSpriteFrame) {
            this.sprite.spriteFrame = this.usedSpriteFrame;
            cc.log("Question block changed to used sprite");
        } else {
            cc.log("Used sprite frame is not assigned");
        }
    },

    bumpBlock() {
        this.node.y = this.originalY + this.bumpHeight;

        this.scheduleOnce(function () {
            this.node.y = this.originalY;
        }, this.bumpTime);
    },

    spawnMushroom() {
        cc.log("spawnMushroom function started");

        if (!this.mushroomPrefab) {
            cc.log("MUSHROOM PREFAB IS NOT ASSIGNED");
            return;
        }

        let mushroom = cc.instantiate(this.mushroomPrefab);

        let spawnParent = this.getSpawnParent();

        spawnParent.addChild(mushroom);

        if (this.player) {
            this.setGroupRecursive(mushroom, this.player.group);
        }

        let blockWorldPos = this.node.convertToWorldSpaceAR(
            cc.v2(0, this.spawnOffsetY)
        );

        let blockLocalPos = spawnParent.convertToNodeSpaceAR(blockWorldPos);

        mushroom.setPosition(blockLocalPos);

        mushroom.active = true;
        mushroom.opacity = 255;
        mushroom.zIndex = 999;
        mushroom.setSiblingIndex(999);

        cc.log("MUSHROOM SPAWNED");

        let mushroomScript = mushroom.getComponent("Mushroom");

        if (mushroomScript) {
            mushroomScript.player = this.player;
            mushroomScript.gameManager = this.gameManager;
        } else {
            cc.log("Mushroom prefab has no Mushroom.js script");
        }
    },

    spawnCoin() {
        cc.log("spawnCoin function started");

        this.addCoinScore();

        if (window.GameManager && window.GameManager.playCoinSound) {
            window.GameManager.playCoinSound();
        }

        if (!this.coinPrefab) {
            cc.log("COIN PREFAB IS NOT ASSIGNED, score still added");
            return;
        }

        let coin = cc.instantiate(this.coinPrefab);

        let spawnParent = this.getSpawnParent();

        spawnParent.addChild(coin);

        if (this.player) {
            this.setGroupRecursive(coin, this.player.group);
        }

        let blockWorldPos = this.node.convertToWorldSpaceAR(
            cc.v2(0, this.spawnOffsetY)
        );

        let blockLocalPos = spawnParent.convertToNodeSpaceAR(blockWorldPos);

        coin.setPosition(blockLocalPos);

        coin.active = true;
        coin.opacity = 255;
        coin.zIndex = 999;
        coin.setSiblingIndex(999);

        let coinAnim = coin.getComponent(cc.Animation);

        if (coinAnim) {
            coinAnim.play();
        }

        coin.runAction(
            cc.sequence(
                cc.spawn(
                    cc.moveBy(this.coinMoveTime, cc.v2(0, this.coinMoveUpDistance)),
                    cc.fadeOut(this.coinMoveTime)
                ),
                cc.callFunc(function () {
                    coin.destroy();
                })
            )
        );

        cc.log("COIN SPAWNED");
    },

    addCoinScore() {
        if (window.GameManager && window.GameManager.addScore) {
            window.GameManager.addScore(this.coinScore);
            return;
        }

        if (!this.gameManager) {
            cc.log("Game Manager node is not assigned");
            return;
        }

        let gm = this.gameManager.getComponent("GameManager");

        if (gm && gm.addScore) {
            gm.addScore(this.coinScore);
        }
    },

    getSpawnParent() {
        if (this.player && this.player.parent) {
            return this.player.parent;
        }

        return this.node.parent;
    },

    setGroupRecursive(node, groupName) {
        node.group = groupName;

        for (let i = 0; i < node.children.length; i++) {
            this.setGroupRecursive(node.children[i], groupName);
        }
    }
});