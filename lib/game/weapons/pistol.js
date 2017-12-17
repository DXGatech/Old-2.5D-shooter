ig.baked = true;
ig.module('game.weapons.pistol').requires('game.weapons.base', 'plugins.twopointfive.entity', 'impact.entity-pool').defines(function() {
    WeaponPistol = Weapon.extend({
        offset: {
            x: -125,
            y: 350
        },
        maxAmmo: 110,
        cooldown: 0.3,
        animSheet: new ig.AnimationSheet('media/pistol.png', 610, 395),
        shootSound: new ig.Sound('media/sounds/pistol.*'),
        reloadSound: new ig.Sound('media/sounds/pistolreload.*'),
        emptySound: new ig.Sound('media/sounds/empty-click.*'),
        ammoIconImage: new ig.Image('media/iconPistol.png'),
        ammoIcon: null,
        shootCount: 0,
        init: function(ammo) {
            this.parent(ammo);
            this.addAnim('idle', 100, [0]);
            this.addAnim('shoot', 0.1, [1, 2, 0], true);
            this.ammoIcon = new tpf.HudTile(this.ammoIconImage, 0, 45, 45);
            this.ammoIcon.setPosition(50, 460)
            this.shootSound.volume = 0.3;
            this.reloadSound.volume = 1;
        },
        depleted: function() {
            if (this.shootTimer.delta() > 0 && this.ammo <= 0) {
                this.shootTimer.set(this.cooldown);
                this.emptySound.play();
                return true;
            }
            else {
                return false
            }
        },
        shoot: function(x, y, angle) {
            ig.game.spawnEntity(EntityBullet, x, y, {
                angle: angle
            });
            this.currentAnim = this.anims.shoot.rewind();
            this.shootSound.play();
            if (this.shootCount === 12) {
                this.reloadSound.play();
                this.shootCount = 0;
            }
            this.flash(0.2);
            this.shootCount = this.shootCount + 1;
        }
    });
    EntityBullet = tpf.Entity.extend({
        checkAgainst: ig.Entity.TYPE.B,
        collides: ig.Entity.COLLIDES.NEVER,
        size: {
            x: 8,
            y: 8
        },
        speed: 1250,
        scale: 0.25,
        bounciness: 0.0,
        minBounceVelocity: 0.0,
        blastSettings: {
            radius: 65,
            damage: 10
        },
        explosionParticles: 0,
        explosionRadius: 0,
        animSheet: new ig.AnimationSheet('media/bullet.png', 8, 10),
        explodeSound: new ig.Sound('media/sounds/explosion.*'),
        bounceSound: new ig.Sound('media/sounds/grenade-bounce.*'),
        dynamicLight: true,
        init: function(x, y, settings) {
            this.parent(x - this.size.x / 2, y - this.size.y / 3, settings);
            this.addAnim('idle', .1, [1, 0], true);
            this.bounceSound.volume = 0.6;
            this.explodeSound.volume = 0.9;
            this.vel.x = -Math.sin(this.angle) * this.speed;
            this.vel.y = -Math.cos(this.angle) * this.speed;
            this.vel.z = 1.2;
            this.pos.z = 12;
        },
        reset: function(x, y, settings) {
            this.parent(x, y, settings);
            this.vel.x = -Math.sin(this.angle) * this.speed;
            this.vel.y = -Math.cos(this.angle) * this.speed;
            this.vel.z = 1.2;
            this.pos.z = 12;
            this.currentAnim = this.anims.idle.rewind();
        },
        update: function() {
            if (this.currentAnim.loopCount > 0) {
                this.kill();
                return;
            }
            var zvel = this.vel.z;
            this.parent();
            if (zvel < 0 && this.vel.z > 0) {
                this.bounceSound.play();
                this.currentAnim = this.anims.bouncing.rewind();
            }
        },
        check: function(other) {
            this.kill();
        },
        handleMovementTrace: function(res) {
            if (res.collision.x || res.collision.y) {
                this.bounceSound.play();
                this.kill();
            }
            this.parent(res);
        },
        kill: function() {
            ig.game.spawnEntity(EntityBlastRadius, this.pos.x, this.pos.y, this.blastSettings);
            this.parent();
        }
    });
    ig.EntityPool.enableFor(EntityBullet);
});