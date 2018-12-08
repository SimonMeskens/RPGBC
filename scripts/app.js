/* global requirejs, require */

require.config({
    urlArgs: Date.now(),
    paths: {
        "keypress": "https://cdn.jsdelivr.net/gh/dmauro/Keypress@2.0.3/keypress-2.0.3.min.js?",
        "Composer": "https://rawgit.com/jtenner/Composer.js/master/Composer.js?"
    }
});

require(['game', 'voting'], function(game) {
    game.start();
});
