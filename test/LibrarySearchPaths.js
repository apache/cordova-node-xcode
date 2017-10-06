/**
 Licensed to the Apache Software Foundation (ASF) under one
 or more contributor license agreements.  See the NOTICE file
 distributed with this work for additional information
 regarding copyright ownership.  The ASF licenses this file
 to you under the Apache License, Version 2.0 (the
 'License'); you may not use this file except in compliance
 with the License.  You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an
 'AS IS' BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied.  See the License for the
 specific language governing permissions and limitations
 under the License.
 */

var fullProject = require('./fixtures/full-project')
    fullProjectStr = JSON.stringify(fullProject),
    pbx = require('../lib/pbxProject'),
    pbxFile = require('../lib/pbxFile'),
    proj = new pbx('.');

function cleanHash() {
    return JSON.parse(fullProjectStr);
}

exports.setUp = function (callback) {
    proj.hash = cleanHash();
    callback();
}

var PRODUCT_NAME = '"KitchenSinktablet"';

exports.addAndRemoveToFromLibrarySearchPaths = {
    'add should add the path to each configuration section':function(test) {
        proj.addToLibrarySearchPaths({
            path:'some/path/poop.a'
        });
        var config = proj.pbxXCBuildConfigurationSection();
        for (var ref in config) {
            if (ref.indexOf('_comment') > -1 || config[ref].buildSettings.PRODUCT_NAME != PRODUCT_NAME) continue;
            var lib = config[ref].buildSettings.LIBRARY_SEARCH_PATHS;
            test.ok(lib[1].indexOf('$(SRCROOT)/KitchenSinktablet/some/path') > -1);
        }
        test.done();
    },
    'add should not mangle string arguments and add to each config section':function(test) {
        var libPath = '../../some/path';
        proj.addToLibrarySearchPaths(libPath);
        var config = proj.pbxXCBuildConfigurationSection();
        for (var ref in config) {
            if (ref.indexOf('_comment') > -1 || config[ref].buildSettings.PRODUCT_NAME != PRODUCT_NAME) continue;
            var lib = config[ref].buildSettings.LIBRARY_SEARCH_PATHS;
            test.ok(lib[1].indexOf(libPath) > -1);
        }
        test.done();
    },
    'remove should remove from the path to each configuration section':function(test) {
        var libPath = 'some/path/poop.a';
        proj.addToLibrarySearchPaths({
            path:libPath
        });
        proj.removeFromLibrarySearchPaths({
            path:libPath
        });
        var config = proj.pbxXCBuildConfigurationSection();
        for (var ref in config) {
            if (ref.indexOf('_comment') > -1 || config[ref].buildSettings.PRODUCT_NAME != PRODUCT_NAME) continue;
            var lib = config[ref].buildSettings.LIBRARY_SEARCH_PATHS;
            test.ok(lib.length === 1);
            test.ok(lib[0].indexOf('$(SRCROOT)/KitchenSinktablet/some/path') == -1);
        }
        test.done();
    }
}
