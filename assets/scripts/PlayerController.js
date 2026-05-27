cc.Class({
    extends: cc.Component,

    properties: {
        moveSpeed: 120,
        jumpForce: 520,

        walkAnimName: "player_walk",
        jumpAnimName: "player_jump",

        idleSpriteFrame: cc.SpriteFrame,

        jumpAnimLockTime: 0.25
    },

    onLoad() {
        this.moveDir = 0;
        this.currentAnim = "";

        this.isGrounded = false;
        this.groundContactCount = 0;
        this.jumpAnimTimer = 0;

        cc.director.getPhysicsManager().enabled = true;
        cc.director.getPhysicsManager().gravity = cc.v2(0, -640);

        this.rigidBody = this.getComponent(cc.RigidBody);
        this.anim = this.getComponent(cc.Animation);
        this.sprite = this.getComponent(cc.Sprite);

        if (this.rigidBody) {
            this.rigidBody.enabledContactListener = true;
            this.rigidBody.fixedRotation = true;
        }

        this.showIdleSprite();

        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    },

    onDestroy() {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    },

    update(dt) {
        this.node.x += this.moveDir * this.moveSpeed * dt;

        if (this.jumpAnimTimer > 0) {
            this.jumpAnimTimer -= dt;
        }

        this.flipPlayer();
        this.updateAnimation();
    },

    onKeyDown(event) {
        if (event.keyCode === cc.macro.KEY.a || event.keyCode === cc.macro.KEY.left) {
            this.moveDir = -1;
        }

        if (event.keyCode === cc.macro.KEY.d || event.keyCode === cc.macro.KEY.right) {
            this.moveDir = 1;
        }

        if (
            event.keyCode === cc.macro.KEY.space ||
            event.keyCode === cc.macro.KEY.w ||
            event.keyCode === cc.macro.KEY.up
        ) {
            cc.log("JUMP KEY PRESSED");
            this.jump();
        }
    },

    onKeyUp(event) {
        if (
            event.keyCode === cc.macro.KEY.a ||
            event.keyCode === cc.macro.KEY.left ||
            event.keyCode === cc.macro.KEY.d ||
            event.keyCode === cc.macro.KEY.right
        ) {
            this.moveDir = 0;
        }
    },

    jump() {
        if (!this.rigidBody) return;

        if (!this.isGrounded) {
            cc.log("Cannot jump because player is not grounded");
            return;
        }

        let velocity = this.rigidBody.linearVelocity;
        velocity.y = this.jumpForce;
        this.rigidBody.linearVelocity = velocity;

        this.isGrounded = false;
        this.groundContactCount = 0;

        this.jumpAnimTimer = this.jumpAnimLockTime;
        this.playAnim(this.jumpAnimName);

        if (window.GameManager && window.GameManager.playJumpSound) {
            window.GameManager.playJumpSound();
        } else if (window.SoundManager && window.SoundManager.playJump) {
            window.SoundManager.playJump();
        }
    },

    flipPlayer() {
        if (this.moveDir < 0) {
            this.node.scaleX = -Math.abs(this.node.scaleX);
        } else if (this.moveDir > 0) {
            this.node.scaleX = Math.abs(this.node.scaleX);
        }
    },

    updateAnimation() {
        if (!this.rigidBody) return;

        let velocity = this.rigidBody.linearVelocity;

        if (this.jumpAnimTimer > 0) {
            this.playAnim(this.jumpAnimName);
            return;
        }

        if (!this.isGrounded || Math.abs(velocity.y) > 15) {
            this.playAnim(this.jumpAnimName);
            return;
        }

        if (this.moveDir !== 0) {
            this.playAnim(this.walkAnimName);
            return;
        }

        
        this.showIdleSprite();
    },

    playAnim(animName) {
        if (!this.anim) {
            cc.log("No Animation component on Player");
            return;
        }

        if (this.currentAnim === animName) return;

        let state = this.anim.getAnimationState(animName);

        if (!state) {
            cc.log("Animation clip not found: " + animName);
            return;
        }

        this.currentAnim = animName;
        this.anim.play(animName);
    },

    showIdleSprite() {
        if (this.anim) {
            this.anim.stop();
        }

        this.currentAnim = "";

        if (this.sprite && this.idleSpriteFrame) {
            this.sprite.spriteFrame = this.idleSpriteFrame;
        }
    },

    onBeginContact(contact, selfCollider, otherCollider) {
        let otherNode = otherCollider.node;

        if (this.isGroundObject(otherNode)) {
            this.groundContactCount += 1;
            this.isGrounded = true;

            this.jumpAnimTimer = 0;

            if (this.moveDir !== 0) {
                this.playAnim(this.walkAnimName);
            } else {
                this.showIdleSprite();
            }
        }
    },

    onEndContact(contact, selfCollider, otherCollider) {
        let otherNode = otherCollider.node;

        if (this.isGroundObject(otherNode)) {
            this.groundContactCount -= 1;

            if (this.groundContactCount <= 0) {
                this.groundContactCount = 0;
                this.isGrounded = false;
            }
        }
    },

    isGroundObject(node) {
        if (!node) return false;

        let name = node.name.toLowerCase();

        return (
            name.includes("ground") ||
            name.includes("block") ||
            name.includes("wall") ||
            name.includes("pipe") ||
            name.includes("tube") ||
            name.includes("question")
        );
    }
});