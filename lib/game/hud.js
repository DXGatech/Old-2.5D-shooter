ig.baked = true;
ig.module('game.hud').requires('plugins.twopointfive.hud').defines(function() {
    MyHud = tpf.Hud.extend({
        font: new tpf.Font('media/fredoka-one.font.png'),
        infoFont: new tpf.Font('media/info.font.png'),
        healthIconImageFull: new ig.Image('media/healthIconFull.png'),
        healthIconImage85: new ig.Image('media/healthIcon90.png'),
        healthIconImage70: new ig.Image('media/healthIcon75.png'),
        healthIconImage50: new ig.Image('media/healthIcon50.png'),
        healthIconImage25: new ig.Image('media/healthIcon25.png'),
        damageIndicatorImage: new ig.Image('media/hud-blood-low.png'),
        healthIconFull: null,
        healthIcon85: null,
        healthIcon70: null,
        healthIcon50: null,
        healthIcon25: null,
        DevNoteTimer: null,
        DevNoteDelay: 8,
        OtherDelay: 16,
        CurrentDevNote: 0,
        ResetTimer: null,
        DevNotes: ["", "", "", "", "", "", "", "", ""],
        devNoteCount: 0,
        hudBg: new ig.Image('media/healthbar.png'),
        keys: [],
        showControlsTimer: null,
        init: function(width, height, showControls) {
            this.parent(width, height);
            //this.hudBg = new tpf.HudTile(this.hudBg, 0, 1280, 75)
            //this.hudBg.setPosition(0, this.height - this.hudBg.tileHeight);
            this.ResetTimer = new ig.Timer(this.OtherDelay);
            this.devNoteCount = this.DevNotes.length;
            this.DevNoteTimer = new ig.Timer(this.DevNoteDelay);
            this.healthIconFull = new tpf.HudTile(this.healthIconImageFull, 0, 58, 60);
            this.healthIconFull.scale = 0.25;
            var centerPos = 640 - this.healthIconFull.tileWidth / 2;
            this.healthIconFull.setPosition(centerPos, this.height - this.healthIconFull.tileHeight - 4);
            this.healthIcon85 = new tpf.HudTile(this.healthIconImage85, 0, 58, 60);
            this.healthIcon85.scale = 0.25;
            this.healthIcon85.setPosition(centerPos, this.height - this.healthIcon85.tileHeight - 4);
            this.healthIcon70 = new tpf.HudTile(this.healthIconImage70, 0, 58, 60);
            this.healthIcon70.scale = 0.25;
            this.healthIcon70.setPosition(centerPos, this.height - this.healthIcon70.tileHeight - 4);
            this.healthIcon50 = new tpf.HudTile(this.healthIconImage50, 0, 58, 60);
            this.healthIcon50.scale = 0.25;
            this.healthIcon50.setPosition(centerPos, this.height - this.healthIcon50.tileHeight - 4);
            this.healthIcon25 = new tpf.HudTile(this.healthIconImage25, 0, 58, 60);
            this.healthIcon25.scale = 0.25;
            this.healthIcon25.setPosition(centerPos, this.height - this.healthIcon25.tileHeight - 4);
        },
        getRandomArbitrary: function(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        },
        draw: function(player, weapon) {
            this.prepare();
            if (weapon) {
                weapon.draw();
                //this.hudBg.draw();
                if (weapon.ammoIcon) {
                    weapon.ammoIcon.setPosition(100, this.height - this.font.height - 15);
                    weapon.ammoIcon.draw();
                    if (weapon.weaponName !== "Fist") {
                        this.font.draw(weapon.ammo, 75, this.height - this.font.height - 10, ig.Font.ALIGN.RIGHT);
                    }
                }
            }
            var h = player.health;
            if (h === 100 || h >= 85) {
                this.healthIconFull.draw();
            } else if (h < 85 && h >= 70) {
                this.healthIcon85.draw();
            } else if (h < 70 && h >= 50) {
                this.healthIcon70.draw();
            } else if (h < 50 && h >= 25) {
                this.healthIcon50.draw();
            } else if (h < 25) {
                this.healthIcon25.draw();
            }
            this.font.draw('Kill Count: ' + ig.game.blobKillCount, 500, this.height - this.font.height - 10, ig.Font.ALIGN.RIGHT);
            if (this.DevNoteTimer.delta() > 0) {
                this.infoFont.draw(this.DevNotes[this.CurrentDevNote], 700, this.height - this.font.height - 10, ig.Font.ALIGN.LEFT);
                if (this.ResetTimer.delta() > 0) {
                    this.CurrentDevNote = this.getRandomArbitrary(0, this.devNoteCount - 1);
                    this.DevNoteTimer.reset();
                    this.ResetTimer.reset();
                }
            } else {
                this.infoFont.draw(player.objective, 700, this.height - this.font.height - 10, ig.Font.ALIGN.LEFT);
            }
            this.drawDefault();
        }
    });
});