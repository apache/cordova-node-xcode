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

const xcode5proj = require('./fixtures/library-search-paths');
const xcode5projStr = JSON.stringify(xcode5proj);
const pbx = require('../lib/pbxProject');
const pbxFile = require('../lib/pbxFile');
const proj = new pbx('.');
const libPoop = { path: 'some/path/poop.a' };

function cleanHash () {
    return JSON.parse(xcode5projStr);
}

exports.setUp = function (callback) {
    proj.hash = cleanHash();
    callback();
};

const PRODUCT_NAME = '"$(TARGET_NAME)"';

exports.addAndRemoveToFromLibrarySearchPaths = {
    'add should add the path to each configuration section': function (test) {
        const expected = '"\\"$(SRCROOT)/$(TARGET_NAME)/some/path\\""';
        const config = proj.pbxXCBuildConfigurationSection();
        let ref;
        let lib;
        let refSettings;

        proj.addToLibrarySearchPaths(libPoop);

        for (ref in config) {
            if (ref.indexOf('_comment') > -1) continue;

            refSettings = config[ref].buildSettings;

            if (refSettings.PRODUCT_NAME != PRODUCT_NAME) continue;

            lib = refSettings.LIBRARY_SEARCH_PATHS;
            test.equal(lib[1], expected);
        }
        test.done();
    },

    'remove should remove from the path to each configuration section': function (
        test
    ) {
        let ref, lib;

        proj.addToLibrarySearchPaths(libPoop);
        proj.removeFromLibrarySearchPaths(libPoop);

        const config = proj.pbxXCBuildConfigurationSection();

        for (ref in config) {
            if (
                ref.indexOf('_comment') > -1 ||
                config[ref].buildSettings.PRODUCT_NAME != PRODUCT_NAME
            )
                continue;

            lib = config[ref].buildSettings.LIBRARY_SEARCH_PATHS;
            test.ok(lib.length === 1);
            test.ok(
                lib[0].indexOf('$(SRCROOT)/KitchenSinktablet/some/path') == -1
            );
        }
        test.done();
    }
};
