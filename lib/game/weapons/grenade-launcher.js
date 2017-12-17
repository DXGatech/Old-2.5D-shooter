ig.baked = true;
ig.module('game.weapons.grenade-launcher').requires('game.weapons.base', 'plugins.twopointfive.entity', 'impact.entity-pool').defines(function() {
    WeaponGrenadeLauncher = Weapon.extend({
        offset: {
            x: -225,
            y: 425
        },
        maxAmmo: 24,
        cooldown: 1.0,
        animSheet: new ig.AnimationSheet('media/grenade-launcher.png', 765, 490),
        shootSound: new ig.Sound('media/sounds/grenade-launcher.*'),
        emptySound: new ig.Sound('media/sounds/empty-click.*'),
        ammoIconImage: new ig.Image('media/iconGrenade.png'),
        ammoIcon: null,
        init: function(ammo) {
            this.parent(ammo);
            this.addAnim('idle', 100, [0]);
            this.addAnim('shoot', 0.1, [1, 2, 0], true);
            this.ammoIcon = new tpf.HudTile(this.ammoIconImage, 0, 81, 45);
            this.ammoIcon.setPosition(50, 460)
            this.shootSound.volume = 1;
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
            ig.game.spawnEntity(EntityGrenade, x, y, {
                angle: angle
            });
            this.currentAnim = this.anims.shoot.rewind();
            this.shootSound.play();
            this.flash(0.2);
        }
    });
    EntityGrenade = tpf.Entity.extend({
        checkAgainst: ig.Entity.TYPE.B,
        collides: ig.Entity.COLLIDES.NEVER,
        size: {
            x: 8,
            y: 8
        },
        speed: 550,
        scale: 0.25,
        bounciness: 0.8,
        minBounceVelocity: 0.5,
        blastSettings: {
            radius: 100,
            damage: 100
        },
        explosionParticles: 20,
        explosionRadius: 60,
        animSheet: new ig.AnimationSheet('media/grenade.png', 64, 64),
        explodeSound: new ig.Sound('media/sounds/explosion.*'),
        bounceSound: new ig.Sound('media/sounds/grenade-bounce.*'),
        dynamicLight: true,
        init: function(x, y, settings) {
            this.parent(x - this.size.x / 2, y - this.size.y / 2, settings);
            this.addAnim('idle', 1, [0]);
            this.addAnim('bouncing', 0.1, [1, 2, 3, 0]);
            this.bounceSound.volume = 0.8;
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
            }
            this.parent(res);
        },
        kill: function() {
            for (var i = 0; i < this.explosionParticles; i++) {
                var x = this.pos.x
                + Math.random() * this.explosionRadius * 2
                - this.explosionRadius;
                var y = this.pos.y
                + Math.random() * this.explosionRadius * 2
                - this.explosionRadius;
                ig.game.spawnEntity(EntityGrenadeExplosion, x, y);
            }
            ig.game.spawnEntity(EntityBlastRadius, this.pos.x, this.pos.y, this.blastSettings);
            this.explodeSound.play();
            this.parent();
        }
    });
    ig.EntityPool.enableFor(EntityGrenade);
    EntityBlastRadius = ig.Entity.extend({
        frame: 0,
        radius: 8,
        damage: 20,
        checkAgainst: ig.Entity.TYPE.BOTH,
        init: function(x, y, settings) {
            var offset = settings.radius || this.radius;
            this.size.x = this.size.y = offset * 2;
            this.parent(x - offset, y - offset, settings);
        },
        update: function() {
            if (this.frame == 2) {
                this.kill();
            }
            this.frame++;
        },
        draw: function() {},
        check: function(other) {
            if (this.frame != 1) {
                return;
            }
            var f = 1 - (this.distanceTo(other) / this.radius);
            if (f > 0) {
                var damage = Math.ceil(Math.sqrt(f) * this.damage);
                other.receiveDamage(damage, this);
            }
        }
    });
    EntityGrenadeExplosion = tpf.Entity.extend({
        size: {
            x: 0,
            y: 0
        },
        vpos: 2,
        scale: 1,
        gravityFactor: 0,
        animSheet: new ig.AnimationSheet('media/explosion.png', 32, 32),
        init: function(x, y, settings) {
            var frameTime = Math.random() * 0.1 + 0.03;
            this.addAnim('idle', frameTime, [0, 1, 2, 3], true);
            this.parent(x, y, settings);
            this.pos.z = Math.random() * 20;
        },
        reset: function(x, y, settings) {
            this.currentAnim.rewind();
            this.parent(x, y, settings);
        },
        update: function() {
            this.parent();
            if (this.currentAnim.loopCount) {
                this.kill();
            }
        }
    });
    ig.EntityPool.enableFor(EntityGrenadeExplosion);
});