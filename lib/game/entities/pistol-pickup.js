ig.baked = true;
ig.module('game.entities.pistol-pickup').requires('plugins.twopointfive.entity', 'game.weapons.pistol').defines(function() {
    EntityPistolPickup = tpf.Entity.extend({
        checkAgainst: ig.Entity.TYPE.A,
        size: {
            x: 16,
            y: 16
        },
        vpos: 0.5,
        scale: 0.5,
        amount: 24,
        gravityFactor: 0,
        dynamicLight: true,
        _wmBoxColor: '#55ff00',
        animSheet: new ig.AnimationSheet('media/pickupPistol.png', 32, 32),
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
            ig.game.player.giveWeapon(WeaponPistol, 50);
            other.giveAmmo(WeaponPistol, this.amount);
            this.pickupSound.play();
            this.kill();
        }
    });
});