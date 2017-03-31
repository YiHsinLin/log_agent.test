var assert = require('assert');

var ex = function loadTesteeFunction(exp) {
    var fs = require('fs'),
        path = require('path'),
        vm2 = require('vm2'),

        VM = vm2.VM,
        NodeVM = vm2.NodeVM;

    var script = function loadScript() {
        var script = fs.readFileSync(path.join(__dirname, '../index.js'));

        script = script + '';
        var begin = script.indexOf('//private-function-begin'),
            end = script.indexOf('//private-function-end');

        return script.substring(begin, end);
    }();

    var sandbox = {};
    vm = new NodeVM({sandbox: sandbox});

    return vm.run(script + ';module.exports = exports = ' + exp);
}('{makeContext: makeContext}');

function makeContext(configObj, address) {
    return ex.makeContext(configObj, address);
}

describe('Config', function() {
    describe('mixin', function () {
        var configObj = {
            "proxy": {
                "baseurl": "http://localhost:9200",
                "baseindex": "/mars/test/",
                "source": {
                    "192.168.137.101": {
                        "baseindex": "/mars/onos/"
                    },
                    "192.168.137.102": {
                        "baseurl": "http://localhost:9201",
                        "baseindex": "/mars/onos/"
                    }
                }
            }
        };

        var cloneConfigObj = Object.assign({}, configObj);

        afterEach(function () {
            assert.deepEqual(configObj, cloneConfigObj);
        });

        it('should use default config', function() {
            var ctx = makeContext(configObj, "192.168.137.101");
            assert.deepEqual(ctx, {
                "baseurl": "http://localhost:9200",
                "baseindex": "/mars/onos/"
            });

            ctx = makeContext(configObj, "192.168.137.102");
            assert.deepEqual(ctx, {
                "baseurl": "http://localhost:9201",
                "baseindex": "/mars/onos/"
            });

            ctx = makeContext(configObj, "192.168.137.200");
            assert.deepEqual(ctx, {
                "baseurl": "http://localhost:9200",
                "baseindex": "/mars/test/"
            });
        });
    });
});
