/* global window, define, require */

define("game", function (require) {
    var assets = require('assets');
    var game = {};
    
    var elements = {
        level: window.document.getElementById('level'),
        gui: window.document.getElementById('gui'),
        controls: window.document.getElementById('controls')
    };

    var keyListener;

    var States = {
        GAME: 0,
        CUT_SCENE_PLAYING: 1,
        CUT_SCENE_WAITING: 2,

        callback: null
    };

    var controls = {};
    controls[States.GAME] = {
        display: '\u2192: Move Right',
        set: function () {
            keyListener.simple_combo('right', function () {
                delay(scene.speed, function () {
                    move(assets.hero, 'right');
                    scene.position = assets.hero.position;

                    update();
                    render();
                });
            });
        }
    };
    controls[States.CUT_SCENE_PLAYING] = {
        display: ' ',
        set: function () {}
    };
    controls[States.CUT_SCENE_WAITING] = {
        display: 'c: Continue',
        set: function () {
            keyListener.simple_combo('c', function () {
                changeState(States.CUT_SCENE_PLAYING);
                update();
                render();
            });
        }
    };

    var gui = {};
    gui[States.GAME] = 'GUI';
    gui[States.CUT_SCENE_PLAYING] = '';
    gui[States.CUT_SCENE_WAITING] = '';

    var scene = {
        position: 0,
        speed: 100,
        entities: [],
        screen: {
            size: 80,
            buffer: []
        },
        state: null,
        gui: null,
        controls: null
    };

    function changeState(state, callback) {
        scene.state = state;

        scene.gui = gui[state];

        scene.controls = controls[state];
        keyListener.reset();
        controls[state].set();

        render();
        renderGui();
        renderControls();

        if (States.callback !== null) {
            var toCall = States.callback;
            States.callback = null;
            toCall();
        }

        if (callback) States.callback = callback;
    }

    function update() {
        scene.screen.buffer = [];
        scene.entities.forEach(function (entity) {
            // Add to screen buffer
            for (var i = 0; i < entity.character.length; i++) {
                var old = scene.screen.buffer[entity.position + i];
                scene.screen.buffer[entity.position + i] = (old && entity.layer < old.layer) ? old : entity;
            }

            if ("update" in entity) {
                entity.update(game);
            }
        });
    }

    function render() {
        var html = '';
        for (var i = scene.position; i < scene.position + scene.screen.size; i++) {
            if (!(i in scene.screen.buffer)) {
                html += ' ';
            } else {
                var entity = scene.screen.buffer[i];
                var iChar = entity.flipped ?
                    (entity.character.length - (i - entity.position) - 1) : (i - entity.position);

                var flipped = (parseInt(entity.flipmask.split('')[iChar]) ^ (+entity.flipped)) ?
                    'flipped' : '';

                html += '<span class="' + flipped + '" data-tooltip="' + entity.tooltip + '">' +
                    entity.character.split('')[iChar] +
                    '</span>';
            }
        }

        elements.level.innerHTML = html;
        [].forEach.call(elements.level.getElementsByTagName('span'), (function(span) {
            span.addEventListener('mouseenter', function () {
                elements.gui.innerHTML = this.dataset.tooltip;
            });
            span.addEventListener('mouseleave', renderGui);
        }));
    }

    function renderGui() {
        elements.gui.innerHTML = scene.gui;
    }

    function renderControls() {
        elements.controls.innerHTML = scene.controls.display;
    }

    function collide(pos1, pos2) {
        if (pos1 in scene.screen.buffer && pos2 in scene.screen.buffer) {
            var entity1 = scene.screen.buffer[pos1];
            var entity2 = scene.screen.buffer[pos2];
            if (entity1 === entity2) return false;
            if (entity1.collision && entity2.collision) {
                var c1 = true,
                    c2 = true;
                if (typeof (entity1.collision) == 'function')
                    c1 = entity1.collision(entity2);
                if (typeof (entity2.collision) == 'function')
                    c2 = entity2.collision(entity1);
                return c1 && c2;
            }
        }
        return false;
    }

    function delay(time, callback) {
        keyListener.stop_listening();
        var initial = null;

        var step = function (timestamp) {
            var progress;
            if (initial === null) initial = timestamp;
            progress = timestamp - initial;

            if (progress > time) {
                if (callback) callback(); 
                keyListener.listen();
            }
            else window.requestAnimationFrame(step);
        };

        window.requestAnimationFrame(step);
    }

    function move(entity, direction) {
        var modifier = 0;
        if (direction == 'right') modifier = 1;
        if (direction == 'left') modifier = -1;

        if (!collide(entity.position, entity.position + modifier + entity.character.length - 1)) {
            entity.position += modifier;
        }
    }
    
    function start() {
        var keypress = require('keypress');
        keyListener = new keypress.Listener();

        scene.entities.push(assets.hero);
        scene.entities.push(assets.amazon);
        scene.entities.push(assets.club);

        changeState(States.GAME);

        update();
        render();
    }
    
    // Exports
    game.States = States;
    game.scene = scene;
    game.changeState = changeState;
    game.update = update;
    game.render = render;
    game.renderGui = renderGui;
    game.renderControls = renderControls;
    game.collide = collide;
    game.delay = delay;
    game.move = move;
    game.start = start;
    
    return game;
});