var UI = {};

UI.Element = function () {
};

UI.Element.prototype = {
    setClass: function (name) {
        this.dom.className = name;
        return this;
    },

    setStyle: function (style, array) {
        for (var i = 0; i < array.length; i++) {
            this.dom.style[ style ] = array[ i ];
        }
    },

    setTextContent: function (value) {
        this.dom.textContent = value;
        return this;
    }
}

// properties
var properties = [ 'position', 'left', 'top', 'right', 'bottom', 'width',
    'height', 'border', 'borderLeft', 'borderTop', 'borderRight',
    'borderBottom', 'borderColor', 'display', 'overflow', 'margin',
    'marginLeft', 'marginTop', 'marginRight', 'marginBottom', 'padding',
    'paddingLeft', 'paddingTop', 'paddingRight', 'paddingBottom', 'color',
    'backgroundColor', 'opacity', 'fontSize', 'fontWeight', 'textTransform',
    'cursor' ];

properties.forEach(function (property) {
    var method = 'set' + property.substr(0, 1).toUpperCase() +
        property.substr(1, property.length);
    UI.Element.prototype[ method ] = function () {
        this.setStyle(property, arguments);
        return this;
    };
});

// events

var events = [ 'MouseOver', 'MouseOut', 'Click' ];

events.forEach(function (event) {
    var method = 'on' + event;
    UI.Element.prototype[ method ] = function (callback) {
        this.dom.addEventListener(event.toLowerCase(), callback, false);
        return this;
    };
});


// Panel
UI.Panel = function () {
    UI.Element.call(this);
    var dom = document.createElement('div');
    dom.className = 'Panel';
    dom.style.userSelect = 'none';
    dom.style.WebkitUserSelect = 'none';
    dom.style.MozUserSelect = 'none';
    this.dom = dom;
    return this;
};

UI.Panel.prototype = Object.create(UI.Element.prototype);

UI.Panel.prototype.add = function () {
    for (var i = 0; i < arguments.length; i++) {
        this.dom.appendChild(arguments[ i ].dom);
    }
    return this;
};


UI.Panel.prototype.remove = function () {
    for (var i = 0; i < arguments.length; i++) {
        this.dom.removeChild(arguments[ i ].dom);
    }
    return this;
};

// Text
UI.Text = function (text) {
    UI.Element.call(this);
    var dom = document.createElement('span');
    dom.className = 'Text';
    dom.style.cursor = 'default';
    dom.style.display = 'inline-block';
    dom.style.verticalAlign = 'top';
    this.dom = dom;
    this.setValue(text);
    return this;
};

UI.Text.prototype = Object.create(UI.Element.prototype);

UI.Text.prototype.setValue = function (value) {
    if (value !== undefined) {
        this.dom.textContent = value;
    }
    return this;
};
