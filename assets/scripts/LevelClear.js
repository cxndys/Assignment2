cc.Class({
    extends: cc.Component,

    properties: {
        gameManager: cc.Node
    },

    onLoad() {
        cc.log("LevelClear flag script running");

        let rb = this.getComponent(cc.RigidBody);

        if (rb) {
            rb.enabledContactListener = true;
        }
    },

    onBeginContact(contact, selfCollider, otherCollider) {
        let otherNode = otherCollider.node;

        let isPlayer =
            otherNode.name.toLowerCase().includes("player") ||
            otherNode.name.toLowerCase().includes("mario");

        if (!isPlayer) return;

        cc.log("Player touched level clear flag");

        let gm = this.getGameManager();

        if (gm) {
            gm.levelClear();
        } else {
            cc.log("GameManager not found from LevelClear flag");
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
                if (typeof components[i].levelClear === "function") {
                    gm = components[i];
                    break;
                }
            }
        }

        return gm;
    }
});