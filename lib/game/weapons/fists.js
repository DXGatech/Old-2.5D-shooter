ig.baked = true;
ig.module('game.weapons.fists').requires('game.weapons.base', 'plugins.twopointfive.entity', 'impact.entity-pool').defines(function() {
    WeaponFists = Weapon.extend({
        offset: {
            x: 0,
            y: 365
        },
        maxAmmo: 100,
        punchSound: new ig.Sound('media/sounds/punch.*'),
        cooldown: 0.3,
        shootAnim: 1,
        animSheet: new ig.AnimationSheet('media/fistBullet.png', /*1100*/0, /*306*/0),
        ammoIconImage: new ig.Image('media/iconFist.png'),
        ammoIcon: null,
        weaponName: "Fist",
        init: function(ammo) {
            this.punchSound.volume = 0.4;
            this.parent(ammo);
            this.addAnim('idle', 100, [0]);
            //this.addAnim('shoot1', 0.1, [1, 1, 0], true);
            //this.addAnim('shoot2', 0.1, [2, 2, 0], true);
            this.ammoIcon = new tpf.HudTile(this.ammoIconImage, 0, 46, 46);
            this.ammoIcon.setPosition(50, 460)
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
            this.ammo = 100;
            this.punchSound.play();
            ig.game.spawnEntity(EntityFistBullet, x, y, {
                angle: angle
            });
            /*if (this.shootAnim === 1) {
                this.currentAnim = this.anims.shoot1.rewind();
                this.shootAnim = 2;
            } else {
                this.currentAnim = this.anims.shoot2.rewind();
                this.shootAnim = 1;
            }*/
        }
    });
    EntityFistBullet = tpf.Entity.extend({
        checkAgainst: ig.Entity.TYPE.B,
        collides: ig.Entity.COLLIDES.ACTIVE,
        size: {
            x: 32,
            y: 32
        },
        speed: 50,
        scale: 0.25,
        bounciness: 0,
        minBounceVelocity: 0.5,
        blastSettings: {
            radius: 65,
            damage: 5
        },
        explosionParticles: 0,
        explosionRadius: 0,
        animSheet: new ig.AnimationSheet('media/fistBullet.png', 32, 32),
        dynamicLight: true,
        init: function(x, y, settings) {
            this.parent(x - this.size.x / 2, y - this.size.y / 2, settings);
            this.addAnim('idle', 1, [0]);
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
            this.kill();
            this.parent();
        },
        check: function(other) {
            this.kill();
        },
        collideWith: function(other, axis) {
            if (other instanceof EntityPlayer) {
                if (other.pos.x > this.pos.x) {
                    other.vel.x = 500;
                    other.vel.y = 500;
                }
                else {
                    other.vel.x = -500;
                    other.vel.y = -500;
                }
            }
        },
        handleMovementTrace: function(res) {
            this.parent(res);
        },
        kill: function() {
            ig.game.spawnEntity(EntityFistBlast, this.pos.x, this.pos.y, this.blastSettings);
            this.parent();
        }
    });
    ig.EntityPool.enableFor(EntityFistBullet);
    EntityFistBlast = ig.Entity.extend({
        frame: 0,
        radius: 8,
        damage: 15,
        checkAgainst: ig.Entity.TYPE.B,
        type: ig.Entity.TYPE.A,
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
});