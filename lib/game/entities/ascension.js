ig.module(
	'game.entities.ascension'
)
.requires(
	'plugins.twopointfive.entity',
	'game.entities.particle'
)
.defines(function(){

EntityAscension = tpf.Entity.extend({
	checkAgainst: ig.Entity.TYPE.A,

	size: {x: 16, y: 16},
	vpos: 0.5,
	scale: 5.5,
	ammo: 20,

	_wmScalable: true,
	_wmDrawBox: true,
	_wmBoxColor: '#333',

	//align: tpf.Entity.ALIGN.BOTTOM,
	vpos: -2,
	//zIndex: 1, // draw later, on top of everything

	ascending: false,
	ascendingTimer: null,
	dynamicLight: false,

	count: (ig.ua.mobile ? 256 : 512),
	flares: [],
	
	flareImage: new ig.Image( 'media/sprites/ascension-flare.png'),
	beamImage: new ig.Image( 'media/sprites/ascension-beam.png'),

	//ascendSound: new ig.Sound( 'media/sounds/ambient/ascend.ogg'),

	stateCounter: 0,
	musicStopped: false,
	
	init: function( x, y, settings ) {
		this.parent(x, y, settings);
		ig.game.clearColor = [0,0,0];

		if( ig.global.wm) { return; }

		this.quad = new tpf.Quad(3, 3, this.flareImage.texture);
		this.beam = new tpf.Quad(32,256, this.beamImage.texture);
		this.beam.setPosition( this.pos.x+this.size.x/2, 122, this.pos.y+this.size.y/2);
		this.beam.setSize( 12, 256 );
		ig.game.culledSectors.moveEntity(this);

		for( var i = 0; i < this.count; i++ ) {
			var x = this.pos.x,
				y = this.pos.y,
				z = 4,
				delta = Math.random();
				offset = i * 0.73; 
			this.flares.push({x: x, y: y, z: z, delta: delta, radius: Math.random()+0.4, rr:Math.random()});
		}
	},

	update: function() {
		this.parent();
		if( !this.ascending ) {
			return;
		}

		var cpos = ig.system.camera.position,
			crot = ig.system.camera.rotation;

		var tx = this.pos.x + this.size.x / 2,
			ty = this.pos.y + this.size.y / 2;

		var d = this.ascendingTimer.delta();
		cpos[0] -= (cpos[0] - tx) * ig.system.tick;
		cpos[2] -= (cpos[2] - ty) * ig.system.tick;
		cpos[1] = Math.sin(d) * 3 + (d > 6 ? Math.pow(d-6,7) : 0);

		crot[0] = Math.sin(d * 0.71) * 0.3;
		crot[2] = Math.sin(d * 1.37) * 0.3;
		if( d > 7 && d < 9 ) {
			crot[0] -= (Math.pow(d-7,3)).limit(0, Math.PI/3);
		}
	},

	check: function( other ) {
		if( this.ascending ) { return; }

		if( other instanceof EntityPlayer ) {
			other.update = function(){};
			this.ascending = true;
			this.ascendingTimer = new ig.Timer();
			this.checkAgainst = ig.Entity.TYPE.NONE;
		}
	},

	draw: function() {
		if( ig.global.wm ) return;

		var d = this.distanceTo(ig.game.player);
		if( d > 260 ) { return; }

		if( !this.musicStopped ) {
			ig.music.fadeOut(3);
			this.musicStopped = true;
		}

		var distanceAlpha = d.map(80,260,1,0);

		var cx = this.pos.x + this.size.x/2,
			cy = this.pos.y + this.size.y/2;

		var r = ig.system.renderer;
		
		r.flush();
		r.gl.depthMask(false);
		r.gl.disable(r.gl.DEPTH_TEST);
		r.gl.blendFunc(r.gl.SRC_ALPHA, r.gl.ONE);

		// var ascendingFadeout = 1;
		var drawBeam = true;
		if( this.ascendingTimer ) {
			var delta = this.ascendingTimer.delta();
			if( delta > 5.1 && this.stateCounter == 0 ) {
				// Stop all ambient sounds 
				/*var ambientSounds = ig.game.getEntitiesByType(EntityAmbientSound);
				for( var i = 0; i < ambientSounds.length; i++ ) {
					ambientSounds[i].fadeOut(3);
				}*/
				//this.ascendSound.play();
				this.stateCounter++;
			}
			if( delta > 6 ) {
				drawBeam = false;
				ig.game.hud.fadeToWhite = delta.map(7.8,8.2,0,1).limit(0,1);
			}
			if( delta > 10 && this.stateCounter == 1 ) {
				ig.game.setCredits();
				this.stateCounter++;
			}
		}
		if( drawBeam ) {
			this.beam.rotation[1] = ig.system.camera.rotation[1];
			this.beam._dirty = true;
			this.beam.setAlpha( distanceAlpha );
			r.pushQuad(this.beam);
		}
		
		var q = this.quad;
		var radius = 10;		
		q.rotation[1] = ig.system.camera.rotation[1];

		for( var i = 0; i < this.flares.length; i++ ) {
			var f = this.flares[i];
			f.delta += ig.system.tick * 0.37;

			if( f.delta > 1 ) { f.delta = 0; }

			var a = Math.pow(f.delta*3,3)*0.3 + f.radius * 357;
			f.x = cx + Math.sin(a+3) * (f.radius * radius * (1.1-f.delta) );
			f.y = cy + Math.cos(a+3) * (f.radius * radius * (1.1-f.delta) );
			f.z = -8 + Math.pow(f.delta,8) * 50 + f.rr * 2 + (1-f.radius);

			var ff = f.delta.map(0.8, 1, 1, 0);
			
			q.setPosition(f.x, f.z, f.y);
			q.setAlpha(f.delta*f.delta*distanceAlpha * ff);
			q._dirty = true;
			r.pushQuad(q);
		}

		r.flush();
		r.gl.depthMask(true);
		r.gl.blendFunc(r.gl.SRC_ALPHA, r.gl.ONE_MINUS_SRC_ALPHA);
		r.gl.enable(r.gl.DEPTH_TEST);
	}
});

});