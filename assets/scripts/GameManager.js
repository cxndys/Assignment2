cc.Class({
    extends: cc.Component,

    properties: {
        player: cc.Node,

        lifeLabel: cc.Label,
        scoreLabel: cc.Label,
        timerLabel: cc.Label,

   
        GameStart: cc.Node,
        GameStartLabel: cc.Label,
        gameStartDelay: 1.5,


        LevelClear: cc.Node,

        FinalScoreText: cc.Label,
        FinalScoreLabel: cc.Label,

        TimeBonusText: cc.Label,
        TimeBonusLabel: cc.Label,

        TotalScoreText: cc.Label,
        TotalScoreLabel: cc.Label,

        timeBonusMultiplier: 10,

        
        GameOver: cc.Node,
        GameOverLabel: cc.Label,

        gameSceneName: "Game",
        menuSceneName: "Menu",

        finishJumpXSpeed: 120,
        finishJumpYSpeed: 220,
        showLevelClearDelay: 0.6,

        maxTime: 120,
        fallLimitY: -400,

        bigMarioScale: 1.5,
        smallMarioScale: 1,

        damageCooldown: 1.0,

       
        bgm_1: cc.AudioClip,
        bgm_2: cc.AudioClip,
        bgm_3: cc.AudioClip,

        
        coin: cc.AudioClip,
        gameOverSound: cc.AudioClip,
        gameOver2: cc.AudioClip,
        jumpSound: cc.AudioClip,
        kick: cc.AudioClip,
        levelClearSound: cc.AudioClip,
        loseOneLife: cc.AudioClip,
        powerDown: cc.AudioClip,
        powerUp: cc.AudioClip,
        powerUpAppear: cc.AudioClip,
        reserve: cc.AudioClip,
        stomp: cc.AudioClip,

        bgmVolume: 0.5,
        sfxVolume: 1.0
    },

    onLoad() {
        window.GameManager = this;

        let physicsManager = cc.director.getPhysicsManager();
        physicsManager.enabled = true;
        physicsManager.gravity = cc.v2(0, -640);
        physicsManager.debugDrawFlags = 0;

        this.life = 3;
        this.score = 0;
        this.timer = this.maxTime;

        this.isBigMario = false;
        this.canTakeDamage = true;
        this.bgmStarted = false;
        this.gameEnded = false;
        this.gameStarted = false;

        if (this.GameStart) {
            this.GameStart.active = false;
        }

        if (this.LevelClear) {
            this.LevelClear.active = false;
        }

        if (this.GameOver) {
            this.GameOver.active = false;
        }

        if (this.player) {
            this.startPosition = this.player.position.clone();
            this.setMarioSmall();
        }

        cc.log("GameManager is running");

        this.updateUI();
        this.showGameStart();

        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.startBGMOnce, this);
    },

    onDestroy() {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.startBGMOnce, this);
    },

    showGameStart() {
        cc.log("Showing GAME START");

        this.gameStarted = false;

        if (this.GameStart) {
            this.GameStart.active = true;
        }

        if (this.GameStartLabel) {
            this.GameStartLabel.string = "GAME START";
        }

        this.setPlayerControl(false);

        this.scheduleOnce(function () {
            this.startGame();
        }, this.gameStartDelay);
    },

    startGame() {
        cc.log("Game started");

        this.gameStarted = true;

        if (this.GameStart) {
            this.GameStart.active = false;
        }

        this.setPlayerControl(true);
    },

    setPlayerControl(enabled) {
        if (!this.player) return;

        let playerController = this.player.getComponent("PlayerController");

        if (playerController) {
            playerController.enabled = enabled;

            if (!enabled && playerController.moveDir !== undefined) {
                playerController.moveDir = 0;
            }
        }

        let rigidBody = this.player.getComponent(cc.RigidBody);

        if (rigidBody && !enabled) {
            rigidBody.linearVelocity = cc.v2(0, 0);
            rigidBody.angularVelocity = 0;
        }
    },

    startBGMOnce() {
        if (this.bgmStarted) return;

        this.bgmStarted = true;

        cc.log("Starting BGM");
        this.playBGM1();
    },

    playBGM1() {
        if (!this.bgm_1) {
            cc.log("bgm_1 is not assigned");
            return;
        }

        cc.audioEngine.setMusicVolume(this.bgmVolume);
        cc.audioEngine.playMusic(this.bgm_1, true);

        cc.log("bgm_1 started");
    },

    playBGM2() {
        if (!this.bgm_2) return;

        cc.audioEngine.setMusicVolume(this.bgmVolume);
        cc.audioEngine.playMusic(this.bgm_2, true);
    },

    playBGM3() {
        if (!this.bgm_3) return;

        cc.audioEngine.setMusicVolume(this.bgmVolume);
        cc.audioEngine.playMusic(this.bgm_3, true);
    },

    playSFX(clip, name) {
        if (!clip) {
            cc.log(name + " is not assigned");
            return;
        }

        cc.audioEngine.setEffectsVolume(this.sfxVolume);
        cc.audioEngine.playEffect(clip, false);
    },

    playJumpSound() {
        this.playSFX(this.jumpSound, "jump");
    },

    playLoseOneLifeSound() {
        this.playSFX(this.loseOneLife, "loseOneLife");
    },

    playGameOverSound() {
        this.playSFX(this.gameOverSound, "gameOver");
    },

    playPowerDownSound() {
        this.playSFX(this.powerDown, "powerDown");
    },

    playPowerUpSound() {
        this.playSFX(this.powerUp, "powerUp");
    },

    playPowerUpAppearSound() {
        this.playSFX(this.powerUpAppear, "powerUpAppear");
    },

    playStompSound() {
        this.playSFX(this.stomp, "stomp");
    },

    playCoinSound() {
        this.playSFX(this.coin, "coin");
    },

    playKickSound() {
        this.playSFX(this.kick, "kick");
    },

    playLevelClearSound() {
        this.playSFX(this.levelClearSound, "levelClear");
    },

    update(dt) {
        if (!this.gameStarted) return;
        if (this.gameEnded) return;

        if (this.timer > 0) {
            this.timer -= dt;
        }

        if (this.timer <= 0) {
            this.timer = 0;
            this.updateUI();
            this.gameOver();
            return;
        }

        if (this.player && this.player.y < this.fallLimitY) {
            this.playerDie();
        }

        this.updateUI();
    },

    addScore(amount) {
        this.score += amount;
        this.updateUI();
    },

    powerUpMario() {
        if (!this.player) return;

        let direction = 1;

        if (this.player.scaleX < 0) {
            direction = -1;
        }

        this.player.scaleX = direction * this.bigMarioScale;
        this.player.scaleY = this.bigMarioScale;

        this.isBigMario = true;

        this.playPowerUpSound();

        cc.log("Mario became big");
    },

    setMarioSmall() {
        if (!this.player) return;

        let direction = 1;

        if (this.player.scaleX < 0) {
            direction = -1;
        }

        this.player.scaleX = direction * this.smallMarioScale;
        this.player.scaleY = this.smallMarioScale;

        this.isBigMario = false;

        cc.log("Mario became small");
    },

    hurtMario() {
        if (!this.canTakeDamage) return;
        if (this.gameEnded) return;

        this.canTakeDamage = false;

        let marioIsBig = false;

        if (this.player && Math.abs(this.player.scaleY) > 1.1) {
            marioIsBig = true;
        }

        if (marioIsBig) {
            cc.log("Big Mario got hit, becoming small");

            this.playPowerDownSound();
            this.setMarioSmall();

            this.scheduleOnce(function () {
                this.canTakeDamage = true;
            }, this.damageCooldown);

            return;
        }

        cc.log("Small Mario got hit, losing life");

        this.playerDie();

        this.scheduleOnce(function () {
            this.canTakeDamage = true;
        }, this.damageCooldown);
    },

    playerDie() {
        if (this.gameEnded) return;

        cc.log("playerDie called");

        this.playLoseOneLifeSound();

        this.life -= 1;

        this.setMarioSmall();

        if (this.life <= 0) {
            this.life = 0;
            this.updateUI();
            this.gameOver();
            return;
        }

        this.respawnPlayer();
        this.updateUI();
    },

    respawnPlayer() {
        if (!this.player) return;

        this.player.setPosition(this.startPosition);

        let rigidBody = this.player.getComponent(cc.RigidBody);

        if (rigidBody) {
            rigidBody.linearVelocity = cc.v2(0, 0);
            rigidBody.angularVelocity = 0;
        }
    },

    gameOver() {
        if (this.gameEnded) return;

        this.gameEnded = true;

        cc.log("GAME OVER");

        this.playGameOverSound();

        if (this.GameStart) {
            this.GameStart.active = false;
        }

        if (this.GameOver) {
            this.GameOver.active = true;
        }

        if (this.GameOverLabel) {
            this.GameOverLabel.string = "GAME OVER";
        }

        this.stopPlayer();

        
    },

    levelClear() {
        if (this.gameEnded) return;

        this.gameEnded = true;

        cc.log("LEVEL CLEAR");

        let originalScore = this.score;
        let remainingTime = Math.ceil(this.timer);
        let timeBonus = remainingTime * this.timeBonusMultiplier;
        let totalScore = originalScore + timeBonus;

        this.score = totalScore;
        this.updateUI();

        cc.log("Original Score: " + originalScore);
        cc.log("Remaining Time: " + remainingTime);
        cc.log("Time Bonus: " + timeBonus);
        cc.log("Total Score: " + totalScore);

        this.playLevelClearSound();

        if (this.GameStart) {
            this.GameStart.active = false;
        }

        this.makeMarioJumpOverFlag();

        this.scheduleOnce(function () {
            this.showLevelClearUI(originalScore, timeBonus, totalScore);
        }, this.showLevelClearDelay);
    },

    makeMarioJumpOverFlag() {
        if (!this.player) return;

        let playerController = this.player.getComponent("PlayerController");

        if (playerController) {
            playerController.enabled = false;
        }

        let rigidBody = this.player.getComponent(cc.RigidBody);

        if (rigidBody) {
            rigidBody.linearVelocity = cc.v2(
                this.finishJumpXSpeed,
                this.finishJumpYSpeed
            );
        }
    },

    showLevelClearUI(originalScore, timeBonus, totalScore) {
        if (this.LevelClear) {
            this.LevelClear.active = true;
        }

        if (this.FinalScoreText) {
            this.FinalScoreText.string = "SCORE";
        }

        if (this.FinalScoreLabel) {
            this.FinalScoreLabel.string = originalScore.toString();
        }

        if (this.TimeBonusText) {
            this.TimeBonusText.string = "TIMEBONUS";
        }

        if (this.TimeBonusLabel) {
            this.TimeBonusLabel.string = timeBonus.toString();
        }

        if (this.TotalScoreText) {
            this.TotalScoreText.string = "TOTALSCORE";
        }

        if (this.TotalScoreLabel) {
            this.TotalScoreLabel.string = totalScore.toString();
        }

        this.stopPlayer();
    },

    stopPlayer() {
        if (!this.player) return;

        let rigidBody = this.player.getComponent(cc.RigidBody);

        if (rigidBody) {
            rigidBody.linearVelocity = cc.v2(0, 0);
            rigidBody.angularVelocity = 0;
        }

        let playerController = this.player.getComponent("PlayerController");

        if (playerController) {
            playerController.enabled = false;

            if (playerController.moveDir !== undefined) {
                playerController.moveDir = 0;
            }
        }
    },

    restartGame() {
        cc.log("Restart current level");
    
        cc.audioEngine.stopAllEffects();
        cc.audioEngine.stopMusic();
    
        let currentSceneName = cc.director.getScene().name;
    
        cc.director.loadScene(currentSceneName);
    },

    goToMenu() {
        cc.log("Go to menu");

        cc.audioEngine.stopAllEffects();
        cc.audioEngine.stopMusic();

        cc.director.loadScene(this.menuSceneName);
    },

    updateUI() {
        if (this.lifeLabel) {
            this.lifeLabel.string = "x " + this.life;
        }

        if (this.scoreLabel) {
            this.scoreLabel.string = this.score.toString();
        }

        if (this.timerLabel) {
            this.timerLabel.string = Math.ceil(this.timer).toString();
        }
    }
});