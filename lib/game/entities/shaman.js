ig.module(
	'game.entities.shaman'
)
.requires(
	'plugins.twopointfive.entity',
	'game.entities.particle',
	'plugins.astar'
)
.defines(function(){
	
	EntityShaman = tpf.Entity.extend({
	type: ig.Entity.TYPE.B,
	checkAgainst: ig.Entity.TYPE.NONE,
	collides: ig.Entity.COLLIDES.ACTIVE,

	size: {x: 50, y: 70},
	friction: {x: 100, y: 100},
	//vpos: tpf.Entity.ALIGN.BOTTOM,
	scale: 1,//0.25,

	health: 100,

	dynamicLight: false,

	shootTimer: null,
	shootWaitTimer: null,

	_wmBoxColor: '#ff0000',

	angle: 0,
	speed: 50,

	animSheet: new ig.AnimationSheet( 'media/sprites/shaman.png', 48, 64 ),
	animSheetDeath: new ig.AnimationSheet( 'media/sprites/shaman.png', 60, 64 ),

	//soundStance: new ig.Sound( 'media/sounds/enemies/shaman-stance.ogg' ),
	//soundDie: new ig.Sound( 'media/sounds/enemies/shaman-death.ogg' ),
	//soundAttack: new ig.Sound('media/sounds/enemies/shaman-throw.ogg'),
	//soundTeleOut: new ig.Sound( 'media/sounds/enemies/shaman-tele-out.ogg'),
	//soundTeleIn: new ig.Sound( 'media/sounds/enemies/shaman-tele-in.ogg'),

	currentPath: null,
	currentTarget: null,
	awoken: false,

	attacked: 0,
	attackCount: 0,
	maxAttackCount: 2,
	//hadPainAnim: false,

	//deadBodyEntity: EntityEnemyShamanDeadBody,
	//gibEntity: EntityShamanGib,
	//projectileEntity: EntityFireball,

	init: function( x, y, settings ) {
		this.parent( x, y, settings );

		this.addAnim( 'stance', 0.1, [0,1,2,3,4,5,6,7,8], true );
		this.addAnim( 'pain', 0.1, [20,20,3,4,5,6,7,8], true );
		this.addAnim( 'idle', 0.1, [9,10,11,12] );
		this.addAnim( 'attack', 0.15, [13,14,15,16,17,18,19], true );
		this.addAnim( 'teleOut', 0.1, [20,21,22,23,24,25,26,27,28,29], true );
		this.addAnim( 'teleIn', 0.1, [30,31,32,33,34,35,36], true );		

		if( /*settings.spawnedBy &&*/ this.distanceTo(ig.game.player) > 400 ) {
			this.awoken = true;
			this.currentAnim = this.anims.teleIn.rewind();
			//this.soundTeleIn.play();
		}
		if (this.distanceTo(ig.game.player) < 200) {
		      this.awoken = true;
		}
		else {
			this.setIdle(5);
		}
	},

	update: function() {
		if( this.currentAnim == this.anims.idle && this.idleTimer && this.idleTimer.delta() > 0 ) {
			this.currentAnim = this.anims.stance.rewind();
			if( this.awoken ) {
				//this.soundStance.play();
			}
			this.idleTimer = null;
		}
		else if( this.currentAnim == this.anims.pain ) {
			if( this.currentAnim.loopCount ) {

				// Stance or action?
				this.idleTimer = null;
				if( Math.random() > 0.5 ) {
					this.currentAnim = this.anims.stance.rewind();
					//this.soundStance.play();
				}
				else {
					this.setNextAction();
				}
			}
			this.currentAnim.update();
			this.updateQuad();
			return;
		}
		else if( this.currentAnim == this.anims.die ) {
			this.currentAnim.update();
			this.updateQuad();
			return;
		}


		// Stance finished - set next action or idle again
		if( this.currentAnim == this.anims.stance && this.currentAnim.loopCount ) {
			if( this.awoken ) {
				this.setNextAction();
			}
			else {
				this.setIdle(3);
			}
		}

		if( 
			!this.awoken && 
			(this.distanceTo(ig.game.player) > 96 || !this.canSee(ig.game.player))
		) {
			this.updateQuad();
			return;
		}

		this.awoken = true;

		if( this.currentAnim == this.anims.attack ) {
			this.handleAttack();
		}

		// Attack or tele in finished - back to idle
		if( 
			(this.currentAnim == this.anims.attack || this.currentAnim == this.anims.teleIn) && 
			this.currentAnim.loopCount 
		) {
			// immediate attack chance?
			if( Math.random() > 0.7 ) {
				this.setNextAction();
			}
			else {
				this.setIdle(1);
			}
		}

		// Tele out finished - set new position and tele in
		else if( this.currentAnim == this.anims.teleOut && this.currentAnim.loopCount ) {
			this.setTeleIn();
		}

		this.parent();
	},

	handleAttack: function() {
		if( !this.attacked && this.currentAnim.frame > 3 ) {
			// Attack anim done? Spawn fireball
			this.shoot();
			this.attacked = 1;
		}
	},

	shoot: function() {
		var aimAngle = this.angleTo( ig.game.player );
		var vx = this.pos.x + 3 + Math.cos(aimAngle) * 2;
		var vy = this.pos.y + 3 + Math.sin(aimAngle) * 2;
		ig.game.spawnEntity( EntityFireball, vx, vy, {angle: aimAngle} );
		//this.soundAttack.play();
	},

	setTeleIn: function() {
		this.currentAnim = this.anims.teleIn.rewind();
		//this.soundTeleIn.play();
		this.maxAttackCount = (Math.random() * 3 + 1)|0;
		this.attackCount = 0;

		var floorMap = ig.game.getMapByName('floor');
		var player = ig.game.player;
		var angleRange = (30).toRad();
		var angleInc = (11).toRad();
		for( var i = 0; i < 30; i++ ) {
			angleRange += angleInc;
			var angle = player.angle + Math.random() * angleRange - angleRange * 0.5;
			var distance = Math.random() * 88 + 84;
			if( this.teleportRelativeTo(player, floorMap, angle, distance) ) {
				return;
			}
		}
	},

	teleportRelativeTo: function( ent, map, angle, distance ) {

		var tx = ent.pos.x + -Math.sin(angle) * distance,
			ty = ent.pos.y + -Math.cos(angle) * distance;

		// center on tile
		tx = ((tx / map.tilesize)|0) * map.tilesize + map.tilesize * 0.5 - 3;
		ty = ((ty / map.tilesize)|0) * map.tilesize + map.tilesize * 0.5 - 3;

		// outside the map?
		if( !map.getTile(tx, ty) ) { return false; }

		// can see entity from there?
		var res = ig.game.collisionMap.trace( 
			tx, ty, ent.pos.x+4 - tx, ent.pos.y+4 - ty, 2, 2
		);

		if( res.collision.x || res.collision.y ) { return false; }

		// all good; set new position
		this.pos.x = tx;
		this.pos.y = ty;
		this.updateQuad();
		return true;
	},

	setNextAction: function() {
		// Max attack for this presence reached? Tele out.
		if( this.attackCount > this.maxAttackCount ) {
			this.currentAnim = this.anims.teleOut.rewind();
			//this.soundTeleOut.play();
			return;
		}

		if( this.canSee(ig.game.player) ) {
			// We have a line of sight and are close enough > attack
			this.currentAnim = this.anims.attack.rewind();
			this.attacked = 0;
			this.attackCount++;
		}
		else {
			// No sight; tele out
			this.currentAnim = this.anims.teleOut.rewind();
			//this.soundTeleOut.play();
		}
	},

	setIdle: function( randomDuration ) {
		this.currentAnim = this.anims.idle.rewind();
		this.idleTimer = new ig.Timer( randomDuration * Math.random() + 1 );
	},

	receiveDamage: function( amount, from ) {
		if( this.currentAnim == this.anims.teleOut ) {
			// Don't take damage while teleporting out
			return;
		}

		this.awoken = true;
		this.health -= amount;
		this.vel.x = 0;
		this.vel.y = 0;
		if( this.health <= 0 ) {
			var shift = 0;
			var x = this.pos.x + Math.cos(this.angle) * shift,
				y = this.pos.y + Math.sin(this.angle) * shift;
			ig.game.spawnEntity(EntityEnemyShamanDeadBody, x, y);
			this.kill();
			//this.soundDie.play();
		}
		else if( this.health < 30 && !this.hadPainAnim ) {
			this.currentAnim = this.anims.pain.rewind();
			this.hadPainAnim = true;
		}
		
		var cx = this.pos.x + this.size.x/2;
		var cy = this.pos.y + this.size.y/2;
		var gibs = Math.ceil(amount / 3);
		for( var i = 0; i < gibs; i++ ) {
			//ig.game.spawnEntity( this.gibEntity, cx, cy );
		}
	}
});
	
	ig.EntityPool.enableFor(EntityShaman);
	
EntityEnemyShamanDeadBody = tpf.Entity.extend({
	//vpos: tpf.Entity.ALIGN.BOTTOM,
	size: {x: 68, y: 92},
	scale: 1,
	dynamicLight: true,

	animSheet: new ig.AnimationSheet( 'media/sprites/shaman.png', 60, 64 ),

	init: function( x, y, settings ) {
		this.parent( x, y, settings );
		this.addAnim( 'die', 0.1, [32,33,33,34,35,36,37,38,39], true );
	},

	update: function() {
		this.currentAnim.update();
		this.updateQuad();
	}
});

EntityShamanGib = EntityParticle.extend({
	vpos: 0,
	scale: 0.25,
	vel: {x: 68, y: 92},
	friction: {x: 10, y: 10},
	gravity: 50,
	
	lifetime: 3,
	fadetime: 0.25,
	
	animSheet: new ig.AnimationSheet( 'media/sprites/shaman-gibs.png', 8, 8 ),
	
	init: function( x, y, settings ) {
		this.addAnim( 'idle', 5, [0,1,2,3] );
		this.parent( x, y, settings );
	}
});

var st = function() {
var trace = '';
	try{ arst; } catch(e) {
		trace = e.stack;
	}
	return trace;
}

EntityFireball = tpf.Entity.extend({
	type: ig.Entity.TYPE.NONE,
	checkAgainst: ig.Entity.TYPE.A,
	collides: ig.Entity.COLLIDES.NEVER,

	size: {x: 10, y: 10},
	maxVel: {x:300, y:300},
	
	vpos: 0,
	gravity: 0,
	zvel: 0,

	scale: 0.90,
	angle: 0,
	speed: 400,
	damage: 50,
	startZ: 1.5,
	startZVel: 10,

	dynamicLight: true,
	_wmIgnore: true,

	animSheet: new ig.AnimationSheet( 'media/sprites/shaman-fireball.png', 8, 8 ),

	init: function( x, y, settings ) {
		this.parent( x, y, settings );

		this.vel.x = Math.cos(this.angle) * this.speed;
		this.vel.y = Math.sin(this.angle) * this.speed;

		this.addAnim( 'idle', 0.1, [0,1,2,3] );
		if( !ig.global.wm ) {
			this.floor = this.tile.quad.position[1];
			this.tile.quad.position[1] = this.startZ;
			this.zvel = this.startZVel;
		}
	},

	reset: function( x, y, settings ) {
		this.tile.quad.position[1] = this.startZ;
		this.zvel = this.startZVel;
		
		this.parent(x,y,settings);
		
		this.vel.x = Math.cos(this.angle) * this.speed;
		this.vel.y = Math.sin(this.angle) * this.speed;
	},

	handleMovementTrace: function( res ) {
		this.parent( res );
		if( res.collision.x || res.collision.y ) {
			this.kill();
		}
	},

	updateQuad: function() {
		this.zvel -= this.gravity * ig.system.tick;
		
		var nz = this.tile.quad.position[1] + this.zvel * ig.system.tick;
		/*if( nz < this.floor ) {
			this.kill();
			return;
		}*/
		this.tile.quad.position[1] = nz;
		this.tile.quad._dirty = true;

		this.parent();
	},


	check: function( other ) {
		other.receiveDamage( this.damage, this );
		this.kill();
	}
});

ig.EntityPool.enableFor(EntityFireball);



/*EntityEnemyShaman = tpf.Entity.extend({
	type: ig.Entity.TYPE.B,
	checkAgainst: ig.Entity.TYPE.NONE,
	collides: ig.Entity.COLLIDES.ACTIVE,

	size: {x: 8, y: 8},
	friction: {x: 100, y: 100},
	//vpos: tpf.Entity.ALIGN.BOTTOM,
	scale: 0.25,

	health: 50,

	dynamicLight: true,

	shootTimer: null,
	shootWaitTimer: null,

	_wmBoxColor: '#ff0000',

	angle: 0,
	speed: 30,

	animSheet: new ig.AnimationSheet( 'media/sprites/shaman.png', 48, 64 ),
	animSheetDeath: new ig.AnimationSheet( 'media/sprites/shaman.png', 60, 64 ),

	soundStance: new ig.Sound( 'media/sounds/enemies/shaman-stance.ogg' ),
	soundDie: new ig.Sound( 'media/sounds/enemies/shaman-death.ogg' ),
	soundAttack: new ig.Sound('media/sounds/enemies/shaman-throw.ogg'),
	soundTeleOut: new ig.Sound( 'media/sounds/enemies/shaman-tele-out.ogg'),
	soundTeleIn: new ig.Sound( 'media/sounds/enemies/shaman-tele-in.ogg'),

	currentPath: null,
	currentTarget: null,
	awoken: false,

	attacked: 0,
	attackCount: 0,
	maxAttackCount: 1,
	hadPainAnim: false,

	deadBodyEntity: EntityEnemyShamanDeadBody,
	gibEntity: EntityShamanGib,
	projectileEntity: EntityFireball,

	init: function( x, y, settings ) {
		this.parent( x, y, settings );

		this.addAnim( 'stance', 0.1, [0,1,2,3,4,5,6,7,8], true );
		this.addAnim( 'pain', 0.1, [20,20,3,4,5,6,7,8], true );
		this.addAnim( 'idle', 0.1, [9,10,11,12] );
		this.addAnim( 'attack', 0.15, [13,14,15,16,17,18,19], true );
		this.addAnim( 'teleOut', 0.1, [20,21,22,23,24,25,26,27,28,29], true );
		this.addAnim( 'teleIn', 0.1, [30,31,32,33,34,35,36], true );		

		if( settings.spawnedBy ) {
			this.awoken = true;
			this.currentAnim = this.anims.teleIn.rewind();
			this.soundTeleIn.play();
		}
		else {
			this.setIdle(3);
		}
	},

	update: function() {
		if( this.currentAnim == this.anims.idle && this.idleTimer && this.idleTimer.delta() > 0 ) {
			this.currentAnim = this.anims.stance.rewind();
			if( this.awoken ) {
				this.soundStance.play();
			}
			this.idleTimer = null;
		}
		else if( this.currentAnim == this.anims.pain ) {
			if( this.currentAnim.loopCount ) {

				// Stance or action?
				this.idleTimer = null;
				if( Math.random() > 0.5 ) {
					this.currentAnim = this.anims.stance.rewind();
					this.soundStance.play();
				}
				else {
					this.setNextAction();
				}
			}
			this.currentAnim.update();
			this.updateQuad();
			return;
		}
		else if( this.currentAnim == this.anims.die ) {
			this.currentAnim.update();
			this.updateQuad();
			return;
		}


		// Stance finished - set next action or idle again
		if( this.currentAnim == this.anims.stance && this.currentAnim.loopCount ) {
			if( this.awoken ) {
				this.setNextAction();
			}
			else {
				this.setIdle(3);
			}
		}

		if( 
			!this.awoken && 
			(this.distanceTo(ig.game.player) > 96 || !this.canSee(ig.game.player))
		) {
			this.updateQuad();
			return;
		}

		this.awoken = true;

		if( this.currentAnim == this.anims.attack ) {
			this.handleAttack();
		}

		// Attack or tele in finished - back to idle
		if( 
			(this.currentAnim == this.anims.attack || this.currentAnim == this.anims.teleIn) && 
			this.currentAnim.loopCount 
		) {
			// immediate attack chance?
			if( Math.random() > 0.7 ) {
				this.setNextAction();
			}
			else {
				this.setIdle(1);
			}
		}

		// Tele out finished - set new position and tele in
		else if( this.currentAnim == this.anims.teleOut && this.currentAnim.loopCount ) {
			this.setTeleIn();
		}

		this.parent();
	},

	handleAttack: function() {
		if( !this.attacked && this.currentAnim.frame > 3 ) {
			// Attack anim done? Spawn fireball
			this.shoot();
			this.attacked = 1;
		}
	},

	shoot: function() {
		var aimAngle = this.angleTo( ig.game.player );
		var vx = this.pos.x + 3 + Math.cos(aimAngle) * 2;
		var vy = this.pos.y + 3 + Math.sin(aimAngle) * 2;
		ig.game.spawnEntity( this.projectileEntity, vx, vy, {angle: aimAngle} );
		this.soundAttack.play();
	},

	setTeleIn: function() {
		this.currentAnim = this.anims.teleIn.rewind();
		this.soundTeleIn.play();
		this.maxAttackCount = (Math.random() * 3 + 1)|0;
		this.attackCount = 0;

		var floorMap = ig.game.getMapByName('floor');
		var player = ig.game.player;
		var angleRange = (30).toRad();
		var angleInc = (11).toRad();
		for( var i = 0; i < 30; i++ ) {
			angleRange += angleInc;
			var angle = player.angle + Math.random() * angleRange - angleRange * 0.5;
			var distance = Math.random() * 48 + 24;
			if( this.teleportRelativeTo(player, floorMap, angle, distance) ) {
				return;
			}
		}
	},

	teleportRelativeTo: function( ent, map, angle, distance ) {

		var tx = ent.pos.x + -Math.sin(angle) * distance,
			ty = ent.pos.y + -Math.cos(angle) * distance;

		// center on tile
		tx = ((tx / map.tilesize)|0) * map.tilesize + map.tilesize * 0.5 - 3;
		ty = ((ty / map.tilesize)|0) * map.tilesize + map.tilesize * 0.5 - 3;

		// outside the map?
		if( !map.getTile(tx, ty) ) { return false; }

		// can see entity from there?
		var res = ig.game.collisionMap.trace( 
			tx, ty, ent.pos.x+4 - tx, ent.pos.y+4 - ty, 2, 2
		);

		if( res.collision.x || res.collision.y ) { return false; }

		// all good; set new position
		this.pos.x = tx;
		this.pos.y = ty;
		this.updateQuad();
		return true;
	},

	setNextAction: function() {
		// Max attack for this presence reached? Tele out.
		if( this.attackCount > this.maxAttackCount ) {
			this.currentAnim = this.anims.teleOut.rewind();
			this.soundTeleOut.play();
			return;
		}

		if( this.canSee(ig.game.player) ) {
			// We have a line of sight and are close enough > attack
			this.currentAnim = this.anims.attack.rewind();
			this.attacked = 0;
			this.attackCount++;
		}
		else {
			// No sight; tele out
			this.currentAnim = this.anims.teleOut.rewind();
			this.soundTeleOut.play();
		}
	},

	setIdle: function( randomDuration ) {
		this.currentAnim = this.anims.idle.rewind();
		this.idleTimer = new ig.Timer( randomDuration * Math.random() + 1 );
	},

	receiveDamage: function( amount, from ) {
		if( this.currentAnim == this.anims.teleOut ) {
			// Don't take damage while teleporting out
			return;
		}

		this.awoken = true;
		this.health -= amount;
		this.vel.x = 0;
		this.vel.y = 0;
		if( this.health <= 0 ) {
			var shift = 0;
			var x = this.pos.x + Math.cos(this.angle) * shift,
				y = this.pos.y + Math.sin(this.angle) * shift;
			ig.game.spawnEntity(this.deadBodyEntity, x, y);
			this.kill();
			this.soundDie.play();
		}
		else if( this.health < 30 && !this.hadPainAnim ) {
			this.currentAnim = this.anims.pain.rewind();
			this.hadPainAnim = true;
		}
		
		var cx = this.pos.x + this.size.x/2;
		var cy = this.pos.y + this.size.y/2;
		var gibs = Math.ceil(amount / 3);
		for( var i = 0; i < gibs; i++ ) {
			ig.game.spawnEntity( this.gibEntity, cx, cy );
		}
	}
});
*/



});