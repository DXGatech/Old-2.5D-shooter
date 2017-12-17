ig.module(
	'game.entities.enemy-vinebacker'
)
.requires(
	'plugins.twopointfive.entity',
	'game.entities.particle',
	'plugins.astar'
)
.defines(function(){

EntityEnemyVinebacker = tpf.Entity.extend({
	type: ig.Entity.TYPE.B,
	checkAgainst: ig.Entity.TYPE.A,
	collides: ig.Entity.COLLIDES.ACTIVE,

	size: {x: 64, y: 64},
	friction: {x: 0, y: 0},
	//vpos: tpf.Entity.ALIGN.BOTTOM,
	scale: 0.25,

	health: 200,

	dynamicLight: true,

	shootTimer: null,
	shootWaitTimer: null,

	_wmBoxColor: '#ff0000',

	angle: 0,
	speed: 30,

	animSheet: new ig.AnimationSheet( 'media/sprites/vinebacker.png', 64, 64 ),
	
	/*soundSmash: new ig.Sound( 'media/sounds/enemies/vinebacker-smash.ogg'),
	soundMelee: new ig.Sound( 'media/sounds/enemies/vinebacker-melee.ogg'),
	soundDie: new ig.Sound( 'media/sounds/enemies/vinebacker-die.ogg'),
	soundPain: new ig.Sound( 'media/sounds/enemies/vinebacker-pain.ogg'),*/

	currentPath: null,
	currentTarget: null,
	awoken: false,

	gaveDamage: false,
	painAnimPlayed: false,
	rangeAttackCount: 0,
	rangeAttackCountMax: 3,

	init: function( x, y, settings ) {
		this.parent( x, y, settings );

		this.addAnim( 'idle', 0.2, [0,0,1,2,2,1] );
		this.addAnim( 'run', 0.15, [4,5,6,7] );
		this.addAnim( 'smash', 0.15, [8,9,10,11,11,8], true );
		this.addAnim( 'melee', 0.15, [12,13,14,15], true );
		this.addAnim( 'die', 0.2, [16,17,18,18,18,18], true );
		this.addAnim( 'pain', 0.25, [16,16,16,0,1], true );
	},

	update: function() {
		var distanceToPlayer = this.distanceTo(ig.game.player);
		
		if( 
			this.currentAnim == this.anims.idle && 
			!this.awoken && 
			(distanceToPlayer > 96 || !this.canSee(ig.game.player))
		) {
			this.updateQuad();
			return;
		}

		if( this.currentAnim == this.anims.die ) {
			if( this.currentAnim.frame > 3 && !this.spawnedVines ) {
				// this.spawnedVines = true;
				var spawnRadius = 7;
				x = this.pos.x + this.size.x/2 + (Math.random() * spawnRadius * 2) - spawnRadius;
				y = this.pos.y + this.size.y/2 + (Math.random() * spawnRadius * 2) - spawnRadius;
				ig.game.spawnEntity(EntityVine, x, y);
			}
			if( this.currentAnim.loopCount ) {
				this.kill();
			}
		}
		else if( this.currentAnim == this.anims.pain ) {
			if( this.currentAnim.loopCount ) {
				this.currentAnim = this.anims.idle;
			}
		}
 		
		// idle
		else if( this.currentAnim == this.anims.idle && this.currentAnim.loopCount ) {
			if( distanceToPlayer < 96 || this.awoken ) {
				this.currentAnim = this.anims.run;
				if( !this.awoken ) { 
					//this.soundPain.play();
				}
				this.awoken = true;
			}
		}
		else if( this.currentAnim == this.anims.run && distanceToPlayer < 48 ) {
			if( distanceToPlayer < 20 ) {
				this.rangeAttackCount = 0;
				this.unsetPath();
				this.currentAnim = this.anims.melee.rewind();
				//this.soundMelee.play();
				this.vel.x = 0;
				this.vel.y = 0;
			}
			else if( 
				this.canSee(ig.game.player) &&
				this.rangeAttackCount < this.rangeAttackCountMax 
			) {
				this.rangeAttackCount++;

				// We have a line of sight and are close enough > smash
				this.currentAnim = this.anims.smash.rewind();
				//this.soundSmash.play();
				this.unsetPath();
				this.vel.x = 0;
				this.vel.y = 0;
			}
		}

		// Smash
		if( this.currentAnim == this.anims.smash ) {
			if( this.currentAnim.loopCount ) {
				this.currentAnim = this.anims.idle.rewind();
				this.spawnedVines = false;
			}
			else if( !this.spawnedVines && this.currentAnim.frame >= 3 ) {
				this.spawnedVines = true;

				var vineAngle = this.angleTo( ig.game.player );
				var vx = this.pos.x + 4 + Math.cos(vineAngle) * 6;
				var vy = this.pos.y + 4 + Math.sin(vineAngle) * 6;
				ig.game.spawnEntity( EntityVineSpawner, vx, vy, {angle: vineAngle} );

				ig.game.setScreenShake(3);
			}
		}

		// Melee
		if( this.currentAnim == this.anims.melee ) {
			if( this.currentAnim.frame < 2 ) {
				this.angle = this.angleTo( ig.game.player );

				this.vel.x = Math.cos(this.angle) * this.speed/8;
				this.vel.y = Math.sin(this.angle) * this.speed/8;
				this.gaveDamage = false;
			}
			else {
				this.vel.x = 0;
				this.vel.y = 0;
			}
			
			if( !this.gaveDamage && this.currentAnim.frame == 2 && distanceToPlayer < 20 ) {
				this.gaveDamage = true;
				ig.game.player.receiveDamage(20, this);
			}

			if( this.currentAnim.loopCount ) {
				this.currentAnim = this.anims.idle.rewind();
			}
		}

		// running
		if( this.currentAnim == this.anims.run ) {
			if( !this.currentTarget ) {
				this.setNextTarget();
			}

			if( !this.currentTarget ) {
				this.currentAnim = this.anims.idle;
			}
			else {
				// this.angle = this.angleTo( ig.game.player );
				if( this.distanceTo(this.currentTarget) < 8 ) {
					this.setNextTarget();
				}
				this.angle = this.angleTo( this.currentTarget );

				this.vel.x = Math.cos(this.angle) * this.speed;
				this.vel.y = Math.sin(this.angle) * this.speed;
			}
		}

		this.parent();
	},

	unsetPath: function() {
		this.currentPath = this.currentTarget = null;
	},

	setPath: function() {
		this.currentPath = ig.game.pathfinder.getPath(
			this.pos.x + this.size.x/2,
			this.pos.y + this.size.y/2,
			ig.game.player.pos.x,
			ig.game.player.pos.y
		);
	},

	setNextTarget: function() {
		if( !this.currentPath || !this.currentPath.length) {
			this.setPath();
		}

		if( !this.currentPath.length ) {
			return;
		}

		var p = this.currentPath.shift();
		this.currentTarget = {pos:{x: p.x, y: p.y}, size:{x:0, y:0}};
	},

	receiveDamage: function( amount, from ) {
		this.awoken = true;

		this.health -= amount;
		this.vel.x = 0;
		this.vel.y = 0;
		if( this.health <= 0 ) {
			this.currentAnim = this.anims.die.rewind();
			//this.soundDie.play();
			this.collides = ig.Entity.COLLIDES.NEVER;
			this.type = ig.Entity.TYPE.NONE;
			this.spawnedVines = false;
		}
		else if( this.health < 30 && !this.painAnimPlayed ) {
			this.painAnimPlayed = true;
			//this.soundPain.play();
			this.currentAnim = this.anims.pain.rewind();
		}

		
		var cx = this.pos.x + this.size.x/2;
		var cy = this.pos.y + this.size.y/2;
		var gibs = Math.ceil(amount / 3);
		for( var i = 0; i < gibs; i++ ) {
			ig.game.spawnEntity( EntityVineGib, cx, cy );
		}
	}
});


EntityVineSpawner = tpf.Entity.extend({
	size: {x: 1, y: 1},
	friction: {x: 0, y: 0},

	dynamicLight: false,
	_wmIgnore: true,

	angle: 0,
	speed: 50,
	spawnRadius: 5,

	checkAgainst: ig.Entity.TYPE.A,
	gaveDamage: false,
	damage: 20,

	init: function( x, y, settings ) {
		this.parent( x, y, settings );

		this.liveTimer = new ig.Timer(1.8);
		this.spawnTimer = new ig.Timer(0.05);
	},

	update: function() {
		if( this.liveTimer.delta() > 0 ) {
			this.kill();
			return;
		}

		this.vel.x = Math.cos(this.angle) * this.speed;
		this.vel.y = Math.sin(this.angle) * this.speed;

		this.parent();


		if( this.spawnTimer.delta() > 0 ) {

			this.spawnTimer.reset();
			var x = this.pos.x + (Math.random() * this.spawnRadius * 2) - this.spawnRadius;
			var y = this.pos.y + (Math.random() * this.spawnRadius * 2) - this.spawnRadius;
			ig.game.spawnEntity(EntityVine, x, y);

			x = this.pos.x + (Math.random() * this.spawnRadius * 2) - this.spawnRadius;
			y = this.pos.y + (Math.random() * this.spawnRadius * 2) - this.spawnRadius;
			ig.game.spawnEntity(EntityVine, x, y);
		}
	},

	check: function( other ) {
		if( this.gaveDamage ) {
			return;
		}
		this.gaveDamage = true;
		other.receiveDamage(this.damage, this);
	}
});

EntityVine = tpf.Entity.extend({
	type: ig.Entity.TYPE.NONE,
	checkAgainst: ig.Entity.TYPE.NONE,
	collides: ig.Entity.COLLIDES.NEVER,

	size: {x: 1, y: 1},
	vpos: 0,
	scale: 0.25,

	dynamicLight: true,
	_wmIgnore: true,

	animSheet: new ig.AnimationSheet( 'media/sprites/vines.png', 32, 32 ),

	init: function( x, y, settings ) {
		this.parent( x, y, settings );
		this.anims = [
			new ig.Animation( this.animSheet, 0.1, [0,5,10,15,15,10,5,0] ),
			new ig.Animation( this.animSheet, 0.1, [1,6,11,16,16,11,6,1] ),
			new ig.Animation( this.animSheet, 0.1, [2,7,12,17,17,12,7,2] ),
			new ig.Animation( this.animSheet, 0.1, [3,8,13,18,18,13,8,3] ),
			new ig.Animation( this.animSheet, 0.1, [4,9,14,19,19,14,9,4] )
		];

		this.currentAnim = this.anims.random();
	},

	reset: function( x, y, settings ) {
		this.parent( x, y, settings );

		this.currentAnim = this.anims.random().rewind();
	},

	update: function() {
		if( this.currentAnim.loopCount ) {
			this.kill();
			return;
		}

		this.parent();
	}
});

ig.EntityPool.enableFor(EntityVine);




EntityVineGib = EntityParticle.extend({
	vpos: 0,
	scale: 0.25,
	vel: {x: 35, y: 35},
	friction: {x: 10, y: 10},
	gravity: 50,
	
	lifetime: 3,
	fadetime: 0.25,
	
	animSheet: new ig.AnimationSheet( 'media/sprites/vinebacker-gibs.png', 8, 8 ),
	
	init: function( x, y, settings ) {
		this.addAnim( 'idle', 5, [0,1,2,3] );
		this.parent( x, y, settings );
	}
});


});