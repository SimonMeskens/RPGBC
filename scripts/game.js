/* global window, define, require */

define('game', ['keypress', 'assets'], function (keypress, assets) {
    var game = {};
    
    var elements = {
        level: window.document.getElementById('level').firstChild,
        gui: window.document.getElementById('gui'),
        controls: window.document.getElementById('controls')
    };

    var States = {
        GAME: 0,
        CUT_SCENE_PLAYING: 1,
        CUT_SCENE_WAITING: 2,

        callback: null
    };
    Object.defineProperty(States, 'callback', {
        enumerable: false
    });

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

    var controls = {};

    for (var key in States) {
        controls[States[key]] = new Map();
    }

    function addControls(entity, state, display, key, fn) {
        var control = {
            display: display,
            set: function() {
                scene.keyListener.simple_combo(key, fn);
            }
        };

        if (controls[state].has(entity)) {
            controls[state].get(entity).display += ', ' + control.display;
            var prev = controls[state].get(entity).set;
            controls[state].get(entity).set = function () {
                prev();
                control.set();
            };
        }
        else {
            controls[state].set(entity, control);
        }

        if (scene.state === state) {
            var callback = States.callback;
            States.callback = null;
            changeState(state);
            States.callback = callback;
        }
    }

    function removeControls(entity, state) {
        controls[state].delete(entity);

        if (scene.state === state) {
            var callback = States.callback;
            States.callback = null;
            changeState(state);
            States.callback = callback;
        }
    }

    addControls(States, States.GAME, '\u2192: Move Right', 'right', function() {
        delay(scene.speed, function () {
            move(assets.hero, 'right');
            scene.position = assets.hero.position;

            update();
            render();
        });
    });

    addControls(States, States.GAME, '\u2190: Move Left', 'left', function() {
        delay(scene.speed, function () {
            move(assets.hero, 'left');
            scene.position = assets.hero.position;

            update();
            render();
        });
    });

    var gui = {};
    gui[States.GAME] = function() {
        var description = 'Weapon: ';

        if (assets.hero.children[2] !== null)
            description += assets.hero.children[2].name;
        else
            description += 'None';

        return description;
    };
    gui[States.CUT_SCENE_PLAYING] = '';
    gui[States.CUT_SCENE_WAITING] = '';

    function changeState(state, callback) {
        scene.state = state;

        scene.gui = gui[state];

        scene.controls = controls[state];
        scene.keyListener.reset();

        controls[state].forEach(function(value, key) {
            value.set();
        });

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
        if (typeof scene.gui == 'string')
            elements.gui.innerHTML = scene.gui;
        else
            elements.gui.innerHTML = scene.gui();
    }

    function renderControls() {
        elements.controls.innerHTML = '';

        controls[scene.state].forEach(function(value, key) {
            elements.controls.innerHTML += value.display + ', ';
        });

        elements.controls.innerHTML = elements.controls.innerHTML.substr(0, elements.controls.innerHTML.length - 2);
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
        scene.keyListener.stop_listening();
        var initial = null;

        var step = function (timestamp) {
            var progress;
            if (initial === null) initial = timestamp;
            progress = timestamp - initial;

            if (progress > time) {
                if (callback) callback(); 
                scene.keyListener.listen();
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
        scene.keyListener = new keypress.Listener();

        scene.entities.push(assets.hero);
        scene.entities.push(assets.amazon);
        scene.entities.push(assets.club);
        scene.entities.push(assets.wolf);

        scene.entities.push(assets.border);

        changeState(States.GAME);

        update();
        render();
    }
    
    // Exports
    game.States = States;
    game.scene = scene;
    game.addControls = addControls;
    game.removeControls = removeControls;
    game.changeState = changeState;
    game.controls = controls;
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
