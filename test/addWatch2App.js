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

var fullProject = require('./fixtures/full-project')
    fullProjectStr = JSON.stringify(fullProject),
    pbx = require('../lib/pbxProject'),
    pbxFile = require('../lib/pbxFile'),
    proj = new pbx('.');

function cleanHash() {
    return JSON.parse(fullProjectStr);
}

var TARGET_NAME = 'TestWatchApp',
    TARGET_TYPE = 'watch2_app',
    TARGET_SUBFOLDER_NAME = 'TestWatchAppFiles';

exports.setUp = function (callback) {
    proj.hash = cleanHash();
    callback();
}

exports.addWatchApp = {
    'should create a new watch2 app target with the correct product type': function (test) {
        var target = proj.addTarget(TARGET_NAME, TARGET_TYPE, TARGET_SUBFOLDER_NAME);

        test.ok(typeof target == 'object');
        test.ok(target.uuid);
        test.ok(target.pbxNativeTarget);
        test.ok(target.pbxNativeTarget.isa);
        test.ok(target.pbxNativeTarget.name);
        test.ok(target.pbxNativeTarget.productName);
        test.ok(target.pbxNativeTarget.productReference);
        test.ok(target.pbxNativeTarget.productType);
        test.ok(target.pbxNativeTarget.buildConfigurationList);
        test.ok(target.pbxNativeTarget.buildPhases);
        test.ok(target.pbxNativeTarget.buildRules);
        test.ok(target.pbxNativeTarget.dependencies);

        test.equal(target.pbxNativeTarget.productType, '"com.apple.product-type.application.watchapp2"');

        test.done();
    },
    'should create a new watch2 app target with the correct product type, without needing a subfolder name': function (test) {
        var target = proj.addTarget(TARGET_NAME, TARGET_TYPE);

        test.ok(typeof target == 'object');
        test.ok(target.uuid);
        test.ok(target.pbxNativeTarget);
        test.ok(target.pbxNativeTarget.isa);
        test.ok(target.pbxNativeTarget.name);
        test.ok(target.pbxNativeTarget.productName);
        test.ok(target.pbxNativeTarget.productReference);
        test.ok(target.pbxNativeTarget.productType);
        test.ok(target.pbxNativeTarget.buildConfigurationList);
        test.ok(target.pbxNativeTarget.buildPhases);
        test.ok(target.pbxNativeTarget.buildRules);
        test.ok(target.pbxNativeTarget.dependencies);

        test.equal(target.pbxNativeTarget.productType, '"com.apple.product-type.application.watchapp2"');

        test.done();
    },
    'should create a new watch2 app target and add source, framework, resource and header files and the corresponding build phases': function (test) {
        var target = proj.addTarget(TARGET_NAME, TARGET_TYPE, TARGET_SUBFOLDER_NAME),
            options = { 'target' : target.uuid };

        var sourceFile = proj.addSourceFile('Plugins/file.m', options),
            sourcePhase = proj.addBuildPhase([], 'PBXSourcesBuildPhase', 'Sources', target.uuid),
            resourceFile = proj.addResourceFile('assets.bundle', options),
            resourcePhase = proj.addBuildPhase([], 'PBXResourcesBuildPhase', 'Resources', target.uuid),
            frameworkFile = proj.addFramework('libsqlite3.dylib', options);
            frameworkPhase = proj.addBuildPhase([], 'PBXFrameworkBuildPhase', 'Frameworks', target.uuid),
            headerFile = proj.addHeaderFile('file.h', options);

        test.ok(sourcePhase);
        test.ok(resourcePhase);
        test.ok(frameworkPhase);

        test.equal(sourceFile.constructor, pbxFile);
        test.equal(resourceFile.constructor, pbxFile);
        test.equal(frameworkFile.constructor, pbxFile);
        test.equal(headerFile.constructor, pbxFile);

        test.ok(typeof target == 'object');
        test.ok(target.uuid);
        test.ok(target.pbxNativeTarget);
        test.ok(target.pbxNativeTarget.isa);
        test.ok(target.pbxNativeTarget.name);
        test.ok(target.pbxNativeTarget.productName);
        test.ok(target.pbxNativeTarget.productReference);
        test.ok(target.pbxNativeTarget.productType);
        test.ok(target.pbxNativeTarget.buildConfigurationList);
        test.ok(target.pbxNativeTarget.buildPhases);
        test.ok(target.pbxNativeTarget.buildRules);
        test.ok(target.pbxNativeTarget.dependencies);

        test.done();
    },
    'should create a new watch2 app target and add watch build phase': function (test) {
        var target = proj.addTarget(TARGET_NAME, TARGET_TYPE);

        test.ok(typeof target == 'object');
        test.ok(target.uuid);
        test.ok(target.pbxNativeTarget);
        test.ok(target.pbxNativeTarget.isa);
        test.ok(target.pbxNativeTarget.name);
        test.ok(target.pbxNativeTarget.productName);
        test.ok(target.pbxNativeTarget.productReference);
        test.ok(target.pbxNativeTarget.productType);
        test.ok(target.pbxNativeTarget.buildConfigurationList);
        test.ok(target.pbxNativeTarget.buildPhases);
        test.ok(target.pbxNativeTarget.buildRules);
        test.ok(target.pbxNativeTarget.dependencies);

        test.equal(target.pbxNativeTarget.productType, '"com.apple.product-type.application.watchapp2"');

        var buildPhase = proj.buildPhaseObject('PBXCopyFilesBuildPhase', 'Embed Watch Content', target.uuid);

        test.ok(buildPhase);
        test.ok(buildPhase.files);
        test.equal(buildPhase.files.length, 1);
        test.ok(buildPhase.dstPath);
        test.equal(buildPhase.dstPath, '"$(CONTENTS_FOLDER_PATH)/Watch"');
        test.equal(buildPhase.dstSubfolderSpec, 16);

        test.done();
    },
    'should create a new watch2 app with appropriate target extension': function (test) {
        var target = proj.addTarget(TARGET_NAME, TARGET_TYPE);

        var buildPhase = proj.buildPhaseObject('PBXCopyFilesBuildPhase', 'Embed Watch Content', target.uuid)

        var buildPhaseFile = buildPhase.files[0];
        test.ok(buildPhaseFile.value);
        var buildPhaseFileSection = proj.pbxBuildFileSection()[buildPhaseFile.value];
        test.ok(buildPhaseFileSection);
        test.ok(buildPhaseFileSection.fileRef);

        var buildPhaseFileRef = proj.pbxFileReferenceSection()[buildPhaseFileSection.fileRef];
        test.ok(buildPhaseFileRef);
        test.ok(buildPhaseFileRef.name);
        test.ok(buildPhaseFileRef.path);

        var quotedTargetPath = "\"" + TARGET_NAME + ".app\"";
        test.equal(buildPhaseFileRef.name, quotedTargetPath);
        test.equal(buildPhaseFileRef.path, quotedTargetPath);

        test.done();
    }
}
