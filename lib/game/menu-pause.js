    ig.module( 
	'game.menu-pause' 
)
.requires(
	//'game.main',
	'game.menu',
	//'impact.font',
	'plugins.twopointfive.font',
	'plugins.twopointfive.world.tile'
)
.defines(function(){ "use strict";
    
    MenuPause = ig.Class.extend({
	camera: null,
	background: null,

	font: new tpf.Font( 'media/04b03.font.png' ),
	cursorImage: new ig.Image( 'media/cursor.png' ),

	init: function() {
		this.width = 320;
		this.height = 240;
		this.camera = new tpf.OrthoCamera(this.width, this.height );

		this.background = new tpf.Quad(this.width, this.height);
		this.background.setPosition(this.width/2, this.height/2,0)
		this.background.setColor({r:0, g:0.007, b:0.07});
		this.background.setAlpha(0.6);

		this.currentMenu = new (MenuPause)(this.width, this.height, 130);

		this.cursor = new tpf.HudTile( this.cursorImage, 0, this.cursorImage.width, this.cursorImage.height );
		this.cursor.x = this.width/2;
		this.cursor.y = this.height/2;
	},

	update: function() {
		if( ig.system.hasMouseLock ) {
			var s = this.width / ig.system.width;
			this.cursor.x = (this.cursor.x + ig.input.mouseDelta.x*s).limit(0, this.width-2);
			this.cursor.y = (this.cursor.y + ig.input.mouseDelta.y*s).limit(0, this.height-2);
			this.cursor.setPosition(this.cursor.x, this.cursor.y, 0);

			this.currentMenu.update(this.cursor.x, this.cursor.y);
		}
		else {
			var mx = ig.input.mouse.x * (this.width / ig.system.width);
			var my = ig.input.mouse.y * (this.height / ig.system.height);
			this.currentMenu.update(mx, my);
		}
	},

	draw: function() {
		ig.system.renderer.setCamera(this.camera);
		ig.system.renderer.pushQuad(this.background);
		
		this.currentMenu.draw();

		if( ig.system.hasMouseLock ) {
			this.cursor.draw();
		}
	},

	easeOutQuad: function(t, b, c, d) {
		t = t.limit(0, d);
		return c*((t=t/d-1)*t*t + 1) + b;
	}
});
});