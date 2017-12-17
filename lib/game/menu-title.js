ig.module( 
	'game.menu-title' 
)
.requires(
	'game.menu',
	'plugins.twopointfive.font',
	'plugins.twopointfive.world.tile'
)
.defines(function(){ "use strict";

var MenuTitle = ig.Menu.extend({
	items: [
		{
			text: 'NEW GAME', 
			ok: function(){ ig.game.menu.setMenu(MenuDifficulty); }
		},
		{
			text: 'CONTINUE', 
			disabled: function(){ return !ig.game.hasSavedGame; }, 
			ok: function(){ ig.game.continueSavedGame(); }
		}
	]
});

var MenuDifficulty = ig.Menu.extend({
	items: [
		{
			text: 'NORMAL MODE', 
			ok: function(){ ig.game.newGame(Xibalba.Game.DIFFICULTY.NORMAL); }
		},
		{
			text: 'HARD MODE', 
			ok: function(){ ig.game.newGame(Xibalba.Game.DIFFICULTY.HARD); }
		}
	]
});


window.Xibalba = window.Xibalba || {};
Xibalba.MenuTitle = ig.Class.extend({
	camera: null,
	fadeScreen: null,

	font: new tpf.Font( 'media/04b03.font.png' ),

	layerImages: {
		stars: new ig.Image( 'media/title/stars.png' ),
		treetopsRight: new ig.Image( 'media/title/treetops-right.png' ),
		pyramid: new ig.Image( 'media/title/pyramid.png' ),		
		treetopsLeft: new ig.Image( 'media/title/treetops-left.png' ),
		foreground: new ig.Image( 'media/title/foreground.png' )
	},
	
	layers: {},

	titleImage: new ig.Image( 'media/title/xibalba.png' ),
	cursorImage: new ig.Image( 'media/cursor.png' ),

	madeWithImpactImage: new ig.Image( 'media/made-with-impact-px.png' ),

	canContinue: false,
	currentMenu: null,

	introTimer: null,

	init: function() {
		this.width = 320;
		this.height = 240;

		var i = 1;
		for( var name in this.layerImages ) {
			var img = this.layerImages[name];
			var layer = new tpf.HudTile( img, 0, img.width, img.height);
			layer.distance = i;
			layer.top = 240 - img.height;
			layer.setPosition(0, layer.top, 0);
			this.layers[name] = layer;
			i*=1.5;
		}

		this.title = new tpf.HudTile( this.titleImage, 0, this.titleImage.width, this.titleImage.height);
		this.title.setPosition(91, 88, 0);
		this.title.setAlpha(0);

		this.madeWithImpact = new tpf.HudTile(this.madeWithImpactImage, 0, this.madeWithImpactImage.width, this.madeWithImpactImage.height);
		this.madeWithImpact.setPosition(8, 240-30);

		this.cursor = new tpf.HudTile( this.cursorImage, 0, this.cursorImage.width, this.cursorImage.height );
		this.cursor.x = this.width/2;
		this.cursor.y = this.height/2;

		this.camera = new tpf.OrthoCamera(this.width, this.height );

		this.introTimer = new ig.Timer();
		this.setMenu( MenuTitle );
	},

	setMenu: function(MenuClass) {
		this.currentMenu = new (MenuClass)(this.width, this.height, 130);
	},

	update: function() {
		// Only update menu when it has faded in about half way
		if( this.currentMenu.alpha > 0.5 ) {
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
			
			if( 
				window.ejecta && ig.input.pressed('click') &&
				ig.input.mouse.x < 140 && ig.input.mouse.y > 320-60
			) {
				ejecta.openURL('http://impactjs.com/', 'Go to the Impact Website?');
			}
		}

		var d = this.introTimer.delta();
		var scroll = this.easeOutQuad(d, 240, -240, 5);
		for( var name in this.layers ) {
			var layer = this.layers[name];
			var y = scroll * layer.distance;
			layer.setPosition(0, y + layer.top, 0);
		}
	},

	draw: function() {
		ig.system.renderer.setCamera(this.camera);

		for( var name in this.layers ) {
			this.layers[name].draw();
		}

		var d = this.introTimer.delta();
		var titleAlpha = d.map(4,6,0,1).limit(0,0.9);
		this.title.setAlpha(titleAlpha);
		this.title.draw();

		if( ig.ua.mobile ) {
			this.madeWithImpact.setAlpha(titleAlpha);
			this.madeWithImpact.draw();
		}
		
		this.currentMenu.alpha = d.map(5,6,0,1).limit(0,1);
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
