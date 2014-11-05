/* global window, define, require */

define('assets', ['Composer'], function (Compose) {
    var assets = {};
    
    var Layers = {
        BACKGROUND: 0,
        NPC: 1,
        PLAYER: 2,
        FOREGROUND: 3
    };

    ///// ENTITIES /////

    var composit = Compose.phrase({
        children: [],
        changeEquipment: function (slot, entity) {
            this.children[slot] = entity;
        }
    })
    .dynamic({
        character: {
            get: function() {
                return this.children.reduce(function(prev, curr) {
                    if (curr !== null)
                        return prev + curr.character;
                    else
                        return prev;
                }, '');
            },
            set: function() {}
        },
        flipmask: {
            get: function() {
                return this.children.reduce(function(prev, curr) {
                    if (curr !== null)
                        return prev + curr.flipmask;
                    else
                        return prev;
                }, '');
            },
            set: function() {}
        }
    });

    assets.hero = composit.phrase({
        position: 0,
        flipped: true,
        layer: Layers.PLAYER,
        tooltip: 'You see yourself. Can one ever truly see himself? Solipsism FTW.',
        collision: true
    })();
    assets.hero.children = [ null, {
        character: '\u006F',
        flipmask: '0'
    }, null ];

    assets.amazon = {
        position: 61,
        character: '\u007B\u2014\u03CE\u003E',
        flipmask: '0000',
        flipped: false,
        layer: Layers.NPC,
        tooltip: 'You see boobies. They\'re attached to an Amazon Warrior.',
        collision: true,
        update: amazonCutscene
    };

    ///// ITEMS /////

    assets.club = {
        position: 90,
        name: 'Club',
        character: '\u0021',
        flipmask: '0',
        flipped: false,
        layer: Layers.BACKGROUND,
        tooltip: 'You see a club, but no baby seals.',
        collision: function (entity) {
            if (entity === assets.hero) {
                return true;
            }
            return false;
        },
        update: function(game) {
            var self = this;
            if (game.scene.state === game.States.GAME && Math.abs(self.position - assets.hero.position) == 1) {
                game.removeControls(self, game.States.GAME);
                game.addControls(assets.club, game.States.GAME, 'p: Pick up', 'p', function() {
                    assets.hero.changeEquipment(2, assets.club);
                    game.removeControls(self, game.States.GAME);
                    game.scene.entities.splice(game.scene.entities.indexOf(self), 1);
                    game.update();
                    game.render();
                });
            }
            else {
                game.removeControls(self, game.States.GAME);
            }
        }
    };

    ///// CUTSCENES /////

    function amazonCutscene(game) {
        var self = this;
        if (game.scene.state === game.States.GAME && Math.abs(self.position - assets.hero.position) < 30) {

            game.addControls(self, game.States.CUT_SCENE_WAITING, 'c: Continue', 'c', function() {
                game.changeState(game.States.CUT_SCENE_PLAYING);
                game.update();
                game.render();
            });

            game.changeState(game.States.CUT_SCENE_PLAYING);

            var moveHero = function () {
                game.move(assets.hero, 'right');
                game.update();
                game.render();
                if (Math.abs(self.position - assets.hero.position) > 5) game.delay(game.scene.speed, moveHero);
                else line1();
            };
            var line1 = function () {
                game.changeState(game.States.CUT_SCENE_WAITING, line2);
                game.scene.gui = 'Amazon Warrior: Welcome adventurer!';
                game.renderGui();
            };
            var line2 = function () {
                game.changeState(game.States.CUT_SCENE_WAITING, flipAmazon);
                game.scene.gui = 'Amazon Warrior: My village is just ahead.';
                game.renderGui();
            };
            var flipAmazon = function () {
                self.flipped = !self.flipped;
                game.update();
                game.render();
                game.delay(game.scene.speed, moveAmazon);
            };
            var moveAmazon = function () {
                if (assets.hero.position > game.scene.position) {
                    game.move(assets.hero, 'left');
                }
                game.move(self, 'right');
                game.update();
                game.render();
                if (Math.abs(self.position - assets.hero.position) < 70) game.delay(game.scene.speed, moveAmazon);
                else {
                    game.scene.entities.splice(game.scene.entities.indexOf(self), 1);
                    game.removeControls(self, game.States.CUT_SCENE_WAITING);
                    game.changeState(game.States.GAME);
                }
            };

            game.delay(game.scene.speed, moveHero);
        }
    }
    
    return assets;
});
