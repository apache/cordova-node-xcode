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

exports.removeResourceFile = {
    'should return a pbxFile': function (test) {
        const newFile = proj.addResourceFile('assets.bundle');

        test.equal(newFile.constructor, pbxFile);

        const deletedFile = proj.removeResourceFile('assets.bundle');

        test.equal(deletedFile.constructor, pbxFile);

        test.done();
    },
    'should set a uuid on the pbxFile': function (test) {
        const newFile = proj.addResourceFile('assets.bundle');

        test.ok(newFile.uuid);

        const deletedFile = proj.removeResourceFile('assets.bundle');

        test.ok(deletedFile.uuid);

        test.done();
    },
    'should set a fileRef on the pbxFile': function (test) {
        const newFile = proj.addResourceFile('assets.bundle');

        test.ok(newFile.fileRef);

        const deletedFile = proj.removeResourceFile('assets.bundle');

        test.ok(deletedFile.fileRef);

        test.done();
    },
    'should remove 2 fields from the PBXBuildFile section': function (test) {
        const newFile = proj.addResourceFile('assets.bundle');
        let buildFileSection = proj.pbxBuildFileSection();
        let bfsLength = Object.keys(buildFileSection).length;

        test.equal(60, bfsLength);
        test.ok(buildFileSection[newFile.uuid]);
        test.ok(buildFileSection[newFile.uuid + '_comment']);

        const deletedFile = proj.removeResourceFile('assets.bundle');
        buildFileSection = proj.pbxBuildFileSection();
        bfsLength = Object.keys(buildFileSection).length;

        test.equal(58, bfsLength);
        test.ok(!buildFileSection[deletedFile.uuid]);
        test.ok(!buildFileSection[deletedFile.uuid + '_comment']);

        test.done();
    },
    'should remove the PBXBuildFile comment correctly': function (test) {
        const newFile = proj.addResourceFile('assets.bundle');
        let commentKey = newFile.uuid + '_comment';
        let buildFileSection = proj.pbxBuildFileSection();

        test.equal(
            buildFileSection[commentKey],
            'assets.bundle in Resources'
        );

        const deletedFile = proj.removeResourceFile('assets.bundle');
        commentKey = deletedFile.uuid + '_comment';
        buildFileSection = proj.pbxBuildFileSection();

        test.ok(!buildFileSection[commentKey]);

        test.done();
    },
    'should remove the PBXBuildFile object correctly': function (test) {
        const newFile = proj.addResourceFile('assets.bundle');
        let buildFileSection = proj.pbxBuildFileSection();
        let buildFileEntry = buildFileSection[newFile.uuid];

        test.equal(buildFileEntry.isa, 'PBXBuildFile');
        test.equal(buildFileEntry.fileRef, newFile.fileRef);
        test.equal(buildFileEntry.fileRef_comment, 'assets.bundle');

        const deletedFile = proj.removeResourceFile('assets.bundle');
        buildFileSection = proj.pbxBuildFileSection();
        buildFileEntry = buildFileSection[deletedFile.uuid];

        test.ok(!buildFileEntry);

        test.done();
    },
    'should remove 2 fields from the PBXFileReference section': function (
        test
    ) {
        const newFile = proj.addResourceFile('assets.bundle');
        let fileRefSection = proj.pbxFileReferenceSection();
        let frsLength = Object.keys(fileRefSection).length;

        test.equal(68, frsLength);
        test.ok(fileRefSection[newFile.fileRef]);
        test.ok(fileRefSection[newFile.fileRef + '_comment']);

        const deletedFile = proj.removeResourceFile('assets.bundle');
        fileRefSection = proj.pbxFileReferenceSection();
        frsLength = Object.keys(fileRefSection).length;

        test.equal(66, frsLength);
        test.ok(!fileRefSection[deletedFile.fileRef]);
        test.ok(!fileRefSection[deletedFile.fileRef + '_comment']);

        test.done();
    },
    'should populate the PBXFileReference comment correctly': function (test) {
        const newFile = proj.addResourceFile('assets.bundle');
        let fileRefSection = proj.pbxFileReferenceSection();
        let commentKey = newFile.fileRef + '_comment';

        test.equal(fileRefSection[commentKey], 'assets.bundle');

        const deletedFile = proj.removeResourceFile('assets.bundle');
        fileRefSection = proj.pbxFileReferenceSection();
        commentKey = deletedFile.fileRef + '_comment';

        test.ok(!fileRefSection[commentKey]);
        test.done();
    },
    'should remove the PBXFileReference object correctly': function (test) {
        delete proj.pbxGroupByName('Resources').path;

        const newFile = proj.addResourceFile('Resources/assets.bundle');
        let fileRefSection = proj.pbxFileReferenceSection();
        let fileRefEntry = fileRefSection[newFile.fileRef];

        test.equal(fileRefEntry.isa, 'PBXFileReference');
        test.equal(fileRefEntry.fileEncoding, undefined);
        test.equal(fileRefEntry.lastKnownFileType, 'wrapper.plug-in');
        test.equal(fileRefEntry.name, '"assets.bundle"');
        test.equal(fileRefEntry.path, '"Resources/assets.bundle"');
        test.equal(fileRefEntry.sourceTree, '"<group>"');

        const deletedFile = proj.removeResourceFile('Resources/assets.bundle');
        fileRefSection = proj.pbxFileReferenceSection();
        fileRefEntry = fileRefSection[deletedFile.fileRef];

        test.ok(!fileRefEntry);

        test.done();
    },
    'should remove from the Resources PBXGroup group': function (test) {
        const newFile = proj.addResourceFile('Resources/assets.bundle');
        let resources = proj.pbxGroupByName('Resources');

        test.equal(resources.children.length, 10);

        const deletedFile = proj.removeResourceFile('Resources/assets.bundle');
        resources = proj.pbxGroupByName('Resources');

        test.equal(resources.children.length, 9);
        test.done();
    },
    'should remove from the PBXSourcesBuildPhase': function (test) {
        const newFile = proj.addResourceFile('Resources/assets.bundle');
        let sources = proj.pbxResourcesBuildPhaseObj();

        test.equal(sources.files.length, 13);

        const deletedFile = proj.removeResourceFile('Resources/assets.bundle');
        sources = proj.pbxResourcesBuildPhaseObj();

        test.equal(sources.files.length, 12);
        test.done();
    },
    tearDown: function (callback) {
        delete proj.pbxGroupByName('Resources').path;
        callback();
    }
};
