var css = require('css'),
    color = require('onecolor'),
    fs = require('fs'),
    Identity = require('css/lib/stringify/identity');
    

var RE_IMPORTANT = /\s*!important/;
var RE_COLOR = /#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3} )/;
//var RE_COLOR = /#([A-Fa-f0-9]{3})/;

// -- Replacement Maps -----------------

var SASS_PROPERTIES = {
    'color' : [],
    'background' : [],
    'background-color' : [],
    'background-image' : [],
    'border' : [],
    'font' : [],
    'font-family' : []
};
var SASS_MIXINS = {
    '-moz-border-radius' : 'border-radius',
    '-webkit-border-radius' : 'border-radius',
    'border-radius' : 'border-radius',
    '-moz-box-shadow' : 'box-shadow',
    '-webkit-box-shadow' : 'box-shadow',
    'box-shadow' : 'box-shadow'
};

/**
 * Add 'Visit import node.' to Stringify constructor, to emit scss node.
 * this should be moved to a separate library
 */

Identity.prototype.include = function (node) {
  return this.emit('@include ' + node.include + '(' + node.value + ');', node.position);
};


/**
 * Sassify whole css
 *
 * @param {String} str
 * @param {Object} [options]
 * @returns {String}
 */

function sassifyCss(str, options) {
    var newSassFile, ast, sassvar;
    newSassFile = '@include \'_mixins.scss\';\n@include \'_variables.scss\';\n';
    ast = css.parse(str, options);
    console.log(ast.stylesheet.rules[0]);
    sassifyNode(ast.stylesheet);
    if (fs.existsSync('/output')) {
        fs.mkdir('output', '0755');
    } fs.createReadStream('scss/_mixins.scss').pipe(fs.createWriteStream('output/_mixins.scss'));
    createVariableFile(SASS_PROPERTIES);
    newSassFile +=  css.stringify(ast, options);
    fs.writeFileSync('output/sass-file.scss', newSassFile);
}

/**
 * Sassify single node, recursively
 *
 * @param {Object} node
 */
function sassifyNode(node) {
    var rules = node.rules || node.keyframes || [];
    rules.forEach(function (rule) {
        if (rule.declarations) {
            if (rule.type !== 'comment') {
                //console.log(node);
                sassifyDeclarations(rule.declarations);
            }
        } else {
            sassifyNode(rule);
        }
    });
}

/**
 * Check if property value needs to be converted
 *
 * @param {Object} declaration
 * @returns {Boolean}
 */
function isSassDeclaration(declaration) {
    return SASS_PROPERTIES.hasOwnProperty(declaration.property);
}
/**
 * Check if property needs to be converted
 *
 * @param {Object} declaration
 * @returns {Boolean}
 */
function isSassMixin(declaration) {
    return SASS_MIXINS.hasOwnProperty(declaration.property);
}

/**
 * Sassify single declaration
 *
 * @param {Object} declaration
 */
function sassifyDeclaration(declaration, i, all) {
    if (declaration.type !== 'comment') {
        var name = (declaration.property || declaration.name).toLowerCase();
        if (isSassMixin(declaration)){
            all[i] = replaceMixin(name, declaration, all, i);
        }  
        if (isSassDeclaration(declaration) ) {
            declaration.value = sassifyValue(name, declaration.value);
        }
    }
    return declaration;
}

/**
 * Sassify a group of `declarations`
 *
 * @param {Array} declarations
 */
function sassifyDeclarations (declarations) {
    return declarations.map(function (declaration, i, all) {
        return sassifyDeclaration(declaration, i, all);
    });
}

/**
 * Map values in shorthand properties
 * @param {String} property
 * @return {Array} properties
 */
function arrayofValues (property, value) {
    var array =  value.split(" ");
    array.forEach(function(val, i, arr) {
        if (color(val)) {
            var hex = val.replace(/^#?([0-9a-f])([0-9a-f])([0-9a-f])$/i, '#$1$1$2$2$3$3');
            arr[i] = recordValue(property, hex);
        }
    });
    val = array.join(' ');
    return val;
}

/**
 * Map property to relevant shorthand properties
 * @param {String} property
 * @return {Array} property
 */
function mapProperty(property) {
    if (property.indexOf("-") > 0) {
        property_content = property.split("-");
        return property_content[0];
    }
    return property;
}


/**
 * Check all property in current declaration for mixin,
 * delete property and replace with relative mixin
 * @param {String} property
 * @param {Object} AST property node
 * @param {Object} AST declaration node
 * @return {Object} new AST declaration node
 */
function replaceMixin(name, node, all) {
    var mixin = '', newNode = {};
    mixin = SASS_MIXINS[name];
    all.forEach(function (declaration, index, array) {
        var continuemixin = SASS_MIXINS[declaration.property];
        if (mixin === continuemixin && declaration.value === node.value) {
            array.splice(index, 1);
        }
    });
    newNode = {
        type: 'include',
        include: mixin,
        value: node.value
    };
    return newNode;
}
/**
 * Sassify the given `value`
 *
 * @param {String} property
 * @param {String} value
 * @return {String}
 */
function sassifyValue(property, value) {
    var newValue = '',
        isImportant = value.match(RE_IMPORTANT);
    if (isImportant) {
        newValue = value.replace(RE_IMPORTANT, '').trim();
    } else {
        newValue = value.trim();
    }
    newValue = arrayofValues(property, newValue);
    if (isImportant && !RE_IMPORTANT.test(newValue)) {
        newValue += isImportant[0];
    }
    return newValue;
}

/**
 * Save value in object
 *
 * @param {String} 
 * @return {String}
 */
function recordValue(property, value) {
    var newProperty = '',
        valueIndex,
        labelValue;
    newProperty = mapProperty(property);
    valueIndex = SASS_PROPERTIES[newProperty].indexOf(value.trim())
    if (valueIndex !== -1) {
        labelValue = '$' + newProperty + valueIndex.toString();
    } else {
        valueIndex = SASS_PROPERTIES[newProperty].push(value.trim());
        //valueIndex is length
        valueIndex--;
        labelValue = '$' + newProperty + valueIndex.toString();
    }

    return labelValue;
}

/**
 * Convert variable array to variable file
 *
 * @param {Object} properties
 * @return {String}
 */
function createVariableFile(properties) {
    var declarations = '';
    for (property in properties) {
        if (properties.hasOwnProperty(property)) {
            properties[property].forEach(function(value, index) {
                declarations += '$' + property + index.toString() + ': ';
                declarations += value + ';\n';
            });
        }
    }
    fs.writeFileSync('output/_variables.scss', declarations);
    //return declarations;
}


module.exports.sassifyCss = sassifyCss;
