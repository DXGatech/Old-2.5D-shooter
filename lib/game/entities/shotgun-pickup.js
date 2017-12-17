ig.baked = true;
ig.module('game.entities.shotgun-pickup').requires('plugins.twopointfive.entity', 'game.weapons.shotgun').defines(function() {
    EntityShotgunPickup = tpf.Entity.extend({
        checkAgainst: ig.Entity.TYPE.A,
        size: {
            x: 16,
            y: 16
        },
        vpos: 0.5,
        scale: 0.5,
        amount: 12,
        gravityFactor: 0,
        dynamicLight: true,
        _wmBoxColor: '#55ff00',
        animSheet: new ig.AnimationSheet('media/pickupShotgun.png', 62, 32),
        pickupSound: new ig.Sound('media/sounds/health-pickup.*'),
        bounceTimer: null,
        init: function(x, y, settings) {
            this.parent(x, y, settings);
            this.addAnim('idle', 10, [0]);
            this.bounceTimer = new ig.Timer();
        },
        update: function() {
            this.pos.z = (Math.cos(this.bounceTimer.delta() * 3) + 1) * 3;
            this.parent();
        },
        check: function(other) {
             ig.game.player.giveWeapon(WeaponShotgun, 100);
            other.giveAmmo(WeaponShotgun, this.amount);
            this.pickupSound.play();
            this.kill();
        }
    });
});