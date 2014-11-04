/* global window, define, require, request */

define('voting', function () {
    
    var request = function (url, callback) {
        var request = new window.XMLHttpRequest();
        var wrapper = function(event) {
            callback(JSON.parse(event.target.responseText));
        };
        
        request.addEventListener('load', wrapper);
        request.open('GET', url, true);
        request.send();
    };

    window.document.getElementById('add').addEventListener('click', function (event) {
        var text = window.prompt("What's your feature idea?", "");
        if (text !== null) {
            request(require.config.voting + '?add=' + text, function () {
                window.document.querySelector('#votes ul').innerHTML = '';
                getFeatures();
            });
        }
        event.preventDefault();
    });

    function getFeatures() {
        request('http://projects.game-designer.org/RPGBC/vote.php', function (data) {
            data.forEach(function (feature) {
                window.document.querySelector('#votes ul').innerHTML +=
                    '<li>' +
                    '<span class="vote">' +
                    '<a href="#" class="plus" data-click="' +
                    require.config.voting + '?plus=' + feature[0] + '">+</a>' +
                    '<span id="ftr_' + feature[0] + '">(' + feature[2] + ')</span>' +
                    '<a href="#" class="minus" data-click="' +
                    require.config.voting + '?minus=' + feature[0] + '">-</a>' +
                    '</span>' +
                    feature[1] +
                    '</li>';
            });

            [].forEach.call(window.document.getElementsByClassName('plus'), function (element) {
                element.addEventListener('click', function (event) {
                    var link = element.dataset.click;
                    request(link, function (data) {
                        if (!data.errno) {
                            window.document.getElementById('ftr_' + data.id).innerHTML = '(' + data.votes + ')';
                        }
                    });
                    event.preventDefault();
                });
            });

            [].forEach.call(window.document.getElementsByClassName('minus'), function (element) {
                element.addEventListener('click', function (event) {
                    var link = element.dataset.click;
                    request(link, function (data) {
                        if (!data.errno) {
                            window.document.getElementById('ftr_' + data.id).innerHTML = '(' + data.votes + ')';
                        }
                    });
                    event.preventDefault();
                });
            });
        });
    }

    getFeatures();
});