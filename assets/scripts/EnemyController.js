cc.Class({
    extends: cc.Component,

    properties: {
        player: cc.Node,
        gameManager: cc.Node,

        turtleBody: cc.Node,
        shellBody: cc.Node,

        
        wallRoot: cc.Node,

        walkSpeed: 40,
        shellSpeed: 150,

        stompTolerance: 10,
        bounceForce: 350,

        damageCooldown: 1.0,
        shellKickCooldown: 0.25,

        turtleFacesLeft: true,
        shellAnimName: "turtle_shell",

        pushShellAwayDistance: 18,
        shellWallCheckDistance: 4,
        shellWallPadding: 4,
        turnCooldown: 0.2
    },

    onLoad() {
        cc.log("Turtle EnemyController running");

        this.state = "walking";
        this.direction = -1;

        this.canDamage = true;
        this.canKickShell = true;
        this.canTurn = true;
        this.ignorePlayerUntilSeparated = false;

        this.rigidBody = this.getComponent(cc.RigidBody);
        this.collider = this.getComponent(cc.PhysicsBoxCollider);

        if (this.rigidBody) {
            this.rigidBody.enabledContactListener = true;
            this.rigidBody.fixedRotation = true;

            if (this.rigidBody.gravityScale !== undefined) {
                this.originalGravityScale = this.rigidBody.gravityScale;
            } else {
                this.originalGravityScale = 1;
            }
        }

        if (!this.wallRoot) {
            this.wallRoot = cc.find("World/StaticWalls");

            if (!this.wallRoot) {
                this.wallRoot = cc.find("World");
            }
        }

        this.setWalkingPhysicsMode();
        this.showWalkingTurtle();
        this.flipTurtleBody();
    },

    update(dt) {
        if (this.state === "walking") {
            this.walk();
        } else if (this.state === "shellIdle") {
            this.stopShellPhysics();
            this.checkPlayerSeparatedFromShell();
        } else if (this.state === "shellMoving") {
            this.moveShellManually(dt);
            this.checkShellWallInFront();
            this.checkPlayerSeparatedFromShell();
        }
    },

    setWalkingPhysicsMode() {
        if (this.collider) {
            this.collider.sensor = false;
            this.collider.apply();
        }

        if (this.rigidBody && this.rigidBody.gravityScale !== undefined) {
            this.rigidBody.gravityScale = this.originalGravityScale;
        }
    },

    setShellPhysicsMode() {
       
        if (this.collider) {
            this.collider.sensor = true;
            this.collider.apply();
        }

        if (this.rigidBody) {
            this.rigidBody.linearVelocity = cc.v2(0, 0);
            this.rigidBody.angularVelocity = 0;

            if (this.rigidBody.gravityScale !== undefined) {
                this.rigidBody.gravityScale = 0;
            }
        }

        this.node.scaleX = 1;
    },

    walk() {
        if (!this.rigidBody) return;

        let velocity = this.rigidBody.linearVelocity;

        this.rigidBody.linearVelocity = cc.v2(
            this.direction * this.walkSpeed,
            velocity.y
        );

        this.flipTurtleBody();
    },

    stopShellPhysics() {
        if (!this.rigidBody) return;

        this.rigidBody.linearVelocity = cc.v2(0, 0);
        this.rigidBody.angularVelocity = 0;
    },

    moveShellManually(dt) {
        this.node.x += this.direction * this.shellSpeed * dt;

        if (this.rigidBody) {
            this.rigidBody.linearVelocity = cc.v2(0, 0);
            this.rigidBody.angularVelocity = 0;
        }
    },

    onBeginContact(contact, selfCollider, otherCollider) {
        let otherNode = otherCollider.node;

        if (this.isPlayer(otherNode)) {
            this.handlePlayerContact();
            return;
        }

        if (this.isTurnObject(otherNode)) {
            if (this.state === "walking") {
                this.turnAroundWalking();
            }

            if (this.state === "shellMoving") {
                this.bounceShellFromWall(otherNode);
            }
        }
    },

    onPreSolve(contact, selfCollider, otherCollider) {
        let otherNode = otherCollider.node;

        if (!otherNode) return;

        
        if (this.state === "shellIdle" || this.state === "shellMoving") {
            if (this.isPlayer(otherNode) || this.isTurnObject(otherNode)) {
                contact.disabled = true;
            }
        }
    },

    onEndContact(contact, selfCollider, otherCollider) {
        let otherNode = otherCollider.node;

        if (this.isPlayer(otherNode)) {
            this.ignorePlayerUntilSeparated = false;
            cc.log("Mario separated from shell");
        }
    },

    handlePlayerContact() {
        if (!this.player) return;

        if (this.state === "walking") {
            if (this.playerStompedEnemy()) {
                this.turnIntoShell();
            } else {
                this.hurtPlayer();
            }

            return;
        }

        if (this.state === "shellIdle") {
            if (this.ignorePlayerUntilSeparated) {
                cc.log("Idle shell contact ignored until Mario separates");
                return;
            }

            if (this.canKickShell) {
                this.kickShell();
            }

            return;
        }

        if (this.state === "shellMoving") {
            if (this.ignorePlayerUntilSeparated) {
                cc.log("Moving shell contact ignored until Mario separates");
                return;
            }

            if (this.playerStompedEnemy()) {
                this.stopShell();
            } else {
                cc.log("Mario touched moving shell, damage disabled");
            }

            return;
        }
    },

    checkPlayerSeparatedFromShell() {
        if (!this.ignorePlayerUntilSeparated) return;
        if (!this.player) return;

        let playerBox = this.player.getBoundingBoxToWorld();
        let shellBox = this.getNodeWorldBox(this.node);

        if (shellBox && !playerBox.intersects(shellBox)) {
            this.ignorePlayerUntilSeparated = false;
            cc.log("Mario separated from shell");
        }
    },

    playerStompedEnemy() {
        if (!this.player) return false;

        let playerRb = this.player.getComponent(cc.RigidBody);

        let playerBox = this.player.getBoundingBoxToWorld();
        let enemyBox = this.getNodeWorldBox(this.node);

        if (!enemyBox) return false;

        let playerBottom = playerBox.y;
        let enemyTop = enemyBox.y + enemyBox.height;

        let playerIsAboveEnemy = playerBottom >= enemyTop - this.stompTolerance;

        let playerIsFalling = true;

        if (playerRb) {
            playerIsFalling = playerRb.linearVelocity.y <= 0;
        }

        return playerIsAboveEnemy && playerIsFalling;
    },

    turnIntoShell() {
        cc.log("Turtle turned into shell");

        this.state = "shellIdle";

        this.setShellPhysicsMode();
        this.showShellIdle();

        this.bouncePlayer();

        let gm = this.getGameManager();

        if (gm) {
            gm.addScore(100);
        }

        if (window.GameManager && window.GameManager.playStompSound) {
            window.GameManager.playStompSound();
        }

        this.canKickShell = false;
        this.ignorePlayerUntilSeparated = true;

        this.scheduleOnce(function () {
            this.canKickShell = true;
        }, this.shellKickCooldown);
    },

    kickShell() {
        if (this.state !== "shellIdle") return;
        if (!this.canKickShell) return;

        cc.log("Shell kicked");

        this.state = "shellMoving";
        this.canTurn = true;

        this.setShellPhysicsMode();

        if (this.player && this.player.x < this.node.x) {
            this.direction = 1;
        } else {
            this.direction = -1;
        }

        this.node.x += this.direction * this.pushShellAwayDistance;

        this.playShellAnimation();

        this.ignorePlayerUntilSeparated = true;
        this.canDamage = false;

        if (window.GameManager && window.GameManager.playKickSound) {
            window.GameManager.playKickSound();
        }
    },

    stopShell() {
        cc.log("Moving shell stopped");

        this.state = "shellIdle";

        this.setShellPhysicsMode();
        this.showShellIdle();
        this.bouncePlayer();

        this.canKickShell = false;
        this.ignorePlayerUntilSeparated = true;

        this.scheduleOnce(function () {
            this.canKickShell = true;
        }, this.shellKickCooldown);

        if (window.GameManager && window.GameManager.playStompSound) {
            window.GameManager.playStompSound();
        }
    },

    checkShellWallInFront() {
        if (this.state !== "shellMoving") return;
        if (!this.wallRoot) return;
        if (!this.canTurn) return;

        let shellBox = this.getNodeWorldBox(this.node);

        if (!shellBox) return;

        let checkWidth = this.shellWallCheckDistance;
        let checkX = shellBox.x;

        if (this.direction > 0) {
            checkX = shellBox.x + shellBox.width;
        } else {
            checkX = shellBox.x - checkWidth;
        }

        let checkBox = cc.rect(
            checkX,
            shellBox.y + 4,
            checkWidth,
            Math.max(4, shellBox.height - 8)
        );

        let walls = this.getAllWallNodes();

        for (let i = 0; i < walls.length; i++) {
            let wall = walls[i];

            if (!wall.active) continue;
            if (!this.isTurnObject(wall)) continue;

            let wallBox = this.getNodeWorldBox(wall);

            if (wallBox && checkBox.intersects(wallBox)) {
                this.bounceShellFromWall(wall);
                return;
            }
        }
    },

    bounceShellFromWall(wallNode) {
        if (!this.canTurn) return;

        this.canTurn = false;

        let oldDirection = this.direction;

        if (oldDirection > 0) {
            this.direction = -1;
        } else {
            this.direction = 1;
        }

        let shellBox = this.getNodeWorldBox(this.node);
        let wallBox = this.getNodeWorldBox(wallNode);

        if (shellBox && wallBox) {
            if (oldDirection > 0) {
                let shellRight = shellBox.x + shellBox.width;
                let targetRight = wallBox.x - this.shellWallPadding;
                let moveX = targetRight - shellRight;
                this.node.x += moveX;
            } else {
                let shellLeft = shellBox.x;
                let targetLeft = wallBox.x + wallBox.width + this.shellWallPadding;
                let moveX = targetLeft - shellLeft;
                this.node.x += moveX;
            }
        }

        this.node.x += this.direction * this.pushShellAwayDistance;

        cc.log("Shell bounced from " + wallNode.name + ". New direction: " + this.direction);

        this.scheduleOnce(function () {
            this.canTurn = true;
        }, this.turnCooldown);
    },

    turnAroundWalking() {
        if (!this.canTurn) return;

        this.canTurn = false;

        this.direction *= -1;

        if (this.rigidBody) {
            this.rigidBody.linearVelocity = cc.v2(
                this.direction * this.walkSpeed,
                this.rigidBody.linearVelocity.y
            );
        }

        this.node.x += this.direction * 4;

        this.flipTurtleBody();

        cc.log("Turtle turned around");

        this.scheduleOnce(function () {
            this.canTurn = true;
        }, this.turnCooldown);
    },

    bouncePlayer() {
        if (!this.player) return;

        let playerRb = this.player.getComponent(cc.RigidBody);

        if (playerRb) {
            playerRb.linearVelocity = cc.v2(
                playerRb.linearVelocity.x,
                this.bounceForce
            );
        }
    },

    hurtPlayer() {
        if (!this.canDamage) return;

        this.canDamage = false;

        cc.log("Enemy hurt Mario");

        let gm = this.getGameManager();

        if (gm) {
            gm.hurtMario();
        } else {
            cc.log("GameManager not found");
        }

        this.scheduleOnce(function () {
            this.canDamage = true;
        }, this.damageCooldown);
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
            name.includes("pipe") ||
            name.includes("tube") ||
            name.includes("block") ||
            name.includes("wall") ||
            name.includes("question")
        );
    },

    getNodeWorldBox(node) {
        if (!node) return null;

        let boxCollider = node.getComponent(cc.PhysicsBoxCollider);

        if (boxCollider) {
            let worldPos = node.convertToWorldSpaceAR(boxCollider.offset);

            return cc.rect(
                worldPos.x - boxCollider.size.width / 2,
                worldPos.y - boxCollider.size.height / 2,
                boxCollider.size.width,
                boxCollider.size.height
            );
        }

        return node.getBoundingBoxToWorld();
    },

    getAllWallNodes() {
        let result = [];

        if (!this.wallRoot) return result;

        function collect(node) {
            for (let i = 0; i < node.children.length; i++) {
                let child = node.children[i];

                result.push(child);

                if (child.children.length > 0) {
                    collect(child);
                }
            }
        }

        collect(this.wallRoot);

        return result;
    },

    showWalkingTurtle() {
        if (this.turtleBody) {
            this.turtleBody.active = true;
            this.turtleBody.opacity = 255;
            this.turtleBody.scaleX = 1;
            this.turtleBody.scaleY = 1;

            let turtleSprite = this.turtleBody.getComponent(cc.Sprite);
            if (turtleSprite) {
                turtleSprite.enabled = true;
            }

            let turtleAnim = this.turtleBody.getComponent(cc.Animation);
            if (turtleAnim) {
                turtleAnim.enabled = true;
                turtleAnim.play();
            }
        } else {
            cc.log("turtleBody is not assigned");
        }

        if (this.shellBody) {
            this.shellBody.active = false;
            this.shellBody.opacity = 0;
            this.shellBody.scaleX = 1;
            this.shellBody.scaleY = 1;

            let shellSprite = this.shellBody.getComponent(cc.Sprite);
            if (shellSprite) {
                shellSprite.enabled = false;
            }

            let shellAnim = this.shellBody.getComponent(cc.Animation);
            if (shellAnim) {
                shellAnim.stop();
                shellAnim.enabled = true;
            }
        } else {
            cc.log("shellBody is not assigned");
        }

        this.flipTurtleBody();
    },

    showShellIdle() {
        cc.log("showShellIdle called");

        if (this.turtleBody) {
            this.turtleBody.active = false;
            this.turtleBody.opacity = 0;

            let turtleSprite = this.turtleBody.getComponent(cc.Sprite);
            if (turtleSprite) {
                turtleSprite.enabled = false;
            }

            let turtleAnim = this.turtleBody.getComponent(cc.Animation);
            if (turtleAnim) {
                turtleAnim.stop();
            }
        }

        if (this.shellBody) {
            this.shellBody.active = true;
            this.shellBody.opacity = 255;
            this.shellBody.zIndex = 999;
            this.shellBody.setSiblingIndex(999);
            this.shellBody.scaleX = 1;
            this.shellBody.scaleY = 1;

            let shellSprite = this.shellBody.getComponent(cc.Sprite);
            if (shellSprite) {
                shellSprite.enabled = true;
            }

            let shellAnim = this.shellBody.getComponent(cc.Animation);
            if (shellAnim) {
                shellAnim.enabled = true;
                shellAnim.stop();
            }

            cc.log("Shell idle sprite shown");
        }
    },

    playShellAnimation() {
        if (!this.shellBody) {
            cc.log("shellBody is not assigned");
            return;
        }

        this.shellBody.active = true;
        this.shellBody.opacity = 255;

        let shellSprite = this.shellBody.getComponent(cc.Sprite);
        if (shellSprite) {
            shellSprite.enabled = true;
        }

        let shellAnim = this.shellBody.getComponent(cc.Animation);

        if (!shellAnim) {
            cc.log("ShellBody has no Animation component");
            return;
        }

        shellAnim.enabled = true;
        shellAnim.stop();

        let clip = shellAnim.getAnimationState(this.shellAnimName);

        if (clip) {
            shellAnim.play(this.shellAnimName);
            cc.log("Shell animation playing: " + this.shellAnimName);
        } else {
            cc.log(this.shellAnimName + " clip not found on ShellBody");
            shellAnim.play();
        }
    },

    flipTurtleBody() {
        if (this.state !== "walking") {
            return;
        }

        if (this.turtleFacesLeft) {
            if (this.direction < 0) {
                this.node.scaleX = 1;
            } else {
                this.node.scaleX = -1;
            }
        } else {
            if (this.direction < 0) {
                this.node.scaleX = -1;
            } else {
                this.node.scaleX = 1;
            }
        }
    },

    getGameManager() {
        if (!this.gameManager) {
            cc.log("Game Manager node is not assigned");
            return null;
        }

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