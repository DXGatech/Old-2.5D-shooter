ig.module(
	'game.entities.change-sound'
)
.requires(
	'impact.entity'
)
.defines(function(){

EntityChangeSound = ig.Entity.extend({
	type: ig.Entity.TYPE.NONE,
	checkAgainst: ig.Entity.TYPE.NONE,
	collides: ig.Entity.COLLIDES.NEVER,
	
	size: {x: 8, y: 8},
	radius: 64,

	_wmDrawBox: true,
	_wmBoxColor: '#ff0',

	playing: false,
	fadeVolume: 1,
	fading: false,

	sounds: {
        musicer: new ig.Sound('media/sounds/ambient/junglebeat.m4a'),
		jungleDay: new ig.Sound('media/sounds/ambient/jungle-day.ogg'),
		jungleNight: new ig.Sound('media/sounds/ambient/jungle-night.ogg'),
		ascension: new ig.Sound('media/sounds/ambient/ascension.ogg'),
		computer: new ig.Sound('media/sounds/ambient/computer.ogg'),
		dripping: new ig.Sound('media/sounds/ambient/dripping.ogg'),
		industrial: new ig.Sound('media/sounds/ambient/industrial-breathing.ogg'),
		lava: new ig.Sound('media/sounds/ambient/lava.ogg'),
		future: new ig.Sound( 'media/sounds/future.ogg' ),
		des: new ig.Sound( 'media/sounds/des.ogg')
	},
	currentSound: null,

	init: function( x, y, settings ) {
		if( settings.sound && this.sounds[settings.sound] ) {
			this.currentSound = this.sounds[settings.sound];
			this.currentSound.loop = true;
		}
		this.parent(x, y, settings);
	},

	fadeOut: function( length ) {
		if( !this.fading ) {
			this.fading = true;
			if( this.currentSound.currentClip ) {
				this.fadeVolume = this.currentSound.currentClip.volume;
			}
		}
		if( this.playing ) {
			this.fadeVolume -= 0.1 / length;
			if( this.fadeVolume < 0 ) {
				this.currentSound.stop();
				this.playing = false;
			}
			else {
				this.currentSound.currentClip.volume = this.fadeVolume;
				setTimeout(this.fadeOut.bind(this, length),100);
			}
		}
	},

	update: function() {
		if( !this.sound || this.fading ) {
			return;
		}

		var distanceToPlayer = this.distanceTo(ig.game.player);

		if( distanceToPlayer > this.radius && this.playing ) {
			this.currentSound.stop();
			this.playing = false;
		}
		else if( distanceToPlayer < this.radius ) {
			if( !this.playing ) {
				this.currentSound.play();
				this.playing = true;
			}

			// Set the sound volume
			var distanceFactor = (this.radius - distanceToPlayer)/this.radius;
			this.currentSound.currentClip.volume = Math.sqrt(distanceFactor);
		}
	},

	draw: function() {
		if( !ig.global.wm ) { return; }

		
		var x = (this.pos.x+this.size.x/2-ig.game.screen.x) * ig.system.scale,
			y = (this.pos.y+this.size.y/2-ig.game.screen.y) * ig.system.scale,
			radius = this.radius * ig.system.scale,
			alpha = (this == ig.game.entities.selectedEntity) ? 1 : 0.2;

		var ctx = ig.system.context;

		ctx.globalAlpha = alpha;
		ctx.beginPath();
		ctx.arc(x, y, radius, 0, (Math.PI * 2), true);

		ctx.lineWidth = 1;
		ctx.strokeStyle = this._wmBoxColor;
		ctx.stroke();
		ctx.globalAlpha = 1;
	}
});


});
