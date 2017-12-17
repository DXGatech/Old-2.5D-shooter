ig.module(
	'game.entities.zom-spawn'
)
.requires(
	'plugins.twopointfive.entity',
	'game.entities.particle'
)
.defines(function(){

         EntityZomSpawn = tpf.Entity.extend({
                                               size: {x: 16, y: 16},
                                               scale: 0.5,
                                               
                                               dynamicLight: true,
                                               _wmBoxColor: '#ff0000',
                                               
                                               angle: 0,
                                               
                                               animSheet: new ig.AnimationSheet( 'media/blob-spawn1.png', 64, 128 ),
                                               
                                               init: function( x, y, settings ) {
                                               this.parent( x, y, settings );
                                               this.addAnim( 'idle', 1, [0] );
                                               this.addAnim( 'spawn', 0.05, [0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,14,15,16,17,18,19,20,21] );
                                               },
                                               
                                               update: function() {
                                               if( this.currentAnim == this.anims.idle ) {
                                               if( this.manhattenDistanceTo(ig.game.player) < 300 ) {
                                               this.currentAnim = this.anims.spawn.rewind();
                                               }
                                               else {
                                               return;
                                               }
                                               }
                                               
                                               this.parent();
                                               
                                               // Spawn anim finished? Spawn the Blob and kill the spawner.
                                               if( this.currentAnim == this.anims.spawn && this.currentAnim.loopCount ) {
                                               ig.game.spawnEntity(EntityZombie, this.pos.x, this.pos.y);
                                               this.kill();
                                               }
                                               },
                                               
                                               manhattenDistanceTo: function( other ) {
                                               // This is a tiny bit faster than .distanceTo() and we don't need the precision
                                               return Math.abs(other.pos.x - this.pos.x) + Math.abs(other.pos.y - this.pos.y);
                                               }
                                               });
         
         


});