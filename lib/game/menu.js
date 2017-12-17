ig.module( 
	'game.menu' 
)
.requires(
	'plugins.twopointfive.font',
	'plugins.twopointfive.world.tile'
)
.defines(function(){ "use strict";

ig.Menu = ig.Class.extend({
	name: null,
	font: new tpf.Font( 'media/04b03.font.png' ),
	
	current: 0,
	lineSpacing: 0,
	items: [],
	alpha: 1,
	
	init: function( width, height, ypos ) {
		this.width = width;
		this.height = height;
		
		this.y = ypos || (this.height/4);
		this.lineSpacing = ig.ua.mobile ? 8 : 0;
	},

	moveCursor: function( dir ) {
		do {
			this.current = (this.current + dir) % this.items.length;
			if( this.current < 0 ) {
				this.current = this.items.length - 1;
			}
		} while( (this.items[this.current].disabled && this.items[this.current].disabled()) );
	},
	
	update: function(mx, my) {
		if( ig.input.pressed('forward') ) { this.moveCursor(-1); }
		if( ig.input.pressed('back') ) { this.moveCursor(1); }
		
		// HACKCKCKCKCK
		var ys = this.y;
		if( this.name ) {
			ys += this.font.height * 2;
		}
		var xs = this.width/2;
		var hoverItem = null;
		for( var i = 0; i < this.items.length; i++ ) {
			var item = this.items[i];
			var w = this.font.widthForString( item.text )/2 + this.lineSpacing;
			
			if(
				(!item.disabled || !item.disabled()) &&
				mx > xs - w && mx < xs + w &&
				my > ys - this.lineSpacing && my < ys + this.font.height + this.lineSpacing
			) {
				hoverItem = item;
				this.current = i;
			}
			ys += this.font.height + this.lineSpacing;
		}
		
		if( ig.input.released('click') && hoverItem && (ig.system.hasMouseLock || ig.ua.mobile) ) {
			this.items[this.current].ok();
		}
		if( ig.input.released('shoot') && !ig.ua.mobile) {
			this.items[this.current].ok();
		}
	},
	
	
	draw: function() {
		var xs = this.width/2;
		var ys = this.y;
		if( this.name ) {
			this.fontTitle.draw( this.name, xs, ys, ig.Font.ALIGN.CENTER, this.alpha );
			ys += this.font.height * 2;
		}
		
		for( var i = 0; i < this.items.length; i++ ) {
			var item = this.items[i];
			var alpha = (i == this.current)
				? 1
				: ((!item.disabled || !item.disabled()) ? 0.5 : 0.2);
			
			this.font.draw( item.text, xs, ys, ig.Font.ALIGN.CENTER, alpha*this.alpha );
			ys += this.font.height + this.lineSpacing;
		}
	}
});

});
