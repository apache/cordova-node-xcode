/*
    Licensed to the Apache Software Foundation (ASF) under one
    or more contributor license agreements.  See the NOTICE file
    distributed with this work for additional information
    regarding copyright ownership.  The ASF licenses this file
    to you under the Apache License, Version 2.0 (the
    "License"); you may not use this file except in compliance
    with the License.  You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing,
    software distributed under the License is distributed on an
    "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, either express or implied.  See the License for the
    specific language governing permissions and limitations
    under the License.
*/
const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');

const fullProject = require('./fixtures/full-project');
const fullProjectStr = JSON.stringify(fullProject);
const PBXProject = require('../lib/pbxProject');
const PBXFile = require('../lib/pbxFile');
const proj = new PBXProject('.');

function cleanHash () {
    return JSON.parse(fullProjectStr);
}

describe('removeResourceFile', () => {
    beforeEach(() => {
        proj.hash = cleanHash();
    });

    it('should return a pbxFile', () => {
        const newFile = proj.addResourceFile('assets.bundle');

        assert.equal(newFile.constructor, PBXFile);

        const deletedFile = proj.removeResourceFile('assets.bundle');

        assert.equal(deletedFile.constructor, PBXFile);
    });

    it('should set a uuid on the pbxFile', () => {
        const newFile = proj.addResourceFile('assets.bundle');

        assert.ok(newFile.uuid);

        const deletedFile = proj.removeResourceFile('assets.bundle');

        assert.ok(deletedFile.uuid);
    });

    it('should set a fileRef on the pbxFile', () => {
        const newFile = proj.addResourceFile('assets.bundle');

        assert.ok(newFile.fileRef);

        const deletedFile = proj.removeResourceFile('assets.bundle');

        assert.ok(deletedFile.fileRef);
    });

    it('should remove 2 fields from the PBXBuildFile section', () => {
        const newFile = proj.addResourceFile('assets.bundle');
        let buildFileSection = proj.pbxBuildFileSection();
        let bfsLength = Object.keys(buildFileSection).length;

        assert.equal(60, bfsLength);
        assert.ok(buildFileSection[newFile.uuid]);
        assert.ok(buildFileSection[newFile.uuid + '_comment']);

        const deletedFile = proj.removeResourceFile('assets.bundle');
        buildFileSection = proj.pbxBuildFileSection();
        bfsLength = Object.keys(buildFileSection).length;

        assert.equal(58, bfsLength);
        assert.ok(!buildFileSection[deletedFile.uuid]);
        assert.ok(!buildFileSection[deletedFile.uuid + '_comment']);
    });

    it('should remove the PBXBuildFile comment correctly', () => {
        const newFile = proj.addResourceFile('assets.bundle');
        let commentKey = newFile.uuid + '_comment';
        let buildFileSection = proj.pbxBuildFileSection();

        assert.equal(buildFileSection[commentKey], 'assets.bundle in Resources');

        const deletedFile = proj.removeResourceFile('assets.bundle');
        commentKey = deletedFile.uuid + '_comment';
        buildFileSection = proj.pbxBuildFileSection();

        assert.ok(!buildFileSection[commentKey]);
    });

    it('should remove the PBXBuildFile object correctly', () => {
        const newFile = proj.addResourceFile('assets.bundle');
        let buildFileSection = proj.pbxBuildFileSection();
        let buildFileEntry = buildFileSection[newFile.uuid];

        assert.equal(buildFileEntry.isa, 'PBXBuildFile');
        assert.equal(buildFileEntry.fileRef, newFile.fileRef);
        assert.equal(buildFileEntry.fileRef_comment, 'assets.bundle');

        const deletedFile = proj.removeResourceFile('assets.bundle');
        buildFileSection = proj.pbxBuildFileSection();
        buildFileEntry = buildFileSection[deletedFile.uuid];

        assert.ok(!buildFileEntry);
    });

    it('should remove 2 fields from the PBXFileReference section', () => {
        const newFile = proj.addResourceFile('assets.bundle');
        let fileRefSection = proj.pbxFileReferenceSection();
        let frsLength = Object.keys(fileRefSection).length;

        assert.equal(68, frsLength);
        assert.ok(fileRefSection[newFile.fileRef]);
        assert.ok(fileRefSection[newFile.fileRef + '_comment']);

        const deletedFile = proj.removeResourceFile('assets.bundle');
        fileRefSection = proj.pbxFileReferenceSection();
        frsLength = Object.keys(fileRefSection).length;

        assert.equal(66, frsLength);
        assert.ok(!fileRefSection[deletedFile.fileRef]);
        assert.ok(!fileRefSection[deletedFile.fileRef + '_comment']);
    });

    it('should populate the PBXFileReference comment correctly', () => {
        const newFile = proj.addResourceFile('assets.bundle');
        let fileRefSection = proj.pbxFileReferenceSection();
        let commentKey = newFile.fileRef + '_comment';

        assert.equal(fileRefSection[commentKey], 'assets.bundle');

        const deletedFile = proj.removeResourceFile('assets.bundle');
        fileRefSection = proj.pbxFileReferenceSection();
        commentKey = deletedFile.fileRef + '_comment';

        assert.ok(!fileRefSection[commentKey]);
    });

    it('should remove the PBXFileReference object correctly', () => {
        delete proj.pbxGroupByName('Resources').path;

        const newFile = proj.addResourceFile('Resources/assets.bundle');
        let fileRefSection = proj.pbxFileReferenceSection();
        let fileRefEntry = fileRefSection[newFile.fileRef];

        assert.equal(fileRefEntry.isa, 'PBXFileReference');
        assert.equal(fileRefEntry.fileEncoding, undefined);
        assert.equal(fileRefEntry.lastKnownFileType, 'wrapper.plug-in');
        assert.equal(fileRefEntry.name, '"assets.bundle"');
        assert.equal(fileRefEntry.path, '"Resources/assets.bundle"');
        assert.equal(fileRefEntry.sourceTree, '"<group>"');

        const deletedFile = proj.removeResourceFile('Resources/assets.bundle');
        fileRefSection = proj.pbxFileReferenceSection();
        fileRefEntry = fileRefSection[deletedFile.fileRef];

        assert.ok(!fileRefEntry);
    });

    it('should remove from the Resources PBXGroup group', () => {
        proj.addResourceFile('Resources/assets.bundle');
        let resources = proj.pbxGroupByName('Resources');

        assert.equal(resources.children.length, 10);

        proj.removeResourceFile('Resources/assets.bundle');
        resources = proj.pbxGroupByName('Resources');

        assert.equal(resources.children.length, 9);
    });

    it('should remove from the PBXSourcesBuildPhase', () => {
        proj.addResourceFile('Resources/assets.bundle');
        let sources = proj.pbxResourcesBuildPhaseObj();

        assert.equal(sources.files.length, 13);

        proj.removeResourceFile('Resources/assets.bundle');
        sources = proj.pbxResourcesBuildPhaseObj();

        assert.equal(sources.files.length, 12);
    });

    afterEach(() => {
        delete proj.pbxGroupByName('Resources').path;
    });
});
