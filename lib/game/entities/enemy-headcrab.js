ig.module(
	'game.entities.enemy-headcrab'
)
.requires(
	'plugins.twopointfive.entity',
	'game.entities.particle'
)
.defines(function(){


EntityEnemyHeadcrab = tpf.Entity.extend({
	type: ig.Entity.TYPE.B,
	checkAgainst: ig.Entity.TYPE.A,
	collides: ig.Entity.COLLIDES.ACTIVE,

	size: {x: 32, y: 32},
	friction: {x: 100, y: 100},
	vpos: 0,
	scale: 1,

	gravity: 70,
	//zvel: 0,

	health: 10,
	damage: 30,

	dynamicLight: true,
	_wmBoxColor: '#ff0000',

	angle: 0,
	speed: 90,
	injump: false,

	didHurtPlayer: false,
	seenPlayer: false,


	animSheet: new ig.AnimationSheet( 'media/sprites/headcrab.png', 48, 24 ),
	//soundHit: new ig.Sound( 'media/sounds/enemies/headcrab-hit.ogg' ),
	//soundAttack: new ig.Sound( 'media/sounds/enemies/headcrab-attack.ogg'),

	init: function( x, y, settings ) {
		this.parent( x, y, settings );
		this.attackWaitTimer = new ig.Timer(Math.random()*3);

		this.addAnim( 'idle', 0.1, [0,1,2,0,2,1,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,0,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,3,3,3,3,2,3] );
		this.addAnim( 'attack', 0.05, [4,4,5,5,5,5,5,5,5,5,5,5,6,7,8,9,9,10,10,10,10,11], true );
		this.addAnim( 'crawl', 0.08, [12,13,14,15] );
		this.addAnim( 'pain', 0.05, [4,5,5,5], true );
		this.addAnim( 'die', 0.05, [16,17,18,19,19,20], true );

		this.currentAnim.gotoRandomFrame();

		if( !ig.global.wm ) {
			this.floor = this.tile.quad.position[1];
		}

		if( settings.attackNow ) {
			this.angle = this.angleTo( ig.game.player ) + (Math.random()-0.5)*1;
			this.didHurtPlayer = false;
			this.currentAnim = this.anims.attack;
			this.currentAnim.gotoFrame(12);
			this.tile.quad.position[1] += 10;
		}
	},


	update: function() {
		var distanceToPlayer = this.distanceTo(ig.game.player);
		
		if(
			this.currentAnim == this.anims.idle && 
			(distanceToPlayer > 250 || !this.canSee(ig.game.player))
		) {
			this.currentAnim.update();
			this.updateQuad();
			return;
		}

		if( this.currentAnim == this.anims.die ) {
			if( this.currentAnim.loopCount ) {
				this.updateQuad();
				if( this.vanishWhenDead ) {
					this.currentAnim.update();
					if( this.currentAnim.loopCount > 10 ) {
						this.kill();
					}
				}
				return;
			}
		}
		
		// idle
		if( this.currentAnim == this.anims.idle && !this.seenPlayer ) {
			if( distanceToPlayer < 200 ) {
				this.seenPlayer = true;
				this.attackWaitTimer.set( Math.random()*2 );
				this.currentAnim = this.anims.crawl;
			}
		}

		if( this.currentAnim == this.anims.attack ) {
			if( this.currentAnim.loopCount && !this.injump) {
				this.currentAnim = this.anims.crawl.rewind();
			}
			else if( this.currentAnim.frame >= 12 ) {
				this.vel.x = Math.cos(this.angle) * this.speed*3;
				this.vel.y = Math.sin(this.angle) * this.speed*3;
				if( !this.injump ) {
					//this.soundAttack.play();
					this.injump = true;
					this.zvel = 35;
				}
			}
		}

		// crawling
		else if( this.currentAnim == this.anims.crawl || this.currentAnim == this.anims.idle ) {
			// init attack?
			if(
				this.attackWaitTimer.delta() > 0 &&
				distanceToPlayer < 100
			) {
				// Trace a line to the player to check if we have a line of sight
				var sx = this.pos.x+this.size.x/2,
					sy = this.pos.y+this.size.y/2;
				var res = ig.game.collisionMap.trace( 
					sx, sy, 
					ig.game.player.pos.x+10 - sx, ig.game.player.pos.y+10 - sy, 
					10, 10
				);

				if( !res.collision.x && !res.collision.y ) {
					// We have a line of sight and are close enough -> attack
					this.attack();
				}
				else {
					// no line of sight. check again in 1 sec
					this.attackWaitTimer.set( 1 );
				}
			}

			// crawl on
			else {
				this.angle = this.angleTo( ig.game.player );

				if( distanceToPlayer > 50 ) {
					this.currentAnim = this.anims.crawl;
					this.vel.x = Math.cos(this.angle) * this.speed;
					this.vel.y = Math.sin(this.angle) * this.speed;
				}
				else {
					this.currentAnim = this.anims.idle;
				}
			}
		}

		// pain anim finished?
		else if( this.currentAnim == this.anims.pain && this.currentAnim.loopCount ) {
			this.currentAnim = this.anims.crawl.rewind();
		}

		this.parent();
	},

	attack: function() {
		this.didHurtPlayer = false;
		this.currentAnim = this.anims.attack.rewind();
		this.attackWaitTimer.set( Math.random()*3 + 4 );
		this.vel.x = 0;
		this.vel.y = 0;
	},

	updateQuad: function() {
		this.zvel -= this.gravity * ig.system.tick;
		
		var nz = this.tile.quad.position[1] + this.zvel * ig.system.tick;
		if( nz < this.floor ) {
			nz = this.floor;
			this.zvel = 0;
			this.injump = false;
		}
		this.tile.quad.position[1] = nz;
		this.tile.quad._dirty = true;

		this.parent();
	},


	receiveDamage: function( amount, from ) {
		this.health -= amount;
		if( this.health <= 0 ) {
			this.currentAnim = this.anims.die.rewind();
			this.collides = ig.Entity.COLLIDES.NEVER;
			this.checkAgainst = ig.Entity.TYPE.NONE;
			this.type = ig.Entity.TYPE.NONE;
		}
		else {
			this.currentAnim = this.anims.pain.rewind();
		}

		var kickback = amount >= 25 ? 40 : 20;
		this.angle = this.angleTo( ig.game.player );
		this.vel.x = -Math.cos(this.angle) * kickback;
		this.vel.y = -Math.sin(this.angle) * kickback;
		
		this.spawnGibs( ig.ua.mobile ? 3 : 5 );
		//this.soundHit.play();
	},

	spawnGibs: function( amount, maxZ ) {
		var cx = this.pos.x + this.size.x/2;
		var cy = this.pos.y + this.size.y/2;
		var settings = {maxZ: maxZ || 0};
		for( var i = 0; i < amount; i++ ) {
			ig.game.spawnEntity( EntityHeadcrabGib, cx, cy, settings );
		}
	},

	kill: function() {
		this.parent();
		this.spawnGibs( 10, -6 );
	},

	check: function( other ) {
		if( this.didHurtPlayer ) {
			// Player already hurt during this attack move?
			return;
		}

		this.didHurtPlayer = true;
		this.currentAnim = this.anims.pain.rewind();
		//this.vel.x = -this.vel.x;
		//this.vel.y = -this.vel.y;
		other.receiveDamage( this.damage, this );
	}
});



EntityHeadcrabGib = EntityParticle.extend({
	vpos: 0,
	scale: 0.25,
	vel: {x: 15, y: 15},
	friction: {x: 10, y: 10},
	
	lifetime: 2,
	
	animSheet: new ig.AnimationSheet( 'media/sprites/headcrab-gib.png', 8, 8 ),
	
	init: function( x, y, settings ) {
		this.addAnim( 'idle', 5, [0,1,3,4] );
		this.parent( x, y, settings );
	}
});


});