/* global window, define, require */

define('assets', ['Composer'], function (Compose) {
    var assets = {};
    
    var Layers = {
        BACKGROUND: 0,
        NPC: 1,
        PLAYER: 2,
        FOREGROUND: 3
    };

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

    assets.border = {
        position: 170,
        character: ' THE END',
        flipmask:  '00000000',
        flipped: false,
        layer: Layers.BACKGROUND,
        tooltip: 'That\'s all folks! Vote for more features.',
        collision: function (entity) {
            if (entity === assets.hero) {
                return true;
            }
            return false;
        }
    };

    ///// ENTITIES /////

    assets.hero = composit.phrase({
        position: 30,
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
        position: 91,
        character: '\u007B\u2014\u03CE\u003E',
        flipmask: '0000',
        flipped: false,
        layer: Layers.NPC,
        tooltip: 'You see boobies. They\'re attached to an Amazon Warrior.',
        collision: true,
        update: amazonCutscene
    };

    assets.wolf = {
        position: 150,
        character: '\u22E0\u0271',
        flipmask: '00',
        flipped: false,
        layer: Layers.NPC,
        tooltip: 'You see a wolf. You feel better than the wolf.',
        collision: true,
        update: function(game) { attack.call(this, game); },
        attack: function (game) {
            wolfHitCutscene.call(this, game);
        }
    };

    assets.tentacles = {
        position: 0,
        character: '\u0EAA\u0E97\u0E81\u0E82\u0EB3\u0EB8', //04C2 = schoolgirl outfit
        flipmask: '010110',
        flipped: false,
        layer: Layers.BACKGROUND,
        tooltip: 'You see tentacles. You feel bothered.',
        collision: true,
        visited: false,
        update: function(game) { attack.call(this, game); },
        attack: function(game) {
            tentacleCutscene.call(this, game);
        }
    };

    ///// ITEMS /////

    assets.club = {
        position: 120,
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
        update: function(game) { pickUp.call(this, game, 2); }
    };

    ///// ACTIONS /////

    function pickUp(game, slot) {
        var self = this;
        if (game.scene.state === game.States.GAME &&
            Math.abs(self.position - assets.hero.position) == assets.hero.character.length) {

            game.removeControls(self, game.States.GAME);
            game.addControls(self, game.States.GAME, 'p: Pick up', 'p', function() {
                assets.hero.changeEquipment(slot, self);
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

    function attack(game) {
        var self = this;
        if (assets.hero.children[2] !== null && game.scene.state === game.States.GAME &&
            (Math.abs(self.position - assets.hero.position) == assets.hero.character.length ||
            Math.abs(assets.hero.position - self.position == self.character.length))) {

            game.removeControls(self, game.States.GAME);
            game.addControls(self, game.States.GAME, 'a: Attack', 'a', function() {
                if ('attack' in self)
                    self.attack(game);

                game.update();
                game.render();
            });
            if (self === assets.wolf)
                game.addControls(self, game.States.GAME, 'p: Pet', 'p', function() {
                    wolfHitCutscene.call(self, game, true);

                    game.update();
                    game.render();
                });
        }
        else {
            game.removeControls(self, game.States.GAME);
        }
    }

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
                //self.flipped = !self.flipped;
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
    
    function wolfHitCutscene(game, isAltRoute) {
        var self = this;

        game.addControls(self, game.States.CUT_SCENE_WAITING, 'c: Continue', 'c', function() {
            game.changeState(game.States.CUT_SCENE_PLAYING);
            game.update();
            game.render();
        });

        game.changeState(game.States.CUT_SCENE_PLAYING);

        var line1 = function() {
            game.changeState(game.States.CUT_SCENE_WAITING, flipWolf);
            game.scene.gui = 'You are bitten by the wolf! You feel strange...';
            game.renderGui();
        };

        var line2 = function() {
            game.changeState(game.States.CUT_SCENE_WAITING, flipWolf);
            game.scene.gui = 'The wolf runs away...';
            game.renderGui();
        };

        var flipWolf = function() {
            self.flipped = !self.flipped;
            game.update();
            game.render();
            game.delay(game.scene.speed, moveWolf1);
        };

        var moveWolf1 = function() {
            game.move(self, 'right');
            game.update();
            game.render();
            if (Math.abs(self.position - assets.hero.position) < 30) game.delay(game.scene.speed, moveWolf1);
            else howl();
        };

        var howl = function() {
            game.changeState(game.States.CUT_SCENE_WAITING, moveWolf2);
            self.flipped = !self.flipped;
            game.scene.gui = 'The wolf howls eerily...';
            game.update();
            game.render();
            game.renderGui();
            self.flipped = !self.flipped;
        };

        var moveWolf2 = function() {
            game.move(self, 'right');
            game.update();
            game.render();
            if (Math.abs(self.position - assets.hero.position) < 70) game.delay(game.scene.speed, moveWolf2);
            else {
                game.scene.entities.splice(game.scene.entities.indexOf(self), 1);
                game.removeControls(self, game.States.CUT_SCENE_WAITING);
                game.changeState(game.States.GAME);
            }
        };

        game.delay(game.scene.speed, isAltRoute ? line2 : line1);
    }

    function tentacleCutscene(game) {
        var self = this;

        game.addControls(self, game.States.CUT_SCENE_WAITING, 'c: Continue', 'c', function() {
            game.changeState(game.States.CUT_SCENE_PLAYING);
            game.update();
            game.render();
        });

        game.changeState(game.States.CUT_SCENE_PLAYING);

        var line1 = function() {
            game.changeState(game.States.CUT_SCENE_WAITING, line2);
            game.scene.gui = 'Wait, that\'s an exit, not an entrance...';
            game.renderGui();
        };

        var line2 = function() {
            game.changeState(game.States.CUT_SCENE_WAITING, swapClothing);
            game.scene.gui = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH...';
            game.renderGui();
        };

        var line3 = function() {
            game.changeState(game.States.CUT_SCENE_WAITING, flipHero);
            game.scene.gui = 'You\'re not here to adventure, are you?';
            game.renderGui();
        };

        var swapClothing = function() {
            assets.hero.tooltip = 'You see yourself. You\'re wearing a schoolgirl outfit.';
            assets.hero.children[1] = {
                character: '\u04C2',
                flipmask: '0'
            };
            self.visited = true;
            game.removeControls(self, game.States.CUT_SCENE_WAITING);
            game.changeState(game.States.GAME);
        };

        var flipHero = function() {
            assets.hero.flipped = !assets.hero.flipped;
            game.removeControls(self, game.States.CUT_SCENE_WAITING);
            game.changeState(game.States.GAME);
        };

        game.delay(game.scene.speed, self.visited ? line3 : line1);
    }

    return assets;
});
