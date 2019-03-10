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

const fullProject = require('./fixtures/full-project');
const fullProjectStr = JSON.stringify(fullProject);
const pbx = require('../lib/pbxProject');
const pbxFile = require('../lib/pbxFile');
const proj = new pbx('.');

function cleanHash () {
    return JSON.parse(fullProjectStr);
}

exports.setUp = function (callback) {
    proj.hash = cleanHash();
    callback();
};

exports.addSourceFile = {
    'should return a pbxFile': function (test) {
        const newFile = proj.addSourceFile('file.m');

        test.equal(newFile.constructor, pbxFile);
        test.done();
    },
    'should set a uuid on the pbxFile': function (test) {
        const newFile = proj.addSourceFile('file.m');

        test.ok(newFile.uuid);
        test.done();
    },
    'should set a fileRef on the pbxFile': function (test) {
        const newFile = proj.addSourceFile('file.m');

        test.ok(newFile.fileRef);
        test.done();
    },
    'should populate the PBXBuildFile section with 2 fields': function (test) {
        const newFile = proj.addSourceFile('file.m');
        const buildFileSection = proj.pbxBuildFileSection();
        const bfsLength = Object.keys(buildFileSection).length;

        test.equal(60, bfsLength);
        test.ok(buildFileSection[newFile.uuid]);
        test.ok(buildFileSection[newFile.uuid + '_comment']);

        test.done();
    },
    'should add the PBXBuildFile comment correctly': function (test) {
        const newFile = proj.addSourceFile('file.m');
        const commentKey = newFile.uuid + '_comment';
        const buildFileSection = proj.pbxBuildFileSection();

        test.equal(buildFileSection[commentKey], 'file.m in Sources');
        test.done();
    },
    'should add the PBXBuildFile object correctly': function (test) {
        const newFile = proj.addSourceFile('file.m');
        const buildFileSection = proj.pbxBuildFileSection();
        const buildFileEntry = buildFileSection[newFile.uuid];

        test.equal(buildFileEntry.isa, 'PBXBuildFile');
        test.equal(buildFileEntry.fileRef, newFile.fileRef);
        test.equal(buildFileEntry.fileRef_comment, 'file.m');

        test.done();
    },
    'should populate the PBXFileReference section with 2 fields': function (
        test
    ) {
        const newFile = proj.addSourceFile('file.m');
        const fileRefSection = proj.pbxFileReferenceSection();
        const frsLength = Object.keys(fileRefSection).length;

        test.equal(68, frsLength);
        test.ok(fileRefSection[newFile.fileRef]);
        test.ok(fileRefSection[newFile.fileRef + '_comment']);

        test.done();
    },
    'should populate the PBXFileReference comment correctly': function (test) {
        const newFile = proj.addSourceFile('file.m');
        const fileRefSection = proj.pbxFileReferenceSection();
        const commentKey = newFile.fileRef + '_comment';

        test.equal(fileRefSection[commentKey], 'file.m');
        test.done();
    },
    'should add the PBXFileReference object correctly': function (test) {
        const newFile = proj.addSourceFile('Plugins/file.m');
        const fileRefSection = proj.pbxFileReferenceSection();
        const fileRefEntry = fileRefSection[newFile.fileRef];

        test.equal(fileRefEntry.isa, 'PBXFileReference');
        test.equal(fileRefEntry.fileEncoding, 4);
        test.equal(fileRefEntry.lastKnownFileType, 'sourcecode.c.objc');
        test.equal(fileRefEntry.name, '"file.m"');
        test.equal(fileRefEntry.path, '"file.m"');
        test.equal(fileRefEntry.sourceTree, '"<group>"');

        test.done();
    },
    'should add to the Plugins PBXGroup group': function (test) {
        const newFile = proj.addSourceFile('Plugins/file.m');
        const plugins = proj.pbxGroupByName('Plugins');

        test.equal(plugins.children.length, 1);
        test.done();
    },
    'should have the right values for the PBXGroup entry': function (test) {
        const newFile = proj.addSourceFile('Plugins/file.m');
        const plugins = proj.pbxGroupByName('Plugins');
        const pluginObj = plugins.children[0];

        test.equal(pluginObj.comment, 'file.m');
        test.equal(pluginObj.value, newFile.fileRef);
        test.done();
    },
    'should add to the PBXSourcesBuildPhase': function (test) {
        const newFile = proj.addSourceFile('Plugins/file.m');
        const sources = proj.pbxSourcesBuildPhaseObj();

        test.equal(sources.files.length, 3);
        test.done();
    },
    'should have the right values for the Sources entry': function (test) {
        const newFile = proj.addSourceFile('Plugins/file.m');
        const sources = proj.pbxSourcesBuildPhaseObj();
        const sourceObj = sources.files[2];

        test.equal(sourceObj.comment, 'file.m in Sources');
        test.equal(sourceObj.value, newFile.uuid);
        test.done();
    },
    'duplicate entries': {
        'should return false': function (test) {
            const newFile = proj.addSourceFile('Plugins/file.m');

            test.ok(!proj.addSourceFile('Plugins/file.m'));
            test.done();
        },
        'should not add another entry anywhere': function (test) {
            const newFile = proj.addSourceFile('Plugins/file.m');
            const buildFileSection = proj.pbxBuildFileSection();
            const bfsLength = Object.keys(buildFileSection).length;
            const fileRefSection = proj.pbxFileReferenceSection();
            const frsLength = Object.keys(fileRefSection).length;
            const plugins = proj.pbxGroupByName('Plugins');
            const sources = proj.pbxSourcesBuildPhaseObj();

            // duplicate!
            proj.addSourceFile('Plugins/file.m');

            test.equal(60, bfsLength); // BuildFileSection
            test.equal(68, frsLength); // FileReferenceSection
            test.equal(plugins.children.length, 1); // Plugins pbxGroup
            test.equal(sources.files.length, 3); // SourcesBuildPhhase
            test.done();
        }
    }
};
