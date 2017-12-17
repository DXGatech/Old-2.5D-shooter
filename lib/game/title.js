ig.baked = true;
ig.module('game.title').requires('plugins.twopointfive.font', 'plugins.twopointfive.world.tile').defines(function() {
    MyTitle = ig.Class.extend({
        camera: null,
        fadeScreen: null,
        clearColor: "#000000",
        width: 640,
        height: 480,
        font: new tpf.Font('media/fredoka-one.font.png'),
        titleImage: new ig.Image('media/title.png'),
        title: null,
        background: null,
        timer: null,
        init: function() {
            this.title = new tpf.HudTile(this.titleImage, 0, this.titleImage.width, this.titleImage.height);
            this.title.setPosition(125, 50);
            this.background = new tpf.Quad(this.width, this.height);
            this.background.setPosition(this.width / 2, this.height / 2, 0)
            this.background.setColor({
                r: 0,
                g: 0,
                b: 0
            });
            this.camera = new tpf.OrthoCamera(this.width, this.height);
            this.timer = new ig.Timer();
        },
        update: function() {
            if (ig.input.released('shoot') || ig.input.released('click')) {
                ig.game.setLevel1Intro();
            }
        },
        draw: function() {
            ig.system.renderer.setCamera(this.camera);
            ig.system.renderer.pushQuad(this.background);
            this.title.draw();
            //ig.main('#canvas', StartScreen, 60, canvas.width, canvas.height,1);
            var message = ig.ua.mobile ? 'Tap to Start': 'Click to Start';
            var alpha = (Math.sin(this.timer.delta() * 4) + 1) * 0.5;
            this.font.draw(message, this.width / 2, 350, ig.Font.ALIGN.CENTER, alpha);
        }
    });
    
    

});