ig.baked = true;
ig.module('game.main').requires('impact.game', 'impact.font',
                                'plugins.twopointfive.game', 'plugins.astar','plugins.touch-button','plugins.touch-field', 'plugins.pause-button','game.levels.base1',
                                'game.levels.jungle', /*'game.levels.dungeon', */'game.levels.test',
                                'game.levels.level1', 'game.levels.level3', 'game.levels.level4',
                                'game.entities.enemy-blob', 'game.entities.grenade-pickup',
                                'game.entities.shotgun-pickup', 'game.entities.pistol-pickup',
                                'game.entities.health-pickup', 'game.title', 'game.intro','game.intro1',
                                'game.intro2', 'game.intro3', 'game.intro4', 'game.ending',
                                'game.credits', 'game.hud', 'game.menu-pause'
                                ).defines(function() {
    "use strict";
    var MyGame = tpf.Game.extend({
        sectorSize: 4,
        hud: null,
        dead: false,
        menu: null,
        pauseButton: null,
        touchButtons: null,
        touchFieldMove: null,
        touchFieldTurn: null,
        currentLevel: 1,
        gravity: 4,
        infoFont: new tpf.Font('media/info.font.png'),
        blobSpawnWaitInitial: 2,
        blobSpawnWaitCurrent: 2,
        blobSpawnWaitDiv: 1.01,
        blobKillCount: 0,
        blobSpawnTimer: null,
        IntroSong: new ig.Sound('media/sounds/bossa.*'),
        Level1Song: new ig.Sound('media/sounds/A Journey Awaits.*'),
        Level2Song: new ig.Sound('media/sounds/A Journey Awaits.*'),
        Level3Song: new ig.Sound('media/sounds/A Journey Awaits.*'),
        Level4Song: new ig.Sound('media/sounds/Chaotic_Filth_loop_.*'),
        powerupSpawnWait: 1,
        powerupSpawnTimer: null,
        //quitButton:{ name:"quit", label:"QUIT GAME", x:0, y:0, width:0, height:0 },
        alignButtons: function(){
              this.quitButton.width = this.font.widthForString(this.quitButton.label);
                this.quitButton.height = this.font.heightForString(this.quitButton.label);
                this.quitButton.x = ig.system.width - (this.quitButton.width + 5);
                this.quitButton.y = 3;
                this.registerHitArea(this.quitButton.name, this.quitButton.x, this.quitButton.y, this.quitButton.width, this.quitButton.height);
            
            },
        init: function() {
            
            var as = new ig.AnimationSheet( 'media/tiles/terrain.png', 64, 64 );
            	this.backgroundAnims = {
			'media/tiles/terrain.png': {
				119: new ig.Animation( as, 0.2, [119, 120, 120, 119, 120, 119] ),
				88: new ig.Animation( as, 1.0, [87, 88, 89, 90, 91] ),
				/*33: new ig.Animation( as, 0.15, [33,112,113,114,115] ),
				36: new ig.Animation( as, 0.2, [36,100,101,102,103] ),
				58: new ig.Animation( as, 0.1, [58,108,58,108,108,108] ),*/
			}
		};
            
            
            if (!ig.ua.mobile) {
                ig.$('#requestFullscreen').addEventListener('click', 
                function(ev) {
                    ig.system.requestFullscreen();
                    ev.preventDefault();
                    this.blur();
                    return false;
                },
                false);
                ig.system.canvas.addEventListener('click', 
                function() {
                    ig.system.requestMouseLock();
                });
            }
            ig.input.bind(ig.KEY.MOUSE1, 'click');
            if (ig.ua.mobile) {
                this.setupTouchControls();
            }
            else {
                this.setupDesktopControls();
            }
            this.IntroSong.volume = 0.6;
            this.IntroSong.loop = true;
            this.Level1Song.volume = 0.7;
            this.Level1Song.loop = true;
            this.Level2Song.volume = 1.0;
            this.Level2Song.loop = true;
            this.Level3Song.volume = 0.8;
            this.Level3Song.loop = true;
            this.Level4Song.volume = 1.0;
            this.Level4Song.loop = true;
            this.IntroSong.play();
            this.setTitle();
        },
        spawnBlob: function() {
		var spawnPos = null,
		playerPos = this.player.pos;

		// Try a few times to find a spawn position that's not too close
		// to the player
		for( var i = 0; i < 10; i++ ) {
			spawnPos = this.getRandomSpawnPos();
			if( Math.abs(spawnPos.x - playerPos.x) + Math.abs(spawnPos.y - playerPos.y) > 256 ) {
				// Far enough; all good!
				break;
			}
		}
		this.spawnEntity(EntityEnemyHeadcrab, spawnPos.x, spawnPos.y);

		this.blobSpawnWaitCurrent /= this.blobSpawnWaitDiv;
		this.blobSpawnTimer.set( Math.max(this.blobSpawnWaitCurrent, 0.5) );
	},
        setGame: function() {
            this.menu = null;
            this.dead = false;
            this.hud = new MyHud(1280, 720);
            this.blobKillCount = 0;
            this.blobSpawnWaitInitial = this.blobSpawnWaitInitial;
            this.blobSpawnTimer = new ig.Timer(this.blobSpawnWaitInitial);
            this.powerupSpawnTimer = new ig.Timer(this.powerupSpawnWait);
            this.stopAllSongs();
            this.setlevel1();
        },
        setupDesktopControls: function() {
            ig.input.bind(ig.KEY.UP_ARROW, 'forward');
            ig.input.bind(ig.KEY.LEFT_ARROW, 'left');
            ig.input.bind(ig.KEY.DOWN_ARROW, 'back');
            ig.input.bind(ig.KEY.RIGHT_ARROW, 'right');
            ig.input.bind(ig.KEY.ENTER, 'shoot');
            ig.input.bind(ig.KEY.X, 'run');
            ig.input.bind(ig.KEY.V, 'weaponNext');
            ig.input.bind(ig.KEY.ESC, 'pause');
            ig.input.bind(ig.KEY.W, 'forward');
            ig.input.bind(ig.KEY.A, 'stepleft');
            ig.input.bind(ig.KEY.S, 'back');
            ig.input.bind(ig.KEY.D, 'stepright');
            ig.input.bind(ig.KEY.SHIFT, 'run');
            ig.input.bind(ig.KEY.CTRL, 'shoot');
            ig.input.bind(ig.KEY.MOUSE2, 'run');
            ig.input.bind(ig.KEY.MWHEEL_UP, 'weaponNext');
            ig.input.bind(ig.KEY.MWHEEL_DOWN, 'weaponPrev');
            
        },
        setupTouchControls: function() {
            if (this.touchButtons) {
                this.touchButtons.remove();
            }
            if (this.pauseButton) {
                this.pauseButton.remove();
            }
            if (this.touchFieldMove) {
                this.touchFieldMove.remove();
            }
            if (this.touchFieldTurn) {
                this.touchFieldTurn.remove();
            }
            this.touchButtons = new ig.TouchButtonCollection([new ig.TouchButton('shoot', {
                right: 0,
                bottom: 0
            },
            ig.system.width / 2, ig.system.height / 4)]);
            
            /*this.pauseButton = new ig.PauseButtonCollection([new ig.PauseButton('pause', {
                right: 0,
                bottom:0
                },
                ig.system.width / 5, ig.system.height /4 )]);*/
            
            this.touchButtons.align();
            this.touchFieldMove = new ig.TouchField(0, 0, ig.system.width / 2, ig.system.height);
            this.touchFieldTurn = new ig.TouchField(ig.system.width / 2, 0, ig.system.width / 2, ig.system.height / 4 * 3);
            
            //this.pauseButton.align();
            
        
            
        },
        loadLevel: function(data) {
            this.lastLevel = data;
            this.clearColor = null;
            this.pathfinder = new ig.AStar(this.collisionMap);
            var info = null;
            for (var i = 0; i < data.entities.length; i++) {
                if (data.entities[i].settings && data.entities[i].settings.name == 'info') {
                    info = data.entities[i].settings;
                }
            }
            this.sectorSize = (info && info.sectorSize) || 4;
            this.parent(data);
            if (info && typeof info.fogColor !== 'undefined' && !ig.ua.mobile) {
                ig.system.renderer.setFog(parseInt(info.fogColor), info.fogNear, info.fogFar);
            }
            else {
                ig.system.renderer.setFog(false);
            }
            this.floorMap = this.getMapByName('floor');
        },
        update: function() {
            
            if (ig.input.pressed('pause')) {
                this.menu = new Intro();
                this.parent = null;
            }
            
            if (this.menu) {
                this.menu.update();
                return;
            }
            if (this.dead) {
                if (ig.input.released('shoot') || (!ig.ua.mobile && ig.input.released('click'))) {
                    this.menu = null;
                    this.dead = false;
                    this.hud = new MyHud(1280, 720);
                    this.blobSpawnWaitInitial = this.blobSpawnWaitInitial;
                    this.blobSpawnTimer = new ig.Timer(this.blobSpawnWaitInitial);
                    this.powerupSpawnTimer = new ig.Timer(this.powerupSpawnWait);
                    switch (this.currentLevel) {
                    case 1:
                        this.setLevel1Intro();
                        break;
                    case 2:
                        this.setLevel2Intro();
                        break;
                    case 3:
                        this.setLevel3Intro();
                        break;
                    case 4:
                        this.setLevel4Intro();
                        break;
                    default:
                        this.setTitle();
                        break;
                    }
                    this.dead = false;
                }
            }else{
                if( this.blobSpawnTimer.delta() > 0 ) {
				this.spawnBlob();
			}
			/*if( this.powerupSpawnTimer.delta() > 0 ) {
				this.spawnPowerup();
			}*/
                
            }
            this.parent();
            if (this.deathAnimTimer) {
                var delta = this.deathAnimTimer.delta();
                if (delta < 0) {
                    ig.system.camera.position[1] = delta.map( - this.deathAnimTimer.target, 0, 0, -ig.game.collisionMap.tilesize / 4);
                }
                else {
                    this.deathAnimTimer = null;
                    this.dead = true;
                }
            }
        },
        
        setScreenShake: function( shake ) {
		this.screenShakeStrength = shake || 1;
	},
        
        spawnPowerup: function() {
            var powerups = [EntityHealthPickup, EntityGrenadePickup, EntityGrenadePickup, EntityShotgunPickup, EntityShotgunPickup, EntityPistolPickup, EntityPistolPickup];
            var entityClass = powerups.random();
            var pos = this.getRandomSpawnPos();
            this.spawnEntity(entityClass, pos.x, pos.y);
            this.powerupSpawnTimer.reset();
        },
        getRandomSpawnPos: function() {
            var ts = this.floorMap.tilesize;
            while (true) {
                var x = ((Math.random() * this.floorMap.width) | 0) * ts + ts / 2,
                y = ((Math.random() * this.floorMap.height) | 0) * ts + ts / 2;
                if (this.floorMap.getTile(x, y)) {
                    return {
                        x: x,
                        y: y
                    };
                }
            }
        },
        showDeathAnim: function() {
            this.deathAnimTimer = new ig.Timer(1);
        },
        drawWorld: function() {
            if( !this.menu) {
			this.parent();
		}
            //this.parent();
        },
        stopAllSongs: function() {
            this.Level1Song.stop();
            this.IntroSong.stop();
            this.Level2Song.stop();
            this.Level3Song.stop();
            this.Level4Song.stop();
        },
        setlevel1: function() {
            this.menu = null;
            this.loadLevel(LevelTest);
            this.currentLevel = 1;
            this.stopAllSongs();
            this.Level1Song.play();
            ig.game.player.giveWeapon(WeaponFists, 100);
        },
        setlevel2: function() {
            this.menu = null;
            //this.loadLevel(LevelLevel1);
            this.loadLevel(LevelBase1);
            this.currentLevel = 2;
            this.stopAllSongs();
            this.Level2Song.play();
            ig.game.player.giveWeapon(WeaponFists, 100);
        },
        setlevel3: function() {
            this.menu = null;
            this.loadLevel(LevelLevel3);
            this.currentLevel = 3;
            this.stopAllSongs();
            this.Level3Song.play();
            ig.game.player.giveWeapon(WeaponFists, 100);
            ig.game.player.giveWeapon(WeaponPistol, 72);
            ig.game.player.giveWeapon(WeaponShotgun, 48);
        },
        setlevel4: function() {
            this.menu = null;
            this.loadLevel(LevelLevel4);
            this.currentLevel = 4;
            this.stopAllSongs();
            this.Level4Song.play();
            ig.game.player.giveWeapon(WeaponFists, 100);
            ig.game.player.giveWeapon(WeaponPistol, 72);
            ig.game.player.giveWeapon(WeaponShotgun, 48);
            ig.game.player.giveWeapon(WeaponGrenadeLauncher, 16);
        },
        setLevel1Intro: function() {
            this.menu = new Intro1();
        },
        setLevel2Intro: function() {
            this.menu = new Intro2();
        },
        setLevel3Intro: function() {
            this.menu = new Intro3();
        },
        setLevel4Intro: function() {
            this.menu = new Intro4();
        },
        setLevelEnding: function() {
            this.menu = new Ending();
            this.IntroSong.play();
        },
        setLevelCredits: function() {
            this.menu = new Credits();
        },
        setTitle: function() {
            this.menu = new MyTitle();
        },
        drawHud: function() {
            if (this.player) {
                ig.game.hud.draw(this.player, this.player.currentWeapon);
                //ig.game.hud.draw(this.quitButton.label, this.quitButton.x - 10, this.quitButton.y);
                //ig.game.hud.draw(this.levelNameText, this.levelText.x, this.levelText.y);
                //ig.game.hud.draw("TIME: " + Math.round(this.levelTimer.delta()).toString().fromatTime(), this.quitButton.x - 30, this.quitButton.y + 40);
                
            }
            if (this.menu) {
                this.menu.draw();
            }
        }
        
    });
    document.body.className = (ig.System.hasWebGL() ? 'webgl': 'no-webgl') + ' ' + 
    (ig.ua.mobile ? 'mobile': 'desktop');
    var width = 1280;
    var height = 720;
    if (window.Ejecta) {
        var canvas = ig.$('#canvas');
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.style.width = window.innerWidth + 'px';
        canvas.style.height = window.innerHeight + 'px';
    }
    ig.Sound.use = [ig.Sound.FORMAT.OGG, ig.Sound.FORMAT.M4A];
    if (ig.System.hasWebGL()) {
        ig.main('#canvas', MyGame, 60, width, height, 1, tpf.Loader);
    }
    else {
        ig.$('#game').style.display = 'none';
        ig.$('#no-webgl').style.display = 'block';
    }
    
    
    
    
    
    
    
});
                                
                                
                                
                                
                                