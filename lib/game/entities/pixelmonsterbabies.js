ig.baked = true;
ig.module('game.entities.pixelmonsterbabies').requires('plugins.twopointfive.entity', 'game.entities.particle').defines(function() {
    EntityPixelmonsterbabies = tpf.Entity.extend({
        type: ig.Entity.TYPE.B,
        checkAgainst: ig.Entity.TYPE.A,
        collides: ig.Entity.COLLIDES.ACTIVE,
        size: {
            x: 40,
            y: 35
        },
        friction: {
            x: 100,
            y: 100
        },
        scale: 0.75,
        health: 20,
        damage: 10,
        dynamicLight: true,
        _wmBoxColor: '#ff0000',
        angle: 0,
        speed: 150,
        injump: false,
        invincible: true,
        invincibleDelay: 0.5,
        invincibleTimer: null,
        didHurtPlayer: false,
        seenPlayer: false,
        gotHit: false,
        gotHit2: false,
        gotHit3: false,
        animSheet: new ig.AnimationSheet('media/pixelmonsterbabies.png', 42, 35),
        init: function(x, y, settings) {
            this.parent(x, y, settings);
            var crawFrameTime = 0.04 + Math.random() * 0.02;
            this.hitCounter = 0;
            this.addAnim('crawl', 0.1, [0, 1, 2, 3]);
            this.addAnim('hurt1', 0.1, [4, 5, 6, 7]);
            this.addAnim('hurt2', 0.1, [8, 9, 10, 11]);
            this.addAnim('hurt3', 0.1, [12, 13, 14, 15]);
            this.currentAnim.gotoRandomFrame();
            this.invincibleTimer = new ig.Timer();
            this.makeInvincible();
            this.hurtTimer = new ig.Timer();
        },
        makeInvincible: function() {
            this.invincible = true;
            this.invincibleTimer.reset();
        },
        update: function() {
            this.angle = this.angleTo(ig.game.player);
            this.vel.x = Math.cos(this.angle) * this.speed;
            this.vel.y = Math.sin(this.angle) * this.speed;
            var newHurtTimer = null;
            if (this.gotHit) {
                this.currentAnim = this.anims.hurt1;
                if (this.gotHit2) {
                    this.currentAnim = this.anims.hurt2;
                    if (this.gotHit3) {
                        this.currentAnim = this.anims.hurt3;
                    }
                }
            } else {
                this.currentAnim = this.anims.crawl;
            }
            if (ig.game.dead) {
                this.vel.x *= -1;
                this.vel.y *= -1;
            }
            if (this.invincibleTimer.delta() > this.invincibleDelay) {
                this.invincible = false;
                this.currentAnim.alpha = 1;
            }
            this.parent();
        },
        receiveDamage: function(ammont, from) {
            if (this.invincible) {
                return;
            }
            if (this.gotHit) {
                if (this.gotHit2) {
                    this.gotHit3 = true;
                }
                this.gotHit2 = true;
            }
            this.gotHit = true;
            this.parent(ammont, from);
            for (var i = 0; i < 1; i++) {
                ig.game.spawnEntity(EntityEnemyBlood, this.pos.x, this.pos.y + 32);
            }
        },
        draw: function() {
            if (this.invincible) {
                this.currentAnim.alpha = this.invincibleTimer.delta() / this.invincibleDelay * 1;
            }
            this.parent();
        },
        kill: function() {
            var cx = this.pos.x + this.size.x / 2;
            var cy = this.pos.y + this.size.y / 2;
            for (var i = 0; i < 5; i++) {
                ig.game.spawnEntity(EntityEnemyBlood, cx, cy);
            }
            ig.game.blobKillCount++;
            this.parent();
        },
        check: function(other) {
            if (this.hurtTimer.delta() < 0) {
                return;
            }
            this.hurtTimer.set(1);
            this.vel.x = -this.vel.x;
            this.vel.y = -this.vel.y;
            other.receiveDamage(this.damage, this);
        }
    });
    EntityEnemyBlood = EntityParticle.extend({
        vpos: 0,
        scale: 0.5,
        initialVel: {
            x: 50,
            y: 50,
            z: 2.5
        },
        particles: 25,
        lifetime: 2,
        animSheet: new ig.AnimationSheet('media/blood.png', 16, 16),
        init: function(x, y, settings) {
            this.addAnim('idle', 5, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
            this.parent(x, y, settings);
        }
    });
});