ig.baked = true;
ig.module('game.intro').requires('plugins.twopointfive.font', 'plugins.twopointfive.world.tile').defines(function() {
    Intro = ig.Class.extend({
        camera: null,
        fadeScreen: null,
        clearColor: "#000000",
        width: 640,
        height: 480,
        font: new tpf.Font('media/info.font.png'),
        title: null,
        background: null,
        init: function() {
            this.background = new tpf.Quad(this.width, this.height);
            this.background.setPosition(this.width / 2, this.height / 2, 0)
            this.background.setColor({
                r: 0,
                g: 0,
                b: 0,
            });
            this.background.setAlpha(0.6);
            this.camera = new tpf.OrthoCamera(this.width, this.height);
        },
        update: function() {
            if (ig.input.released('shoot') || ig.input.released('click')) {
                ig.game.menu = null;                                                                     
                //ig.game.parent();
            }
        },
        draw: function() {
            ig.system.renderer.setCamera(this.camera);
            ig.system.renderer.pushQuad(this.background);
            var message = "Game Paused  --- \nMade By GaoGame\n--  --\n--  --\n-------\n--  --\n--  --";
            this.font.draw(message, this.width / 2, 100, ig.Font.ALIGN.CENTER);
            /*var message2="Look, I'm detecting a huge wave of zombies heading your way.\nGet out of there, try to find a crappy looking gate. \n I'll try to export you from there.  Hurry, and watch your 6!";this.font.draw(message2,this.width/2,250,ig.Font.ALIGN.CENTER);*/

        }
    });
});