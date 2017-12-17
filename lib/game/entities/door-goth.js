ig.module(
	'game.entities.door-goth'
)
.requires(
	'game.entities.door'
)
.defines(function(){

EntityDoorGoth = EntityDoor.extend({
	animSheet: new ig.AnimationSheet( 'media/sprites/goth-doors.png', 16, 16 ),
	soundOpen: new ig.Sound('media/sounds/door-goth-open.*'),
	soundClose: new ig.Sound('media/sounds/door-goth-close.*'),

	init: function( x, y, settings ) {
		this.addAnim( 'normal', 1, [0] );
		this.addAnim( 'skeleton', 1, [1] );
		this.parent( x, y, settings );
	}
});

});