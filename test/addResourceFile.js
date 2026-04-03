/**
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
const pbx = require('../lib/pbxProject');
const pbxFile = require('../lib/pbxFile');
const proj = new pbx('.');

function cleanHash () {
    return JSON.parse(fullProjectStr);
}

describe('addResourceFile', () => {
    beforeEach(() => {
        proj.hash = cleanHash();
    });

    it('should return a pbxFile', () => {
        const newFile = proj.addResourceFile('assets.bundle');
        assert.equal(newFile.constructor, pbxFile);
    });

    it('should set a uuid on the pbxFile', () => {
        const newFile = proj.addResourceFile('assets.bundle');
        assert.ok(newFile.uuid);
    });

    it('should set a fileRef on the pbxFile', () => {
        const newFile = proj.addResourceFile('assets.bundle');
        assert.ok(newFile.fileRef);
    });

    it('should populate the PBXBuildFile section with 2 fields', () => {
        const newFile = proj.addResourceFile('assets.bundle');
        const buildFileSection = proj.pbxBuildFileSection();
        const bfsLength = Object.keys(buildFileSection).length;

        assert.equal(60, bfsLength);
        assert.ok(buildFileSection[newFile.uuid]);
        assert.ok(buildFileSection[newFile.uuid + '_comment']);
    });

    it('should add the PBXBuildFile comment correctly', () => {
        const newFile = proj.addResourceFile('assets.bundle');
        const commentKey = newFile.uuid + '_comment';
        const buildFileSection = proj.pbxBuildFileSection();

        assert.equal(buildFileSection[commentKey], 'assets.bundle in Resources');
    });

    it('should add the PBXBuildFile object correctly', () => {
        const newFile = proj.addResourceFile('assets.bundle');
        const buildFileSection = proj.pbxBuildFileSection();
        const buildFileEntry = buildFileSection[newFile.uuid];

        assert.equal(buildFileEntry.isa, 'PBXBuildFile');
        assert.equal(buildFileEntry.fileRef, newFile.fileRef);
        assert.equal(buildFileEntry.fileRef_comment, 'assets.bundle');
    });

    it('should populate the PBXFileReference section with 2 fields', () => {
        const newFile = proj.addResourceFile('assets.bundle');
        const fileRefSection = proj.pbxFileReferenceSection();
        const frsLength = Object.keys(fileRefSection).length;

        assert.equal(68, frsLength);
        assert.ok(fileRefSection[newFile.fileRef]);
        assert.ok(fileRefSection[newFile.fileRef + '_comment']);
    });

    it('should populate the PBXFileReference comment correctly', () => {
        const newFile = proj.addResourceFile('assets.bundle');
        const fileRefSection = proj.pbxFileReferenceSection();
        const commentKey = newFile.fileRef + '_comment';

        assert.equal(fileRefSection[commentKey], 'assets.bundle');
    });

    it('should add the PBXFileReference object correctly', () => {
        delete proj.pbxGroupByName('Resources').path;

        const newFile = proj.addResourceFile('Resources/assets.bundle');
        const fileRefSection = proj.pbxFileReferenceSection();
        const fileRefEntry = fileRefSection[newFile.fileRef];

        assert.equal(fileRefEntry.isa, 'PBXFileReference');
        assert.equal(fileRefEntry.fileEncoding, undefined);
        assert.equal(fileRefEntry.lastKnownFileType, 'wrapper.plug-in');
        assert.equal(fileRefEntry.name, '"assets.bundle"');
        assert.equal(fileRefEntry.path, '"Resources/assets.bundle"');
        assert.equal(fileRefEntry.sourceTree, '"<group>"');
    });

    it('should add to the Resources PBXGroup group', () => {
        proj.addResourceFile('Resources/assets.bundle');
        const resources = proj.pbxGroupByName('Resources');

        assert.equal(resources.children.length, 10);
    });

    it('should have the right values for the PBXGroup entry', () => {
        const newFile = proj.addResourceFile('Resources/assets.bundle');
        const resources = proj.pbxGroupByName('Resources');
        const resourceObj = resources.children[9];

        assert.equal(resourceObj.comment, 'assets.bundle');
        assert.equal(resourceObj.value, newFile.fileRef);
    });

    it('should add to the PBXSourcesBuildPhase', () => {
        proj.addResourceFile('Resources/assets.bundle');
        const sources = proj.pbxResourcesBuildPhaseObj();

        assert.equal(sources.files.length, 13);
    });

    it('should have the right values for the Sources entry', () => {
        const newFile = proj.addResourceFile('Resources/assets.bundle');
        const sources = proj.pbxResourcesBuildPhaseObj();
        const sourceObj = sources.files[12];

        assert.equal(sourceObj.comment, 'assets.bundle in Resources');
        assert.equal(sourceObj.value, newFile.uuid);
    });

    it('should remove "Resources/" from path if group path is set', () => {
        const resources = proj.pbxGroupByName('Resources');
        resources.path = '"Test200/Resources"';

        const newFile = proj.addResourceFile('Resources/assets.bundle');
        assert.equal(newFile.path, 'assets.bundle');
    });

    //
    // { plugin: true }
    //
    describe('when added with { plugin: true }', () => {
        it('should add the PBXFileReference with the "Plugins" path', () => {
            delete proj.pbxGroupByName('Plugins').path;

            const newFile = proj.addResourceFile(
                'Plugins/assets.bundle',
                { plugin: true }
            );

            const fileRefSection = proj.pbxFileReferenceSection();
            const fileRefEntry = fileRefSection[newFile.fileRef];

            assert.equal(fileRefEntry.isa, 'PBXFileReference');
            assert.equal(fileRefEntry.fileEncoding, undefined);
            assert.equal(fileRefEntry.lastKnownFileType, 'wrapper.plug-in');
            assert.equal(fileRefEntry.name, '"assets.bundle"');
            assert.equal(fileRefEntry.path, '"Plugins/assets.bundle"');
            assert.equal(fileRefEntry.sourceTree, '"<group>"');
        });

        it('should add to the Plugins PBXGroup group', () => {
            proj.addResourceFile('Plugins/assets.bundle', { plugin: true });
            const plugins = proj.pbxGroupByName('Plugins');

            assert.equal(plugins.children.length, 1);
        });

        it('should have the Plugins values for the PBXGroup entry', () => {
            const newFile = proj.addResourceFile(
                'Plugins/assets.bundle',
                { plugin: true }
            );

            const plugins = proj.pbxGroupByName('Plugins');
            const pluginObj = plugins.children[0];

            assert.equal(pluginObj.comment, 'assets.bundle');
            assert.equal(pluginObj.value, newFile.fileRef);
        });

        it('should add to the PBXSourcesBuildPhase', () => {
            proj.addResourceFile('Plugins/assets.bundle', { plugin: true });
            const sources = proj.pbxResourcesBuildPhaseObj();

            assert.equal(sources.files.length, 13);
        });

        it('should have the right values for the Sources entry', () => {
            const newFile = proj.addResourceFile(
                'Plugins/assets.bundle',
                { plugin: true }
            );

            const sources = proj.pbxResourcesBuildPhaseObj();
            const sourceObj = sources.files[12];

            assert.equal(sourceObj.comment, 'assets.bundle in Resources');
            assert.equal(sourceObj.value, newFile.uuid);
        });

        it('should remove "Plugins/" from path if group path is set', () => {
            const plugins = proj.pbxGroupByName('Plugins');
            plugins.path = '"Test200/Plugins"';

            const newFile = proj.addResourceFile(
                'Plugins/assets.bundle',
                { plugin: true }
            );

            assert.equal(newFile.path, 'assets.bundle');
        });
    });

    //
    // { variantGroup: true }
    //
    describe('when added with { variantGroup: true }', () => {
        it('should not add to the PBXResourcesBuildPhase and PBXBuildFile', () => {
            const newFile = proj.addResourceFile(
                'en.lproj/Localization.strings',
                { variantGroup: true }
            );

            const sources = proj.pbxResourcesBuildPhaseObj();
            assert.equal(sources.files.length, 12);

            const buildFileSection = proj.pbxBuildFileSection();
            assert.ok(buildFileSection[newFile.uuid] === undefined);
        });
    });

    //
    // duplicate entries
    //
    describe('duplicate entries', () => {
        it('should return false', () => {
            proj.addResourceFile('Plugins/assets.bundle');
            assert.ok(!proj.addResourceFile('Plugins/assets.bundle'));
        });

        it('should return false (plugin entries)', () => {
            proj.addResourceFile('Plugins/assets.bundle', { plugin: true });
            assert.ok(!proj.addResourceFile('Plugins/assets.bundle', { plugin: true }));
        });

        it('should not add another entry anywhere', () => {
            proj.addResourceFile('Plugins/assets.bundle');

            const buildFileSection = proj.pbxBuildFileSection();
            const bfsLength = Object.keys(buildFileSection).length;

            const fileRefSection = proj.pbxFileReferenceSection();
            const frsLength = Object.keys(fileRefSection).length;

            const resources = proj.pbxGroupByName('Resources');
            const sources = proj.pbxResourcesBuildPhaseObj();

            proj.addResourceFile('Plugins/assets.bundle');

            assert.equal(60, bfsLength);
            assert.equal(68, frsLength);
            assert.equal(resources.children.length, 10);
            assert.equal(sources.files.length, 13);
        });
    });

    afterEach(() => {
        delete proj.pbxGroupByName('Resources').path;
    });
});
