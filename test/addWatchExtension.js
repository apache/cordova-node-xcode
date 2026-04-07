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

var fullProject = require('./fixtures/full-project'),
    fullProjectStr = JSON.stringify(fullProject),
    pbx = require('../lib/pbxProject'),
    pbxFile = require('../lib/pbxFile'),
    proj = new pbx('.');

function cleanHash() {
    return JSON.parse(fullProjectStr);
}

var TARGET_NAME = 'TestWatchExtension',
    TARGET_TYPE = 'watch_extension',
    TARGET_SUBFOLDER_NAME = 'TestWatchExtensionFiles';


describe('addWatchExtension', () => {
    beforeEach(() => {
        proj.hash = cleanHash();
    });
    it('should create a new watch extension target', () => {
        var target = proj.addTarget(TARGET_NAME, TARGET_TYPE, TARGET_SUBFOLDER_NAME);

        assert.ok(typeof target == 'object');
        assert.ok(target.uuid);
        assert.ok(target.pbxNativeTarget);
        assert.ok(target.pbxNativeTarget.isa);
        assert.ok(target.pbxNativeTarget.name);
        assert.ok(target.pbxNativeTarget.productName);
        assert.ok(target.pbxNativeTarget.productReference);
        assert.ok(target.pbxNativeTarget.productType);
        assert.ok(target.pbxNativeTarget.buildConfigurationList);
        assert.ok(target.pbxNativeTarget.buildPhases);
        assert.ok(target.pbxNativeTarget.buildRules);
        assert.ok(target.pbxNativeTarget.dependencies);

    });

    it('should create a new watch extension target and add source, framework, resource and header files and the corresponding build phases', () => {
        var target = proj.addTarget(TARGET_NAME, TARGET_TYPE, TARGET_SUBFOLDER_NAME),
            options = { 'target' : target.uuid };

        var sourceFile = proj.addSourceFile('Plugins/file.m', options),
            sourcePhase = proj.addBuildPhase([], 'PBXSourcesBuildPhase', 'Sources', target.uuid),
            resourceFile = proj.addResourceFile('assets.bundle', options),
            resourcePhase = proj.addBuildPhase([], 'PBXResourcesBuildPhase', 'Resources', target.uuid),
            frameworkFile = proj.addFramework('libsqlite3.dylib', options),
            frameworkPhase = proj.addBuildPhase([], 'PBXFrameworkBuildPhase', 'Frameworks', target.uuid),
            headerFile = proj.addHeaderFile('file.h', options);

        assert.ok(sourcePhase);
        assert.ok(resourcePhase);
        assert.ok(frameworkPhase);

        assert.equal(sourceFile.constructor, pbxFile);
        assert.equal(resourceFile.constructor, pbxFile);
        assert.equal(frameworkFile.constructor, pbxFile);
        assert.equal(headerFile.constructor, pbxFile);

        assert.ok(typeof target == 'object');
        assert.ok(target.uuid);
        assert.ok(target.pbxNativeTarget);
        assert.ok(target.pbxNativeTarget.isa);
        assert.ok(target.pbxNativeTarget.name);
        assert.ok(target.pbxNativeTarget.productName);
        assert.ok(target.pbxNativeTarget.productReference);
        assert.ok(target.pbxNativeTarget.productType);
        assert.ok(target.pbxNativeTarget.buildConfigurationList);
        assert.ok(target.pbxNativeTarget.buildPhases);
        assert.ok(target.pbxNativeTarget.buildRules);
        assert.ok(target.pbxNativeTarget.dependencies);

    });

    it('should not create a new watch extension build phase if no watch app exists', () => {
        var target = proj.addTarget(TARGET_NAME, TARGET_TYPE);

        assert.ok(typeof target == 'object');
        assert.ok(target.uuid);
        assert.ok(target.pbxNativeTarget);
        assert.ok(target.pbxNativeTarget.isa);
        assert.ok(target.pbxNativeTarget.name);
        assert.ok(target.pbxNativeTarget.productName);
        assert.ok(target.pbxNativeTarget.productReference);
        assert.ok(target.pbxNativeTarget.productType);
        assert.ok(target.pbxNativeTarget.buildConfigurationList);
        assert.ok(target.pbxNativeTarget.buildPhases);
        assert.ok(target.pbxNativeTarget.buildRules);
        assert.ok(target.pbxNativeTarget.dependencies);

        var buildPhase = proj.buildPhaseObject('PBXCopyFilesBuildPhase', 'Embed App Extensions', target.uuid);

        assert.ok(!buildPhase);

    });
});
