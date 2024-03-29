ig.baked = true;
ig.module('game.entities.player').requires('plugins.twopointfive.entity', 'plugins.mouse-delta', 'game.weapons.grenade-launcher', 'game.weapons.fists', 'game.weapons.pistol', 'game.weapons.shotgun').defines(function() {
    EntityPlayer = tpf.Entity.extend({
        type: ig.Entity.TYPE.A,
        collides: ig.Entity.COLLIDES.PASSIVE,
        size: {
            x: 32,
            y: 32
        },
        angle: 0,
        internalAngle: 0,
        turnSpeed: (120).toRad(),
        moveSpeed: 225,
        bob: 0,
        bobSpeed: 0.1,
        bobHeight: 0.8,
        objective: "Try to find a way to the next level",
        health: 100,
        maxHealth: 100,
        weapons: [],
        currentWeapon: null,
        currentWeaponIndex: -1,
        delayedWeaponSwitchIndex: -1,
        currentLightColor: {
            r: 1,
            g: 1,
            b: 1,
            a: 1
        },
        god: false,
        hurtSounds: [new ig.Sound('media/sounds/hurt1.*'), new ig.Sound('media/sounds/hurt2.*'), new ig.Sound('media/sounds/hurt3.*')],
        init: function(x, y, settings) {
            this.parent(x, y, settings);
            this.internalAngle = this.angle;
            ig.game.player = this;
        },
        ready: function() {
            var cx = this.pos.x + this.size.x / 2,
            cy = this.pos.y + this.size.y / 2;
            ig.system.camera.position[0] = cx;
            ig.system.camera.position[2] = cy;
        },
        update: function() {
            var dx = 0,
            dy = 0;
            if (ig.input.state('forward')) {
                dy = 1;
            }
            else if (ig.input.state('back')) {
                dy = -1;
            }
            if (ig.system.isFullscreen || ig.system.hasMouseLock) {
                this.internalAngle -= ig.input.mouseDelta.x / 400;
            }
            if (ig.input.state('left')) {
                this.internalAngle += this.turnSpeed * ig.system.tick;
            }
            else if (ig.input.state('right')) {
                this.internalAngle -= this.turnSpeed * ig.system.tick;
            }
            if (ig.input.state('stepleft')) {
                dx = 1;
            }
            else if (ig.input.state('stepright')) {
                dx = -1;
            }
            if (ig.game.touchFieldMove) {
                var fi = ig.game.touchFieldMove.input;
                dx = -(fi.x / 60).limit( - 1, 1);
                dy = -(fi.y / 60).limit( - 1, 1);
            }
            if (ig.game.touchFieldTurn) {
                var fi = ig.game.touchFieldTurn.input;
                this.internalAngle += fi.dx / 100;
            }
            var running = ig.input.state('run') || ig.ua.mobile;
            var speed = this.moveSpeed;
            var trackerRotation = ig.system.tracker ? ig.system.tracker.getRotation() : [0, 0, 0];
            this.angle = this.internalAngle + trackerRotation[0];
            if (Math.abs(dx) + Math.abs(dy) > 1) {
                dx *= Math.SQRT1_2;
                dy *= Math.SQRT1_2;
            }
            this.vel.x = -Math.sin(this.angle) * dy * this.moveSpeed
            - Math.sin(this.angle + Math.PI / 2) * dx * this.moveSpeed;
            this.vel.y = -Math.cos(this.angle) * dy * this.moveSpeed
            - Math.cos(this.angle + Math.PI / 2) * dx * this.moveSpeed;
            if (this.currentWeapon && (ig.input.state('shoot') || (!ig.ua.mobile && ig.input.state('click')))) {
                var sx = this.pos.x + this.size.x / 2 - Math.sin(this.angle) * 3;
                sy = this.pos.y + this.size.y / 2 - Math.cos(this.angle) * 3;
                if (!this.currentWeapon.depleted()) {
                    this.currentWeapon.trigger(sx, sy, this.angle);
                }
                else {
                    this.switchToNextNonEmptyWeapon();
                }
            }
            if (this.delayedWeaponSwitchIndex >= 0) {
                this.switchWeapon(this.delayedWeaponSwitchIndex);
            }
            if (ig.input.pressed('weaponNext') && this.weapons.length > 1) {
                this.switchWeapon((this.currentWeaponIndex + 1) % this.weapons.length);
            }
            else if (ig.input.pressed('weaponPrev') && this.weapons.length > 1) {
                var index = (this.currentWeaponIndex == 0) ? this.weapons.length - 1: this.currentWeaponIndex - 1;
                this.switchWeapon(index);
            }
            this.parent();
            this.bob += ig.system.tick * this.bobSpeed * Math.min(Math.abs(dx) + Math.abs(dy), 1) * speed;
            var bobOffset = Math.sin(this.bob) * this.bobHeight;
            if (this.currentWeapon) {
                this.currentWeapon.bobOffset = Math.sin(this.bob + Math.PI / 2) * this.bobHeight * 4;
                this.currentWeapon.update();
            }
            var cx = this.pos.x + this.size.x / 2,
            cy = this.pos.y + this.size.y / 2;
            ig.system.camera.setRotation(trackerRotation[2], trackerRotation[1], this.angle);
            ig.system.camera.setPosition(cx, cy, bobOffset);
        },
        receiveDamage: function(amount, from) {
            if (this.god || this._killed) {
                return;
            }
            var a = (this.angle + this.angleTo(from)) % (Math.PI * 2);
            a += a < 0 ? Math.PI: -Math.PI;
            var xedge = ig.game.hud.width / 2;
            var ypos = a < 0 ? ig.game.hud.height / 2: 0;
            var xpos = Math.abs(a).map(0, Math.PI, -xedge, xedge);
            ig.game.hud.showDamageIndicator(xpos, ypos, 1);
            this.hurtSounds.random().play();
            this.parent(amount, from);
        },
        kill: function() {
            ig.game.hud.showMessage('Game Over', tpf.Hud.TIME.PERMANENT);
            ig.game.showDeathAnim();
            this.parent();
        },
        giveWeapon: function(weaponClass, ammo) {
            var index = -1;
            for (var i = 0; i < this.weapons.length; i++) {
                var w = this.weapons[i];
                if (w instanceof weaponClass) {
                    index = i;
                    w.giveAmmo(ammo);
                }
            }
            if (index === -1) {
                this.weapons.push(new weaponClass(ammo));
                index = this.weapons.length - 1;
            }
            this.switchWeapon(index);
        },
        giveAmmo: function(weaponClass, ammo) {
            for (var i = 0; i < this.weapons.length; i++) {
                var w = this.weapons[i];
                if (w instanceof weaponClass) {
                    w.giveAmmo(ammo);
                }
            }
        },
        giveHealth: function(amount) {
            if (this.health >= this.maxHealth) {
                return false;
            }
            this.health = Math.min(this.health + amount, this.maxHealth);
            return true;
        },
        switchWeapon: function(index) {
            if (this.currentWeapon) {
                if (this.currentWeapon.shootTimer.delta() < 0) {
                    this.delayedWeaponSwitchIndex = index;
                    return;
                }
            }
            this.delayedWeaponSwitchIndex = -1;
            this.currentWeaponIndex = index;
            this.currentWeapon = this.weapons[index];
            if (this.currentWeapon.ammoIcon) {
                this.currentWeapon.ammoIcon.setPosition(215, ig.game.hud.height - this.currentWeapon.ammoIcon.tileHeight - 6);
            }
            this.currentWeapon.setLight(this.currentLightColor);
        },
        switchToNextNonEmptyWeapon: function() {
            for (var i = this.currentWeaponIndex + 1; i < this.weapons.length; i++) {
                if (!this.weapons[i].depleted()) {
                    this.switchWeapon(i);
                    this.currentWeapon.shootTimer.set(0.5);
                    return;
                }
            }
            for (var i = 0; i < this.currentWeaponIndex; i++) {
                if (!this.weapons[i].depleted()) {
                    this.switchWeapon(i);
                    this.currentWeapon.shootTimer.set(0.5);
                    return;
                }
            }
        },
        setLight: function(color) {
            this.currentLightColor = color;
            if (this.currentWeapon) {
                this.currentWeapon.setLight(color);
            }
        }
    });
});