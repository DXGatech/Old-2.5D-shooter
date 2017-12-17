ig.baked = true;
ig.module('game.entities.void').requires('impact.entity').defines(function() {
    EntityVoid = ig.Entity.extend({
        _wmDrawBox: true,
        _wmBoxColor: 'rgba(128, 28, 230, 0.7)',
        size: {
            x: 32,
            y: 32
        },
        update: function() {}
    });
});