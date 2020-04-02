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
var pbxFile = require('../lib/pbxFile');
var proj = new pbx('.');

function cleanHash() {
    return JSON.parse(fullProjectStr);
}

exports.setUp = function (callback) {
    proj.hash = cleanHash();
    callback();
}

exports.addResourceFile = {
    'should return a pbxFile': function (test) {
        var newFile = proj.addResourceFile('assets.bundle');

        test.equal(newFile.constructor, pbxFile);
        test.done()
    },
    'should set a uuid on the pbxFile': function (test) {
        var newFile = proj.addResourceFile('assets.bundle');

        test.ok(newFile.uuid);
        test.done()
    },
    'should set a fileRef on the pbxFile': function (test) {
        var newFile = proj.addResourceFile('assets.bundle');

        test.ok(newFile.fileRef);
        test.done()
    },
    'should populate the PBXBuildFile section with 2 fields': function (test) {
        var newFile = proj.addResourceFile('assets.bundle');
        var buildFileSection = proj.pbxBuildFileSection();
        var bfsLength = Object.keys(buildFileSection).length;

        test.equal(60, bfsLength);
        test.ok(buildFileSection[newFile.uuid]);
        test.ok(buildFileSection[newFile.uuid + '_comment']);

        test.done();
    },
    'should add the PBXBuildFile comment correctly': function (test) {
        var newFile = proj.addResourceFile('assets.bundle');
        var commentKey = newFile.uuid + '_comment';
        var buildFileSection = proj.pbxBuildFileSection();

        test.equal(buildFileSection[commentKey], 'assets.bundle in Resources');
        test.done();
    },
    'should add the PBXBuildFile object correctly': function (test) {
        var newFile = proj.addResourceFile('assets.bundle');
        var buildFileSection = proj.pbxBuildFileSection();
        var buildFileEntry = buildFileSection[newFile.uuid];

        test.equal(buildFileEntry.isa, 'PBXBuildFile');
        test.equal(buildFileEntry.fileRef, newFile.fileRef);
        test.equal(buildFileEntry.fileRef_comment, 'assets.bundle');

        test.done();
    },
    'should populate the PBXFileReference section with 2 fields': function (test) {
        var newFile = proj.addResourceFile('assets.bundle');
        var fileRefSection = proj.pbxFileReferenceSection();
        var frsLength = Object.keys(fileRefSection).length;

        test.equal(68, frsLength);
        test.ok(fileRefSection[newFile.fileRef]);
        test.ok(fileRefSection[newFile.fileRef + '_comment']);

        test.done();
    },
    'should populate the PBXFileReference comment correctly': function (test) {
        var newFile = proj.addResourceFile('assets.bundle');
        var fileRefSection = proj.pbxFileReferenceSection();
        var commentKey = newFile.fileRef + '_comment';

        test.equal(fileRefSection[commentKey], 'assets.bundle');
        test.done();
    },
    'should add the PBXFileReference object correctly': function (test) {
        delete proj.pbxGroupByName('Resources').path;

        var newFile = proj.addResourceFile('Resources/assets.bundle');
        var fileRefSection = proj.pbxFileReferenceSection();
        var fileRefEntry = fileRefSection[newFile.fileRef];

        test.equal(fileRefEntry.isa, 'PBXFileReference');
        test.equal(fileRefEntry.fileEncoding, undefined);
        test.equal(fileRefEntry.lastKnownFileType, 'wrapper.plug-in');
        test.equal(fileRefEntry.name, '"assets.bundle"');
        test.equal(fileRefEntry.path, '"Resources/assets.bundle"');
        test.equal(fileRefEntry.sourceTree, '"<group>"');

        test.done();
    },
    'should add to the Resources PBXGroup group': function (test) {
        var newFile = proj.addResourceFile('Resources/assets.bundle');
        var resources = proj.pbxGroupByName('Resources');

        test.equal(resources.children.length, 10);
        test.done();
    },
    'should have the right values for the PBXGroup entry': function (test) {
        var newFile = proj.addResourceFile('Resources/assets.bundle');
        var resources = proj.pbxGroupByName('Resources');
        var resourceObj = resources.children[9];

        test.equal(resourceObj.comment, 'assets.bundle');
        test.equal(resourceObj.value, newFile.fileRef);
        test.done();
    },
    'should add to the PBXSourcesBuildPhase': function (test) {
        var newFile = proj.addResourceFile('Resources/assets.bundle');
        var sources = proj.pbxResourcesBuildPhaseObj();

        test.equal(sources.files.length, 13);
        test.done();
    },
    'should have the right values for the Sources entry': function (test) {
        var newFile = proj.addResourceFile('Resources/assets.bundle');
        var sources = proj.pbxResourcesBuildPhaseObj();
        var sourceObj = sources.files[12];

        test.equal(sourceObj.comment, 'assets.bundle in Resources');
        test.equal(sourceObj.value, newFile.uuid);
        test.done();
    },
    'should remove "Resources/" from path if group path is set': function (test) {
        var resources = proj.pbxGroupByName('Resources');
        var newFile;

        resources.path = '"Test200/Resources"';
        newFile = proj.addResourceFile('Resources/assets.bundle');

        test.equal(newFile.path, 'assets.bundle');
        test.done();
    },
    'when added with { plugin: true }': {

        'should add the PBXFileReference with the "Plugins" path': function (test) {
            delete proj.pbxGroupByName('Plugins').path;

            var newFile = proj.addResourceFile('Plugins/assets.bundle',
                                                { plugin: true });

            var fileRefSection = proj.pbxFileReferenceSection();
            var fileRefEntry = fileRefSection[newFile.fileRef];

            test.equal(fileRefEntry.isa, 'PBXFileReference');
            test.equal(fileRefEntry.fileEncoding, undefined);
            test.equal(fileRefEntry.lastKnownFileType, 'wrapper.plug-in');
            test.equal(fileRefEntry.name, '"assets.bundle"');
            test.equal(fileRefEntry.path, '"Plugins/assets.bundle"');
            test.equal(fileRefEntry.sourceTree, '"<group>"');
            test.done();
        },

        'should add to the Plugins PBXGroup group': function (test) {
            var newFile = proj.addResourceFile('Plugins/assets.bundle',
                                                { plugin: true });

            var plugins = proj.pbxGroupByName('Plugins');

            test.equal(plugins.children.length, 1);
            test.done();
        },

        'should have the Plugins values for the PBXGroup entry': function (test) {
            var newFile = proj.addResourceFile('Plugins/assets.bundle',
                                                { plugin: true });

            var plugins = proj.pbxGroupByName('Plugins');
            var pluginObj = plugins.children[0];

            test.equal(pluginObj.comment, 'assets.bundle');
            test.equal(pluginObj.value, newFile.fileRef);
            test.done();
        },

        'should add to the PBXSourcesBuildPhase': function (test) {
            var newFile = proj.addResourceFile('Plugins/assets.bundle',
                                                { plugin: true });

            var sources = proj.pbxResourcesBuildPhaseObj();

            test.equal(sources.files.length, 13);
            test.done();
        },

        'should have the right values for the Sources entry': function (test) {
            var newFile = proj.addResourceFile('Plugins/assets.bundle',
                                                { plugin: true });

            var sources = proj.pbxResourcesBuildPhaseObj();
            var sourceObj = sources.files[12];

            test.equal(sourceObj.comment, 'assets.bundle in Resources');
            test.equal(sourceObj.value, newFile.uuid);
            test.done();
        },

        'should remove "Plugins/" from path if group path is set': function (test) {
            var plugins = proj.pbxGroupByName('Plugins');
            var newFile;

            plugins.path = '"Test200/Plugins"';
            newFile = proj.addResourceFile('Plugins/assets.bundle',
                                            { plugin: true });

            test.equal(newFile.path, 'assets.bundle');
            test.done();
        }
    },
    'when added with { variantGroup: true }': {

        'should not add to the PBXResourcesBuildPhase and PBXBuildFile': function (test) {
            var newFile = proj.addResourceFile('en.lproj/Localization.strings',
                { variantGroup: true });

            var sources = proj.pbxResourcesBuildPhaseObj();
            test.equal(sources.files.length, 12);

            var buildFileSection = proj.pbxBuildFileSection();
            test.ok(buildFileSection[newFile.uuid] === undefined);

            test.done();
        },

    },
    'duplicate entries': {
        'should return false': function (test) {
            var newFile = proj.addResourceFile('Plugins/assets.bundle');

            test.ok(!proj.addResourceFile('Plugins/assets.bundle'));
            test.done();
        },
        'should return false (plugin entries)': function (test) {
            var newFile = proj.addResourceFile('Plugins/assets.bundle',
                                                { plugin: true });

            test.ok(!proj.addResourceFile('Plugins/assets.bundle',
                                                { plugin: true }));
            test.done();
        },
        'should not add another entry anywhere': function (test) {
            var newFile = proj.addResourceFile('Plugins/assets.bundle');
            var buildFileSection = proj.pbxBuildFileSection();
            var bfsLength = Object.keys(buildFileSection).length;
            var fileRefSection = proj.pbxFileReferenceSection();
            var frsLength = Object.keys(fileRefSection).length;
            var resources = proj.pbxGroupByName('Resources');
            var sources = proj.pbxResourcesBuildPhaseObj();

            proj.addResourceFile('Plugins/assets.bundle');

            // check lengths
            test.equal(60, bfsLength);
            test.equal(68, frsLength);
            test.equal(resources.children.length, 10);
            test.equal(sources.files.length, 13);
            test.done();
        }
    },
    tearDown: function (callback) {
        delete proj.pbxGroupByName('Resources').path;
        callback();
    }
}
