/* global requirejs, require */

require.config({
    urlArgs: Date.now(),
    paths: {
      "keypress": "https://rawgit.com/dmauro/Keypress/2.0.3/keypress-2.0.3.min.js?"
    }
});

require(['game', 'voting'], function(game) {
    game.start();
});