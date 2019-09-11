'use strict';

import template from './channelSelect.html';
import controller from './channelSelect.controller';

export default {
    restrict: 'E',
    bindings: {
        'value': '=?',
        'map': '@',
        'usePattern': '=',
        'tip': '@',
        'prerender': '@',
        'inline': '@'
    },
    template,
    controller
};