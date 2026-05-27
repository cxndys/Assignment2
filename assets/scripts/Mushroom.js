cc.Class({
    extends: cc.Component,

    properties: {
        player: cc.Node,
        gameManager: cc.Node,
        sourceBlock: cc.Node,

        moveSpeed: 50,
        scoreAmount: 50,

        collectDelay: 0.3,
        turnCooldown: 0.2,
        ignoreSourceBlockTime: 0.5
    },

    onLoad() {
        cc.log("Mushroom running");

        this.direction = 1;
        this.canCollect = false;
        this.collected = false;
        this.canTurn = true;
        this.ignoreSourceBlock = true;

        this.rigidBody = this.getComponent(cc.RigidBody);

        if (this.rigidBody) {
            this.rigidBody.type = cc.RigidBodyType.Dynamic;
            this.rigidBody.enabledContactListener = true;
            this.rigidBody.fixedRotation = true;
        }

        this.collider = this.getComponent(cc.PhysicsBoxCollider);

        if (this.collider) {
            this.collider.sensor = false;
            this.collider.friction = 0;
            this.collider.restitution = 0;
            this.collider.apply();
        }

        this.scheduleOnce(function () {
            this.canCollect = true;
        }, this.collectDelay);

        this.scheduleOnce(function () {
            this.ignoreSourceBlock = false;
        }, this.ignoreSourceBlockTime);
    },

    update(dt) {
        if (this.collected) return;

        this.moveMushroom();
    },

    moveMushroom() {
        if (!this.rigidBody) return;

        let velocity = this.rigidBody.linearVelocity;

        this.rigidBody.linearVelocity = cc.v2(
            this.direction * this.moveSpeed,
            velocity.y
        );
    },

    onBeginContact(contact, selfCollider, otherCollider) {
        let otherNode = otherCollider.node;

        if (this.isPlayer(otherNode)) {
            this.collectMushroomSafely();
            return;
        }

        if (this.sourceBlock && otherNode === this.sourceBlock && this.ignoreSourceBlock) {
            cc.log("Mushroom ignored source block");
            return;
        }

        if (this.isTurnObject(otherNode)) {
            this.turnAround();
        }
    },

    onPreSolve(contact, selfCollider, otherCollider) {
        let otherNode = otherCollider.node;

        
        if (this.isPlayer(otherNode)) {
            contact.disabled = true;
            this.collectMushroomSafely();
            return;
        }

        if (this.sourceBlock && otherNode === this.sourceBlock && this.ignoreSourceBlock) {
            
            contact.disabled = true;
        }
    },

    collectMushroomSafely() {
        if (!this.canCollect) return;
        if (this.collected) return;

        this.collected = true;
        this.canCollect = false;

        cc.log("Mario collected mushroom");

        
        if (this.rigidBody) {
            this.rigidBody.linearVelocity = cc.v2(0, 0);
            this.rigidBody.angularVelocity = 0;
        }

        
        if (this.collider) {
            this.collider.enabled = false;
            this.collider.apply();
        }

        let gm = this.getGameManager();

        if (gm) {
            if (typeof gm.powerUpMario === "function") {
                gm.powerUpMario();
            }

            if (typeof gm.addScore === "function") {
                gm.addScore(this.scoreAmount);
            }
        }

        
        this.scheduleOnce(function () {
            if (this.node && this.node.isValid) {
                this.node.destroy();
            }
        }, 0);
    },

    isPlayer(node) {
        if (!node) return false;

        let name = node.name.toLowerCase();

        return (
            node === this.player ||
            name.includes("player") ||
            name.includes("mario")
        );
    },

    isTurnObject(node) {
        if (!node) return false;

        let name = node.name.toLowerCase();

        if (name.includes("ground")) return false;

        return (
            name.includes("block") ||
            name.includes("wall") ||
            name.includes("pipe") ||
            name.includes("tube") ||
            name.includes("question")
        );
    },

    turnAround() {
        if (!this.canTurn) return;

        this.canTurn = false;

        this.direction *= -1;

        this.node.x += this.direction * 6;

        if (this.rigidBody) {
            this.rigidBody.linearVelocity = cc.v2(
                this.direction * this.moveSpeed,
                this.rigidBody.linearVelocity.y
            );
        }

        cc.log("Mushroom turned around");

        this.scheduleOnce(function () {
            this.canTurn = true;
        }, this.turnCooldown);
    },

    getGameManager() {
        if (this.gameManager) {
            let gm = this.gameManager.getComponent("GameManager");

            if (gm) {
                return gm;
            }
        }

        if (window.GameManager) {
            return window.GameManager;
        }

        return null;
    }
});