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

var xcode5proj = require('./fixtures/library-search-paths')
    xcode5projStr = JSON.stringify(xcode5proj),
    pbx = require('../lib/pbxProject'),
    pbxFile = require('../lib/pbxFile'),
    proj = new pbx('.'),
    libPoop = { path: 'some/path/poop.a' };

function cleanHash() {
    return JSON.parse(xcode5projStr);
}

exports.setUp = function (callback) {
    proj.hash = cleanHash();
    callback();
}

var PRODUCT_NAME = '"$(TARGET_NAME)"';

exports.addAndRemoveToFromLibrarySearchPaths = {
    'add should add the path to each configuration section':function(test) {
        var expected = '"\\"$(SRCROOT)/$(TARGET_NAME)/some/path\\""',
            config = proj.pbxXCBuildConfigurationSection(),
            ref, lib, refSettings;

        proj.addToLibrarySearchPaths(libPoop);

        for (ref in config) {
            if (ref.indexOf('_comment') > -1)
                continue;

            refSettings = config[ref].buildSettings;

            if (refSettings.PRODUCT_NAME != PRODUCT_NAME)
                continue;

            lib = refSettings.LIBRARY_SEARCH_PATHS;
            test.equal(lib[1], expected);
        }
        test.done();
    },

    'remove should remove from the path to each configuration section':function(test) {
        var config, ref, lib;

        proj.addToLibrarySearchPaths(libPoop);
        proj.removeFromLibrarySearchPaths(libPoop);

        config = proj.pbxXCBuildConfigurationSection();
        for (ref in config) {
            if (ref.indexOf('_comment') > -1 || config[ref].buildSettings.PRODUCT_NAME != PRODUCT_NAME) continue;

            lib = config[ref].buildSettings.LIBRARY_SEARCH_PATHS;
            test.ok(lib.length === 1);
            test.ok(lib[0].indexOf('$(SRCROOT)/KitchenSinktablet/some/path') == -1);
        }
        test.done();
    }
}
