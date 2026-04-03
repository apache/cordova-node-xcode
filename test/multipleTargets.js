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

const fullProject = require('./fixtures/multiple-targets');
const fullProjectStr = JSON.stringify(fullProject);
const PBXProject = require('../lib/pbxProject');
const PBXFile = require('../lib/pbxFile');
const proj = new PBXProject('.');

function cleanHash () {
    return JSON.parse(fullProjectStr);
}

describe('addFilesToTarget', () => {
    beforeEach(() => {
        proj.hash = cleanHash();
    });

    it('should add the file to a proper target', () => {
        const target = '1D6058900D05DD3D006BFB54';
        const filename = 'file.m';

        const opt = { target };
        const newFile = proj.addSourceFile(filename, opt);

        assert.equal(newFile.constructor, PBXFile);

        const sources = proj.pbxSourcesBuildPhaseObj(target);
        assert.equal(sources.files[5].comment, filename + ' in Sources');
    });

    it('should remove the file from the proper target', () => {
        const target = '1D6058900D05DD3D006BFB54';
        const filename = 'file.m';

        const opt = { target };
        const newFile = proj.addSourceFile(filename, opt);

        assert.equal(newFile.constructor, PBXFile);

        var sources = proj.pbxSourcesBuildPhaseObj(target);
        assert.equal(sources.files[5].comment, filename + ' in Sources');
        const l = sources.files.length;

        proj.removeSourceFile(filename, opt);
        var sources = proj.pbxSourcesBuildPhaseObj(target);
        assert.equal(sources.files.length, l - 1);
    });

    it('should fail when specifying an invalid target', () => {
        const target = 'XXXXX';
        const filename = 'file.m';

        const opt = { target };
        assert.throws(function () {
            proj.addSourceFile(filename, opt);
        });
    });
    it('should add the library to a proper target', () => {
        const target = '1D6058900D05DD3D006BFB54';
        const filename = 'library.lib';

        const opt = { target };
        const newFile = proj.addStaticLibrary(filename, opt);

        assert.equal(newFile.constructor, PBXFile);

        const libraries = proj.pbxFrameworksBuildPhaseObj(target);
        assert.equal(libraries.files[4].comment, filename + ' in Resources');
    });

    it('should remove the library to a proper target', () => {
        const target = '1D6058900D05DD3D006BFB54';
        const filename = 'library.lib';

        const opt = { target };
        const newFile = proj.addStaticLibrary(filename, opt);

        assert.equal(newFile.constructor, PBXFile);

        var libraries = proj.pbxFrameworksBuildPhaseObj(target);
        assert.equal(libraries.files[4].comment, filename + ' in Resources');
        const l = libraries.files.length;

        proj.removeFramework(filename, opt);
        var libraries = proj.pbxFrameworksBuildPhaseObj(target);
        assert.equal(libraries.files.length, l - 1);
    });

    it('should add the framework to a proper target', () => {
        const target = '1D6058900D05DD3D006BFB54';
        const filename = 'delta.framework';

        const opt = { target };
        const newFile = proj.addFramework(filename, opt);

        assert.equal(newFile.constructor, PBXFile);

        const frameworks = proj.pbxFrameworksBuildPhaseObj(target);
        assert.equal(frameworks.files[4].comment, filename + ' in Frameworks');
    });

    it('should add a ressource fileto a proper target', () => {
        const target = '1D6058900D05DD3D006BFB54';
        const filename = 'delta.png';

        const opt = { target };
        const newFile = proj.addResourceFile(filename, opt);

        assert.equal(newFile.constructor, PBXFile);

        const resources = proj.pbxResourcesBuildPhaseObj(target);
        assert.equal(resources.files[26].comment, filename + ' in Resources');
    });
    it('should remove a ressource file from a proper target', () => {
        const target = '1D6058900D05DD3D006BFB54';
        const filename = 'delta.png';

        const opt = { target };
        const newFile = proj.addResourceFile(filename, opt);

        assert.equal(newFile.constructor, PBXFile);

        var resources = proj.pbxResourcesBuildPhaseObj(target);
        assert.equal(resources.files[26].comment, filename + ' in Resources');

        const l = resources.files.length;

        proj.removeResourceFile(filename, opt);
        var resources = proj.pbxResourcesBuildPhaseObj(target);
        assert.equal(resources.files.length, l - 1);
    });
});
