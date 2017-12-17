ig.baked = true;
ig.module('game.weapons.shotgun').requires('game.weapons.base', 'plugins.twopointfive.entity', 'impact.entity-pool').defines(function() {
    WeaponShotgun = Weapon.extend({
        offset: {
            x: -250,
            y: 425
        },
        maxAmmo: 48,
        cooldown: 1.0,
        animSheet: new ig.AnimationSheet('media/shotgun.png', 756, 560),
        shootSound: new ig.Sound('media/sounds/shotgun.*'),
        reloadSound: new ig.Sound('media/sounds/shotgunreload.*'),
        emptySound: new ig.Sound('media/sounds/empty-click.*'),
        ammoIconImage: new ig.Image('media/iconShotgun.png'),
        ammoIcon: null,
        shootCount: 0,
        init: function(ammo) {
            this.parent(ammo);
            this.addAnim('idle', 100, [0]);
            this.addAnim('shoot', 0.1, [1, 2, 0], true);
            this.ammoIcon = new tpf.HudTile(this.ammoIconImage, 0, 80, 42);
            this.ammoIcon.setPosition(50, 460)
            this.shootSound.volume = 0.6;
            this.reloadSound.volume = 0.4;
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
            ig.game.spawnEntity(EntityShotgunBullet, x, y, {
                angle: angle
            });
            this.currentAnim = this.anims.shoot.rewind();
            this.shootSound.play();
            if (this.shootCount === 5) {
                this.reloadSound.play();
                this.shootCout = 0;
            }
            this.flash(0.2);
            this.shootCount = this.shootCount + 1;
        }
    });
    EntityShotgunBullet = tpf.Entity.extend({
        checkAgainst: ig.Entity.TYPE.B,
        collides: ig.Entity.COLLIDES.NEVER,
        size: {
            x: 8,
            y: 8
        },
        speed: 550,
        scale: 0.25,
        bounciness: 0.0,
        minBounceVelocity: 0.0,
        blastSettings: {
            radius: 130,
            damage: 50
        },
        explosionParticles: 0,
        explosionRadius: 0,
        animSheet: new ig.AnimationSheet('media/shotgunbullet.png', 52, 36),
        explodeSound: new ig.Sound('media/sounds/explosion.*'),
        bounceSound: new ig.Sound('media/sounds/grenade-bounce.*'),
        dynamicLight: true,
        init: function(x, y, settings) {
            this.parent(x - this.size.x / 2, y - this.size.y / 3, settings);
            this.addAnim('idle', 0.05, [4, 0, 1, 2], true);
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
           /* if (this.currentAnim.loopCount > 0) {
                this.kill();
                return;
            }*/
            var zvel = this.vel.z;
            this.parent();
            if (zvel < 0 && this.vel.z > 0) {
                this.bounceSound.play();
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
            ig.game.spawnEntity(EntityShotBlastRadius, this.pos.x, this.pos.y, this.blastSettings);
            this.parent();
        }
    });
    ig.EntityPool.enableFor(EntityShotgunBullet);
    
    
    EntityShotBlastRadius = ig.Entity.extend({
        frame: 0,
        radius: 8,
        damage: 20,
        checkAgainst: ig.Entity.TYPE.B,
        init: function(x, y, settings) {
            var offset = settings.radius || this.radius;
            this.size.x = this.size.y = offset * 2;
            this.parent(x - offset, y - offset, settings);
        },
        update: function() {
            if (this.frame == 40) {
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
  ig.EntityPool.enableFor(EntityShotBlastRadius);
    
    
    
});