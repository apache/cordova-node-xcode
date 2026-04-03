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

function nonComments (obj) {
    const keys = Object.keys(obj);
    const newObj = {}; let i = 0;

    for (i; i < keys.length; i++) {
        if (!/_comment$/.test(keys[i])) {
            newObj[keys[i]] = obj[keys[i]];
        }
    }

    return newObj;
}

function librarySearchPaths (proj) {
    const configs = nonComments(proj.pbxXCBuildConfigurationSection());
    const allPaths = [];
    const ids = Object.keys(configs); let i; let buildSettings;

    for (i = 0; i < ids.length; i++) {
        buildSettings = configs[ids[i]].buildSettings;

        if (buildSettings.LIBRARY_SEARCH_PATHS) {
            allPaths.push(buildSettings.LIBRARY_SEARCH_PATHS);
        }
    }

    return allPaths;
}

beforeEach(() => {
    proj.hash = cleanHash();
});

describe('addStaticLibrary', () => {
    it('should return a pbxFile', () => {
        const newFile = proj.addStaticLibrary('libGoogleAnalytics.a');

        assert.equal(newFile.constructor, PBXFile);
    });

    it('should set a fileRef on the pbxFile', () => {
        const newFile = proj.addStaticLibrary('libGoogleAnalytics.a');

        assert.ok(newFile.fileRef);
    });

    it('should populate the PBXBuildFile section with 2 fields', () => {
        const newFile = proj.addStaticLibrary('libGoogleAnalytics.a');
        const buildFileSection = proj.pbxBuildFileSection();
        const bfsLength = Object.keys(buildFileSection).length;

        assert.equal(60, bfsLength);
        assert.ok(buildFileSection[newFile.uuid]);
        assert.ok(buildFileSection[newFile.uuid + '_comment']);
    });

    it('should populate the PBXBuildFile section with 2 fields as plugin', () => {
        const newFile = proj.addStaticLibrary('libGoogleAnalytics.a', { plugin: true });
        const buildFileSection = proj.pbxBuildFileSection();
        const bfsLength = Object.keys(buildFileSection).length;

        assert.equal(60, bfsLength);
        assert.ok(buildFileSection[newFile.uuid]);
        assert.ok(buildFileSection[newFile.uuid + '_comment']);
    });

    it('should add the PBXBuildFile comment correctly', () => {
        const newFile = proj.addStaticLibrary('libGoogleAnalytics.a');
        const commentKey = newFile.uuid + '_comment';
        const buildFileSection = proj.pbxBuildFileSection();

        assert.equal(buildFileSection[commentKey], 'libGoogleAnalytics.a in Frameworks');
    });

    it('should add the PBXBuildFile object correctly', () => {
        const newFile = proj.addStaticLibrary('libGoogleAnalytics.a');
        const buildFileSection = proj.pbxBuildFileSection();
        const buildFileEntry = buildFileSection[newFile.uuid];

        assert.equal(buildFileEntry.isa, 'PBXBuildFile');
        assert.equal(buildFileEntry.fileRef, newFile.fileRef);
        assert.equal(buildFileEntry.fileRef_comment, 'libGoogleAnalytics.a');
    });

    it('should populate the PBXFileReference section with 2 fields', () => {
        const newFile = proj.addStaticLibrary('libGoogleAnalytics.a');
        const fileRefSection = proj.pbxFileReferenceSection();
        const frsLength = Object.keys(fileRefSection).length;

        assert.equal(68, frsLength);
        assert.ok(fileRefSection[newFile.fileRef]);
        assert.ok(fileRefSection[newFile.fileRef + '_comment']);
    });

    it('should populate the PBXFileReference comment correctly', () => {
        const newFile = proj.addStaticLibrary('libGoogleAnalytics.a');
        const fileRefSection = proj.pbxFileReferenceSection();
        const commentKey = newFile.fileRef + '_comment';

        assert.equal(fileRefSection[commentKey], 'libGoogleAnalytics.a');
    });

    it('should add the PBXFileReference object correctly', () => {
        const newFile = proj.addStaticLibrary('libGoogleAnalytics.a');
        const fileRefSection = proj.pbxFileReferenceSection();
        const fileRefEntry = fileRefSection[newFile.fileRef];

        assert.equal(fileRefEntry.isa, 'PBXFileReference');
        assert.equal(fileRefEntry.lastKnownFileType, 'archive.ar');
        assert.equal(fileRefEntry.name, '"libGoogleAnalytics.a"');
        assert.equal(fileRefEntry.path, '"libGoogleAnalytics.a"');
        assert.equal(fileRefEntry.sourceTree, '"<group>"');
    });

    it('should add to the PBXFrameworksBuildPhase', () => {
        proj.addStaticLibrary('libGoogleAnalytics.a');
        const frameworks = proj.pbxFrameworksBuildPhaseObj();

        assert.equal(frameworks.files.length, 16);
    });

    it('should have the right values for the Sources entry', () => {
        const newFile = proj.addStaticLibrary('libGoogleAnalytics.a');
        const frameworks = proj.pbxFrameworksBuildPhaseObj();
        const framework = frameworks.files[15];

        assert.equal(framework.comment, 'libGoogleAnalytics.a in Frameworks');
        assert.equal(framework.value, newFile.uuid);
    });

    it('should set LIBRARY_SEARCH_PATHS for appropriate build configurations', () => {
        proj.addStaticLibrary('libGoogleAnalytics.a');
        const configs = nonComments(proj.pbxXCBuildConfigurationSection());
        const ids = Object.keys(configs); let i; let buildSettings;

        for (i = 0; i < ids.length; i++) {
            buildSettings = configs[ids[i]].buildSettings;

            if (buildSettings.PRODUCT_NAME === '"KitchenSinktablet"') {
                assert.ok(buildSettings.LIBRARY_SEARCH_PATHS);
            }
        }
    });

    it('should ensure LIBRARY_SEARCH_PATHS inherits defaults correctly', () => {
        proj.addStaticLibrary('libGoogleAnalytics.a');
        const libraryPaths = librarySearchPaths(proj);
        let i; let current;

        for (i = 0; i < libraryPaths.length; i++) {
            current = libraryPaths[i];
            assert.ok(current.indexOf('"$(inherited)"') >= 0);
        }
    });

    it('should ensure the new library is in LIBRARY_SEARCH_PATHS', () => {
        proj.addStaticLibrary('libGoogleAnalytics.a');
        const libraryPaths = librarySearchPaths(proj);
        const expectedPath = '"\\"$(SRCROOT)/KitchenSinktablet\\""';
        let i; let current;

        for (i = 0; i < libraryPaths.length; i++) {
            current = libraryPaths[i];
            assert.ok(current.indexOf(expectedPath) >= 0);
        }
    });

    it('should add to the Plugins group, optionally', () => {
        proj.addStaticLibrary('libGoogleAnalytics.a', { plugin: true });
        const plugins = proj.pbxGroupByName('Plugins');

        assert.equal(plugins.children.length, 1);
    });

    describe('should add the right LIBRARY_SEARCH_PATHS entry for plugins', () => {
        it('with group set', () => {
            const plugins = proj.pbxGroupByName('Plugins');
            plugins.path = '"Test200/Plugins"';

            proj.addStaticLibrary('Plugins/libGoogleAnalytics.a', { plugin: true });
            const libraryPaths = librarySearchPaths(proj);
            const expectedPath = '"\\"$(SRCROOT)/Test200/Plugins\\""';
            let current;

            for (let i = 0; i < libraryPaths.length; i++) {
                current = libraryPaths[i];
                assert.ok(current.indexOf(expectedPath) >= 0,
                    expectedPath + ' not found in ' + current);
            }
        });

        it('without group set', () => {
            const plugins = proj.pbxGroupByName('Plugins');
            delete plugins.path;

            proj.addStaticLibrary('Plugins/libGoogleAnalytics.a', { plugin: true });
            const libraryPaths = librarySearchPaths(proj);
            const expectedPath = '"\\"$(SRCROOT)/KitchenSinktablet/Plugins\\""';
            let current;

            for (let i = 0; i < libraryPaths.length; i++) {
                current = libraryPaths[i];
                assert.ok(current.indexOf(expectedPath) >= 0,
                    expectedPath + ' not found in ' + current);
            }
        });
    });

    describe('duplicate entries', () => {
        it('should return false', () => {
            proj.addStaticLibrary('libGoogleAnalytics.a');

            assert.ok(!proj.addStaticLibrary('libGoogleAnalytics.a'));
        });
        it('should return false (plugin entries)', () => {
            proj.addStaticLibrary('Plugins/libGoogleAnalytics.a', { plugin: true });

            assert.ok(!proj.addStaticLibrary('Plugins/libGoogleAnalytics.a', { plugin: true }));
        });
    });
});
