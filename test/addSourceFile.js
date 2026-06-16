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
const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');

const fullProject = require('./fixtures/full-project');
const fullProjectStr = JSON.stringify(fullProject);
const PBXProject = require('../lib/pbxProject');
const PBXFile = require('../lib/pbxFile');
const proj = new PBXProject('.');

function cleanHash () {
    return JSON.parse(fullProjectStr);
}

describe('addSourceFile', () => {
    beforeEach(() => {
        proj.hash = cleanHash();
    });

    it('should return a pbxFile', () => {
        const newFile = proj.addSourceFile('file.m');
        assert.strictEqual(newFile.constructor, PBXFile);
    });

    it('should set a uuid on the pbxFile', () => {
        const newFile = proj.addSourceFile('file.m');
        assert.ok(newFile.uuid);
    });

    it('should set a fileRef on the pbxFile', () => {
        const newFile = proj.addSourceFile('file.m');
        assert.ok(newFile.fileRef);
    });

    it('should populate the PBXBuildFile section with 2 fields', () => {
        const newFile = proj.addSourceFile('file.m');
        const buildFileSection = proj.pbxBuildFileSection();
        const bfsLength = Object.keys(buildFileSection).length;

        assert.strictEqual(bfsLength, 60);
        assert.ok(buildFileSection[newFile.uuid]);
        assert.ok(buildFileSection[newFile.uuid + '_comment']);
    });

    it('should add the PBXBuildFile comment correctly', () => {
        const newFile = proj.addSourceFile('file.m');
        const commentKey = newFile.uuid + '_comment';
        const buildFileSection = proj.pbxBuildFileSection();

        assert.strictEqual(buildFileSection[commentKey], 'file.m in Sources');
    });

    it('should add the PBXBuildFile object correctly', () => {
        const newFile = proj.addSourceFile('file.m');
        const buildFileSection = proj.pbxBuildFileSection();
        const buildFileEntry = buildFileSection[newFile.uuid];

        assert.strictEqual(buildFileEntry.isa, 'PBXBuildFile');
        assert.strictEqual(buildFileEntry.fileRef, newFile.fileRef);
        assert.strictEqual(buildFileEntry.fileRef_comment, 'file.m');
    });

    it('should populate the PBXFileReference section with 2 fields', () => {
        const newFile = proj.addSourceFile('file.m');
        const fileRefSection = proj.pbxFileReferenceSection();
        const frsLength = Object.keys(fileRefSection).length;

        assert.strictEqual(frsLength, 68);
        assert.ok(fileRefSection[newFile.fileRef]);
        assert.ok(fileRefSection[newFile.fileRef + '_comment']);
    });

    it('should populate the PBXFileReference comment correctly', () => {
        const newFile = proj.addSourceFile('file.m');
        const fileRefSection = proj.pbxFileReferenceSection();
        const commentKey = newFile.fileRef + '_comment';

        assert.strictEqual(fileRefSection[commentKey], 'file.m');
    });

    it('should add the PBXFileReference object correctly', () => {
        const newFile = proj.addSourceFile('Plugins/file.m');
        const fileRefSection = proj.pbxFileReferenceSection();
        const fileRefEntry = fileRefSection[newFile.fileRef];

        assert.strictEqual(fileRefEntry.isa, 'PBXFileReference');
        assert.strictEqual(fileRefEntry.fileEncoding, 4);
        assert.strictEqual(fileRefEntry.lastKnownFileType, 'sourcecode.c.objc');
        assert.strictEqual(fileRefEntry.name, '"file.m"');
        assert.strictEqual(fileRefEntry.path, '"file.m"');
        assert.strictEqual(fileRefEntry.sourceTree, '"<group>"');
    });

    it('should add to the Plugins PBXGroup group', () => {
        proj.addSourceFile('Plugins/file.m');

        const plugins = proj.pbxGroupByName('Plugins');
        assert.strictEqual(plugins.children.length, 1);
    });

    it('should have the right values for the PBXGroup entry', () => {
        const newFile = proj.addSourceFile('Plugins/file.m');
        const plugins = proj.pbxGroupByName('Plugins');
        const pluginObj = plugins.children[0];

        assert.strictEqual(pluginObj.comment, 'file.m');
        assert.strictEqual(pluginObj.value, newFile.fileRef);
    });

    it('should add to the PBXSourcesBuildPhase', () => {
        proj.addSourceFile('Plugins/file.m');

        const sources = proj.pbxSourcesBuildPhaseObj();
        assert.strictEqual(sources.files.length, 3);
    });

    it('should have the right values for the Sources entry', () => {
        const newFile = proj.addSourceFile('Plugins/file.m');
        const sources = proj.pbxSourcesBuildPhaseObj();
        const sourceObj = sources.files[2];

        assert.strictEqual(sourceObj.comment, 'file.m in Sources');
        assert.strictEqual(sourceObj.value, newFile.uuid);
    });

    it('duplicate entries should return false', () => {
        proj.addSourceFile('Plugins/file.m');
        assert.ok(!proj.addSourceFile('Plugins/file.m'));
    });

    it('duplicate entries should not add another entry anywhere', () => {
        proj.addSourceFile('Plugins/file.m');
        const buildFileSection = proj.pbxBuildFileSection();
        const bfsLength = Object.keys(buildFileSection).length;
        const fileRefSection = proj.pbxFileReferenceSection();
        const frsLength = Object.keys(fileRefSection).length;
        const plugins = proj.pbxGroupByName('Plugins');
        const sources = proj.pbxSourcesBuildPhaseObj();

        // duplicate!
        proj.addSourceFile('Plugins/file.m');

        assert.strictEqual(bfsLength, 60);
        assert.strictEqual(frsLength, 68);
        assert.strictEqual(plugins.children.length, 1);
        assert.strictEqual(sources.files.length, 3);
    });
});
