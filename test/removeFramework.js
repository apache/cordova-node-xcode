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

function nonComments (obj) {
    const keys = Object.keys(obj);
    const newObj = {};

    for (let i = 0; i < keys.length; i++) {
        if (!/_comment$/.test(keys[i])) {
            newObj[keys[i]] = obj[keys[i]];
        }
    }

    return newObj;
}

function frameworkSearchPaths (proj) {
    const configs = nonComments(proj.pbxXCBuildConfigurationSection());
    const allPaths = [];
    const ids = Object.keys(configs);
    let buildSettings;

    for (let i = 0; i < ids.length; i++) {
        buildSettings = configs[ids[i]].buildSettings;

        if (buildSettings.FRAMEWORK_SEARCH_PATHS) {
            allPaths.push(buildSettings.FRAMEWORK_SEARCH_PATHS);
        }
    }

    return allPaths;
}

describe('removeFramework', () => {
    beforeEach(() => {
        proj.hash = cleanHash();
    });

    it('should return a pbxFile', () => {
        const newFile = proj.addFramework('libsqlite3.dylib');
        assert.equal(newFile.constructor, PBXFile);

        const deletedFile = proj.removeFramework('libsqlite3.dylib');
        assert.equal(deletedFile.constructor, PBXFile);
    });

    it('should set a fileRef on the pbxFile', () => {
        const newFile = proj.addFramework('libsqlite3.dylib');
        assert.ok(newFile.fileRef);

        const deletedFile = proj.removeFramework('libsqlite3.dylib');
        assert.ok(deletedFile.fileRef);
    });

    it('should remove 2 fields from the PBXFileReference section', () => {
        const newFile = proj.addFramework('libsqlite3.dylib');
        const fileRefSection = proj.pbxFileReferenceSection();
        let frsLength = Object.keys(fileRefSection).length;

        assert.equal(68, frsLength);
        assert.ok(fileRefSection[newFile.fileRef]);
        assert.ok(fileRefSection[newFile.fileRef + '_comment']);

        const deletedFile = proj.removeFramework('libsqlite3.dylib');
        frsLength = Object.keys(fileRefSection).length;

        assert.equal(66, frsLength);
        assert.ok(!fileRefSection[deletedFile.fileRef]);
        assert.ok(!fileRefSection[deletedFile.fileRef + '_comment']);
    });

    it('should remove 2 fields from the PBXBuildFile section', () => {
        const newFile = proj.addFramework('libsqlite3.dylib');
        const buildFileSection = proj.pbxBuildFileSection();
        let bfsLength = Object.keys(buildFileSection).length;

        assert.equal(60, bfsLength);
        assert.ok(buildFileSection[newFile.uuid]);
        assert.ok(buildFileSection[newFile.uuid + '_comment']);

        const deletedFile = proj.removeFramework('libsqlite3.dylib');
        bfsLength = Object.keys(buildFileSection).length;

        assert.equal(58, bfsLength);
        assert.ok(!buildFileSection[deletedFile.uuid]);
        assert.ok(!buildFileSection[deletedFile.uuid + '_comment']);
    });

    it('should remove from the Frameworks PBXGroup', () => {
        let newLength = proj.pbxGroupByName('Frameworks').children.length + 1;
        proj.addFramework('libsqlite3.dylib');

        const frameworks = proj.pbxGroupByName('Frameworks');
        assert.equal(frameworks.children.length, newLength);

        proj.removeFramework('libsqlite3.dylib');
        newLength = newLength - 1;

        assert.equal(frameworks.children.length, newLength);
    });

    it('should remove from the PBXFrameworksBuildPhase', () => {
        proj.addFramework('libsqlite3.dylib');

        let frameworks = proj.pbxFrameworksBuildPhaseObj();
        assert.equal(frameworks.files.length, 16);

        proj.removeFramework('libsqlite3.dylib');

        frameworks = proj.pbxFrameworksBuildPhaseObj();
        assert.equal(frameworks.files.length, 15);
    });

    it('should remove custom frameworks', () => {
        proj.addFramework('/path/to/Custom.framework', { customFramework: true });

        let frameworks = proj.pbxFrameworksBuildPhaseObj();
        assert.equal(frameworks.files.length, 16);

        proj.removeFramework('/path/to/Custom.framework', { customFramework: true });

        frameworks = proj.pbxFrameworksBuildPhaseObj();
        assert.equal(frameworks.files.length, 15);

        const frameworkPaths = frameworkSearchPaths(proj);
        const expectedPath = '"/path/to"';

        for (let i = 0; i < frameworkPaths.length; i++) {
            const current = frameworkPaths[i];
            assert.ok(current.indexOf(expectedPath) === -1);
        }
    });

    it('should remove embedded frameworks', () => {
        proj.addFramework('/path/to/Custom.framework', { customFramework: true, embed: true, sign: true });

        let frameworks = proj.pbxFrameworksBuildPhaseObj();
        let buildFileSection = proj.pbxBuildFileSection();
        let bfsLength = Object.keys(buildFileSection).length;

        assert.equal(frameworks.files.length, 16);
        assert.equal(62, bfsLength);

        proj.removeFramework('/path/to/Custom.framework', { customFramework: true, embed: true });

        frameworks = proj.pbxFrameworksBuildPhaseObj();
        buildFileSection = proj.pbxBuildFileSection();
        bfsLength = Object.keys(buildFileSection).length;

        assert.equal(frameworks.files.length, 15);
        assert.equal(58, bfsLength);

        const frameworkPaths = frameworkSearchPaths(proj);
        const expectedPath = '"/path/to"';

        for (let i = 0; i < frameworkPaths.length; i++) {
            const current = frameworkPaths[i];
            assert.ok(current.indexOf(expectedPath) === -1);
        }
    });
});
