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

var fullProject = require('./fixtures/full-project');

var fullProjectStr = JSON.stringify(fullProject);
var pbx = require('../lib/pbxProject');
var proj = new pbx('.');

var debugConfiguration = {
    isa: 'XCBuildConfiguration',
    buildSettings: {
        GCC_PREPROCESSOR_DEFINITIONS: [
            '"DEBUG=1"',
            '"$(inherited)"'
        ],
        INFOPLIST_FILE: 'Info.Plist',
        LD_RUNPATH_SEARCH_PATHS: '"$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks"',
        PRODUCT_NAME: '"${TARGET_NAME}"', // eslint-disable-line
        SKIP_INSTALL: 'YES'
    },
    name: 'Debug'
};

var releaseConfiguration = {
    isa: 'XCBuildConfiguration',
    buildSettings: {
        INFOPLIST_FILE: 'Info.Plist',
        LD_RUNPATH_SEARCH_PATHS: '"$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks"',
        PRODUCT_NAME: '"${TARGET_NAME}"', // eslint-disable-line
        SKIP_INSTALL: 'YES'
    },
    name: 'Release'
};

function cleanHash () {
    return JSON.parse(fullProjectStr);
}

exports.setUp = function (callback) {
    proj.hash = cleanHash();
    callback();
};

exports.addXCConfigurationList = {
    'should return an XCConfigurationList': function (test) {
        var myProj = new pbx('test/parser/projects/full.pbxproj').parseSync();
        var xcConfigurationList = myProj.addXCConfigurationList([debugConfiguration, releaseConfiguration], 'Release', 'XCConfigurationList Comment');

        test.ok(typeof xcConfigurationList === 'object');
        test.done();
    },
    'should set a uuid on the XCConfigurationList': function (test) {
        var myProj = new pbx('test/parser/projects/full.pbxproj').parseSync();
        var xcConfigurationList = myProj.addXCConfigurationList([debugConfiguration, releaseConfiguration], 'Release', 'XCConfigurationList Comment');

        test.ok(xcConfigurationList.uuid);
        test.done();
    },
    'should add configurations to pbxBuildConfigurationSection': function (test) {
        var myProj = new pbx('test/parser/projects/full.pbxproj').parseSync();
        var pbxBuildConfigurationSection = myProj.pbxXCBuildConfigurationSection();
        var xcConfigurationList = myProj.addXCConfigurationList([debugConfiguration, releaseConfiguration], 'Release', 'XCConfigurationList Comment');
        var xcConfigurationListConfigurations = xcConfigurationList.xcConfigurationList.buildConfigurations;

        for (var index = 0; index < xcConfigurationListConfigurations.length; index++) {
            var configuration = xcConfigurationListConfigurations[index];
            test.ok(pbxBuildConfigurationSection[configuration.value]);
        }

        test.done();
    },
    'should add XCConfigurationList to pbxXCConfigurationListSection': function (test) {
        var myProj = new pbx('test/parser/projects/full.pbxproj').parseSync();
        var pbxXCConfigurationListSection = myProj.pbxXCConfigurationList();
        var xcConfigurationList = myProj.addXCConfigurationList([debugConfiguration, releaseConfiguration], 'Release', 'XCConfigurationList Comment');

        test.ok(pbxXCConfigurationListSection[xcConfigurationList.uuid]);
        test.done();
    },
    'should add XCConfigurationList object correctly': function (test) {
        var myProj = new pbx('test/parser/projects/full.pbxproj').parseSync();
        var pbxXCConfigurationListSection = myProj.pbxXCConfigurationList();
        var xcConfigurationList = myProj.addXCConfigurationList([debugConfiguration, releaseConfiguration], 'Release', 'XCConfigurationList Comment');
        var xcConfigurationListInPbx = pbxXCConfigurationListSection[xcConfigurationList.uuid];

        test.deepEqual(xcConfigurationListInPbx, xcConfigurationList.xcConfigurationList);
        test.done();
    },
    'should add correct configurations to XCConfigurationList and to pbxBuildConfigurationSection': function (test) {
        var myProj = new pbx('test/parser/projects/full.pbxproj').parseSync();
        var pbxXCConfigurationListSection = myProj.pbxXCConfigurationList();
        var pbxBuildConfigurationSection = myProj.pbxXCBuildConfigurationSection();
        var xcConfigurationList = myProj.addXCConfigurationList([debugConfiguration, releaseConfiguration], 'Release', 'XCConfigurationList Comment');
        var xcConfigurationListConfigurations = xcConfigurationList.xcConfigurationList.buildConfigurations;
        var expectedConfigurations = [];
        var xcConfigurationListInPbx = pbxXCConfigurationListSection[xcConfigurationList.uuid];

        for (var index = 0; index < xcConfigurationListConfigurations.length; index++) {
            var configuration = xcConfigurationListConfigurations[index];
            expectedConfigurations.push(pbxBuildConfigurationSection[configuration.value]);
        }

        test.deepEqual(expectedConfigurations, [debugConfiguration, releaseConfiguration]);
        test.deepEqual(xcConfigurationListInPbx.buildConfigurations, xcConfigurationListConfigurations);
        test.done();
    },
    'should set comments for pbxBuildConfigurations': function (test) {
        var myProj = new pbx('test/parser/projects/full.pbxproj').parseSync();
        var pbxBuildConfigurationSection = myProj.pbxXCBuildConfigurationSection();
        var xcConfigurationList = myProj.addXCConfigurationList([debugConfiguration, releaseConfiguration], 'Release', 'XCConfigurationList Comment');
        var xcConfigurationListConfigurations = xcConfigurationList.xcConfigurationList.buildConfigurations;

        for (var index = 0; index < xcConfigurationListConfigurations.length; index++) {
            var configuration = xcConfigurationListConfigurations[index];
            test.ok(pbxBuildConfigurationSection[configuration.value + '_comment']);
        }

        test.done();
    }
};
