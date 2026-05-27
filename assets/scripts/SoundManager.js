cc.Class({
    extends: cc.Component,

    properties: {
        
        bgm_1: cc.AudioClip,
        bgm_2: cc.AudioClip,
        bgm_3: cc.AudioClip,

        
        coin: cc.AudioClip,
        gameOver: cc.AudioClip,
        gameOver2: cc.AudioClip,
        jump: cc.AudioClip,
        kick: cc.AudioClip,
        levelClear: cc.AudioClip,
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
        window.SoundManager = this;

        this.bgmStarted = false;

        cc.log("SoundManager is running");

        
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.startAudioOnce, this);
        this.node.on(cc.Node.EventType.TOUCH_START, this.startAudioOnce, this);
    },

    onDestroy() {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.startAudioOnce, this);
        this.node.off(cc.Node.EventType.TOUCH_START, this.startAudioOnce, this);
    },

    startAudioOnce() {
        if (this.bgmStarted) return;

        this.bgmStarted = true;

        cc.log("Audio unlocked, starting BGM");

        this.playBGM1();
    },

    playBGM1() {
        if (!this.bgm_1) {
            cc.log("bgm_1 is NOT assigned");
            return;
        }

        cc.audioEngine.setMusicVolume(this.bgmVolume);
        cc.audioEngine.playMusic(this.bgm_1, true);

        cc.log("bgm_1 started");
    },

    playSFX(clip, name) {
        if (!clip) {
            cc.log(name + " is NOT assigned");
            return;
        }

        cc.audioEngine.setEffectsVolume(this.sfxVolume);
        cc.audioEngine.playEffect(clip, false);

        cc.log(name + " sound played");
    },

    playCoin() {
        this.playSFX(this.coin, "coin");
    },

    playGameOver() {
        this.playSFX(this.gameOver, "gameOver");
    },

    playGameOver2() {
        this.playSFX(this.gameOver2, "gameOver2");
    },

    playJump() {
        this.playSFX(this.jump, "jump");
    },

    playKick() {
        this.playSFX(this.kick, "kick");
    },

    playLevelClear() {
        this.playSFX(this.levelClear, "levelClear");
    },

    playLoseOneLife() {
        this.playSFX(this.loseOneLife, "loseOneLife");
    },

    playPowerDown() {
        this.playSFX(this.powerDown, "powerDown");
    },

    playPowerUp() {
        this.playSFX(this.powerUp, "powerUp");
    },

    playPowerUpAppear() {
        this.playSFX(this.powerUpAppear, "powerUpAppear");
    },

    playReserve() {
        this.playSFX(this.reserve, "reserve");
    },

    playStomp() {
        this.playSFX(this.stomp, "stomp");
    }
});