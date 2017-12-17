ig.module(
	'game.entities.door'
)
.requires(
	'plugins.twopointfive.entity'
)
.defines(function(){

EntityDoor = tpf.Entity.extend({
	type: ig.Entity.TYPE.NONE,
	checkAgainst: ig.Entity.TYPE.A,
	collides: ig.Entity.COLLIDES.NEVER,
	
	size: {x: 64, y: 64},
	checkBorder: 39,
	vpos: 0,
	scale: 1,

	rotateToView: false,

	openIn: 0.55,
	stayOpenFor: 1,
	state: 0, // closed

	needsKey: null,

	_wmBoxColor: '#90f',

	animSheet: new ig.AnimationSheet( 'media/sprites/tech-doors.png', 64, 64 ),
	soundOpen: new ig.Sound('media/sounds/door-open.*'),
	soundClose: new ig.Sound('media/sounds/door-close.*'),
	
	init: function( x, y, settings ) {
		this.parent( x, y, settings );
		this.addAnim( 'grey', 1, [0] );
		this.addAnim( 'red', 1, [1] );
		this.addAnim( 'green', 1, [2] );
		this.addAnim( 'blue', 1, [3] );

		if( !ig.global.wm ) {
			// Modify size and pos, so that the door checks a larger area
			this.initPos = this.pos;
			this.initSize = this.size;

			this.size = {x: this.size.x+this.checkBorder, y: this.size.y+this.checkBorder};
			this.pos = {x: this.pos.x-this.checkBorder/2, y: this.pos.y-this.checkBorder/2};

			this.state = EntityDoor.STATE.CLOSED;
			this.setCollision( true );
			this.timer = new ig.Timer( this.stayOpenFor );

			if( this.needsKey ) {
				this.currentAnim = this.anims[this.needsKey];
			}

			// Call the original update method once, so this door gets 
			// positioned and lit correctly
			tpf.Entity.prototype.update.apply(this);
		}
	},
	
	ready: function() {
		// Check if the tile beneath this door occupied. If so, this is 
		// a East<>West door and we need to rotate it 90deg

		var tx = this.initPos.x+this.initSize.x * 0.5,
			ty = this.initPos.y+this.initSize.y * 1.5;
		
		if( ig.game.collisionMap && ig.game.collisionMap.getTile(tx, ty) ) {
			this.tile.quad.setRotation(0, Math.PI/2, 0);
		}
	},
	
	
	update: function() {
		var ts = ig.game.collisionMap.tilesize;
		if( this.state == EntityDoor.STATE.OPENING ) {
			var speed = ts / this.openIn;
			this.tile.quad.position[1] += speed * ig.system.tick;
			
			if( this.tile.quad.position[1] >= ts ) {
				this.tile.quad.position[1] = ts;
				this.state = EntityDoor.STATE.OPEN;
				this.timer.reset();
			}
			this.tile.quad._dirty = true;
		}
		else if( this.state == EntityDoor.STATE.CLOSING ) {
			var speed = ts / this.openIn;
			this.tile.quad.position[1] -= speed * ig.system.tick;

			if( this.tile.quad.position[1] <= 0 ) {
				this.tile.quad.position[1] = 0;
				this.state = EntityDoor.STATE.CLOSED;
				this.setCollision( true );
			}
			this.tile.quad._dirty = true;
		}
		else if( this.state == EntityDoor.STATE.OPEN && this.timer.delta() > 0 )  {
			this.soundClose.play();
			this.state = EntityDoor.STATE.CLOSING;
		}
	},
	
	
	receiveDamage: function( amount, from ) {},

	setCollision: function( closed ) {
		ig.game.collisionMap.setTile( 
			this.pos.x + this.size.x/2, 
			this.pos.y + this.size.y/2, 
			closed ? 1 : 0 
		);
	},
	
	open: function() {
		if( this.state & (EntityDoor.STATE.CLOSED | EntityDoor.STATE.CLOSING) ) {
			this.soundClose.stop();
			this.state = EntityDoor.STATE.OPENING;
			this.soundOpen.play();
			this.setCollision( false );
		}

		else if( this.state == EntityDoor.STATE.OPEN ) {
			this.timer.reset();
		}
	},

	check: function( other ) {
		// Only the player can open this door. If this door needs a key, make sure the player has it
		if( other instanceof EntityPlayer ) {
			if( this.needsKey ) {
				if( other.keys[this.needsKey] ) {
					this.open();
				}
				else {
					ig.game.hud.showMessage( 'You need the '+this.needsKey+' key!' );
				}
			}
			else {
				this.open();
			}
		}
	}
});

EntityDoor.STATE = {
	CLOSED: 1,
	OPENING: 2,
	OPEN: 4,
	CLOSING: 8
};


});
