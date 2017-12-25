var uuid = require('uuid');

/*const htmlEscapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    '\'': '&#x27;',
    '`': '&#x60;',
    '/': '&#x2F;'
};

function createHtmlEscaper(map) {
    let escaper = function(match) {
        return map[match];
    };

    let source = '(?:' + Object.keys(map).join('|') + ')';
    let testRegexp = RegExp(source);
    let replaceRegexp = RegExp(source, 'g');
    return function(string) {
        string = string == null ? '' : '' + string;
        return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
    };
};

const escapeHtml = createHtmlEscaper(htmlEscapeMap);*/

function cmdGlobal(io, socket, params) {
    io.emit('new message', {
        id: uuid(),
        action: 'global',
        display_name: socket.user.display_name,
        message: params.join(' ')
    });
}

exports.parse = function(io, socket, command) {
    command = command.toString().split(' ');

    if (!command[0]) {
        return;
    }

    const action = command.shift().toLowerCase();
    const params = command;

    switch(action) {
        case '/global':
            return cmdGlobal(io, socket, params)
            break;
    }
};