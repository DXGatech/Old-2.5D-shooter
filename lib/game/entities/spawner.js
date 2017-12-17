ig.module(
	'game.entities.spawner'
)
.requires(
	'impact.entity'
)
.defines(function(){

EntitySpawner = ig.Entity.extend({
	size: {x: 8, y: 8},
	
	_wmDrawBox: true,
	_wmBoxColor: 'rgba(195, 19, 119, 0.7)',
	
	spawn: '',
	
	triggeredBy: function() {
		var ent = ig.game.spawnEntity(this.spawn, this.pos.x, this.pos.y, {spawnedBy: this});
		ent.ready();
	},	
	update: function(){}
});

});