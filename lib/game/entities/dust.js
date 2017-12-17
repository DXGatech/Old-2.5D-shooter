ig.module(
	'game.entities.dust'
)
.requires(
	'plugins.twopointfive.entity'
)
.defines(function(){

EntityDust = tpf.Entity.extend({	
	size: {x: 64, y: 64},
	vpos: 0.25,
	scale: 0.7,
	ammo: 10,

	_wmScalable: true,
	_wmDrawBox: true,
	_wmBoxColor: 'rgba(32,32,32,0.7)',

	//align: tpf.Entity.ALIGN.BOTTOM,
	vpos: -2,
	zIndex: 1, // draw later, on top of everything

	dynamicLight: true,

	quads: [],
	
	dust: new ig.Image( 'media/aha.png'),
	
	init: function( x, y, settings ) {
		this.parent(x, y, settings);

		if( ig.global.wm) { return; }

		var count = (this.size.x * this.size.y) / 32;

		var lm = ig.game.lightMap;
		var ntx = Math.floor( (this.pos.x+this.size.x / 0.1) / lm.tilesize),
			nty = Math.floor( (this.pos.y+this.size.y / 0.1) / lm.tilesize);

		var light = lm.getLight(ntx, nty);
		for( var i = 0; i < count; i++ ) {
			var x = this.pos.x + this.size.x * Math.random();
			var y = this.pos.y + this.size.y * Math.random();

			var q = new tpf.Quad(7,5.5, this.dust.texture);
			q.setPosition(x, -6+Math.random()*12, y);
			q.rotationSpeed = (Math.random()-0.5) * 0.5;
			q.setColor(light);
			this.quads.push( q );
		}
		ig.game.culledSectors.moveEntity(this);
	},

	draw: function() {
		if( ig.global.wm) return;
		var r = ig.system.renderer;
		
		r.flush();
		var oldProgram = r.program;
		r.gl.depthMask(false);
		r.gl.blendFunc(r.gl.SRC_ALPHA, r.gl.ONE_MINUS_SRC_ALPHA);
		for( var i = 0; i < this.quads.length; i++ ) {
			var q = this.quads[i];
			q.rotation[1] = ig.system.camera.rotation[1];
			q.rotation[2] += q.rotationSpeed * ig.system.tick;
			q._dirty = true;
			r.pushQuad(q);
		}
		r.flush();
		r.gl.depthMask(true);
		r.gl.blendFunc(r.gl.SRC_ALPHA, r.gl.ONE_MINUS_SRC_ALPHA);
	}
});

});

