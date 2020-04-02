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

function cleanHash () {
    return JSON.parse(fullProjectStr);
}

exports.setUp = function (callback) {
    proj.hash = cleanHash();
    callback();
};

exports.removeSourceFile = {
    'should return a pbxFile': function (test) {
        proj.addSourceFile('file.m');
        var newFile = proj.removeSourceFile('file.m');

        test.equal(newFile.constructor, pbxFile);
        test.done();
    },
    'should set a uuid on the pbxFile': function (test) {
        proj.addSourceFile('file.m');
        var newFile = proj.removeSourceFile('file.m');

        test.ok(newFile.uuid);
        test.done();
    },
    'should set a fileRef on the pbxFile': function (test) {
        proj.addSourceFile('file.m');
        var newFile = proj.removeSourceFile('file.m');

        test.ok(newFile.fileRef);
        test.done();
    },
    'should remove 2 fields from the PBXBuildFile section': function (test) {
        proj.addSourceFile('file.m');
        var newFile = proj.removeSourceFile('file.m');
        var buildFileSection = proj.pbxBuildFileSection();
        var bfsLength = Object.keys(buildFileSection).length;

        test.equal(58, bfsLength);
        test.ok(!buildFileSection[newFile.uuid]);
        test.ok(!buildFileSection[newFile.uuid + '_comment']);

        test.done();
    },
    'should remove comment from the PBXBuildFile correctly': function (test) {
        proj.addSourceFile('file.m');
        var newFile = proj.removeSourceFile('file.m');
        var commentKey = newFile.uuid + '_comment';
        var buildFileSection = proj.pbxBuildFileSection();
        test.notEqual(!buildFileSection[commentKey], 'file.m in Sources');
        test.done();
    },
    'should remove the PBXBuildFile object correctly': function (test) {
        proj.addSourceFile('file.m');
        var newFile = proj.removeSourceFile('file.m');
        var buildFileSection = proj.pbxBuildFileSection();
        var buildFileEntry = buildFileSection[newFile.uuid];

        test.equal(buildFileEntry, undefined);

        test.done();
    },
    'should remove 2 fields from the PBXFileReference section': function (test) {
        proj.addSourceFile('file.m');
        var newFile = proj.removeSourceFile('file.m');
        var fileRefSection = proj.pbxFileReferenceSection();
        var frsLength = Object.keys(fileRefSection).length;

        test.equal(66, frsLength);
        test.ok(!fileRefSection[newFile.fileRef]);
        test.ok(!fileRefSection[newFile.fileRef + '_comment']);

        test.done();
    },
    'should remove the PBXFileReference comment correctly': function (test) {
        proj.addSourceFile('file.m');
        var newFile = proj.removeSourceFile('file.m');
        var fileRefSection = proj.pbxFileReferenceSection();
        var commentKey = newFile.fileRef + '_comment';

        test.ok(!fileRefSection[commentKey]);
        test.done();
    },
    'should remove the PBXFileReference object correctly': function (test) {
        proj.addSourceFile('file.m');
        var newFile = proj.removeSourceFile('Plugins/file.m');
        var fileRefSection = proj.pbxFileReferenceSection();
        var fileRefEntry = fileRefSection[newFile.fileRef];
        test.ok(!fileRefEntry);
        test.done();
    },
    'should remove from the Plugins PBXGroup group': function (test) {
        proj.addSourceFile('Plugins/file.m');
        var newFile = proj.removeSourceFile('Plugins/file.m');
        var plugins = proj.pbxGroupByName('Plugins');
        test.equal(plugins.children.length, 0);
        test.done();
    },
    'should have the right values for the PBXGroup entry': function (test) {
        proj.addSourceFile('Plugins/file.m');
        var newFile = proj.removeSourceFile('Plugins/file.m');
        var plugins = proj.pbxGroupByName('Plugins');
        var pluginObj = plugins.children[0];

        test.ok(!pluginObj);
        test.done();
    },
    'should remove from the PBXSourcesBuildPhase': function (test) {
        proj.addSourceFile('Plugins/file.m');
        var newFile = proj.removeSourceFile('Plugins/file.m');
        var sources = proj.pbxSourcesBuildPhaseObj();

        test.equal(sources.files.length, 2);
        test.done();
    },
    'should have the right values for the Sources entry': function (test) {
        proj.addSourceFile('Plugins/file.m');
        var newFile = proj.removeSourceFile('Plugins/file.m');
        var sources = proj.pbxSourcesBuildPhaseObj();
        var sourceObj = sources.files[2];

        test.ok(!sourceObj);
        test.done();
    },
    'should remove file from PBXFileReference after modified by Xcode': function (test) {
        var fileRef = proj.addSourceFile('Plugins/file.m').fileRef;

        // Simulate Xcode's behaviour of stripping quotes around path and name
        // properties.
        var entry = proj.pbxFileReferenceSection()[fileRef];
        entry.name = entry.name.replace(/^"(.*)"$/, '$1');
        entry.path = entry.path.replace(/^"(.*)"$/, '$1');

        var newFile = proj.removeSourceFile('Plugins/file.m');

        test.ok(newFile.uuid);
        test.ok(!proj.pbxFileReferenceSection()[fileRef]);
        test.done();
    }
};
