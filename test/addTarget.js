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

var TARGET_NAME = 'TestExtension',
    TARGET_TYPE = 'app_extension',
    TARGET_SUBFOLDER_NAME = 'TestExtensionFiles';

exports.setUp = function (callback) {
    proj.hash = cleanHash();
    callback();
}

exports.addTarget = {
    'should throw when target name is missing': function (test) {
        test.throws(function() {
            proj.addTarget(null, TARGET_TYPE);
        });

        test.done();
    },
    'should throw when target type missing': function (test) {
        test.throws(function() {
            proj.addTarget(TARGET_NAME, null);
        });

        test.done();
    },
    'should create a new target': function (test) {
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

        test.done();
    },
    'should create a new target and add source, framework, resource and header files and the corresponding build phases': function (test) {
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
    'should add build phase for extension target': function (test) {
        var target = proj.addTarget(TARGET_NAME, TARGET_TYPE);
        test.ok(target.uuid);

        var phases = proj.pbxCopyfilesBuildPhaseObj(target.uuid);
        test.ok(phases);
        test.ok(phases.files);
        test.equal(phases.files.length, 1);

        test.done();
    },
    'should not add build phase for non-extension target': function (test) {
        var target = proj.addTarget(TARGET_NAME, 'application');
        test.ok(target.uuid);

        var phases = proj.pbxCopyfilesBuildPhaseObj(target.uuid);
        test.ok(!phases);

        test.done();
    },
    'should have "wrapper.application" filetype for application product': function (test) {
        var target = proj.addTarget(TARGET_NAME, 'application');
        test.ok(target);
        test.ok(target.pbxNativeTarget);
        test.ok(target.pbxNativeTarget.productReference);

        var productFile = proj.pbxFileReferenceSection()[target.pbxNativeTarget.productReference];
        test.ok(productFile);
        test.ok(productFile.explicitFileType);
        test.equal(productFile.explicitFileType, '"wrapper.application"');

        test.done();
    },
    'should have "wrapper.app-extension" filetype for app_extension product': function (test) {
        var target = proj.addTarget(TARGET_NAME, 'app_extension');
        test.ok(target);
        test.ok(target.pbxNativeTarget);
        test.ok(target.pbxNativeTarget.productReference);

        var productFile = proj.pbxFileReferenceSection()[target.pbxNativeTarget.productReference];
        test.ok(productFile);
        test.ok(productFile.explicitFileType);
        test.equal(productFile.explicitFileType, '"wrapper.app-extension"');

        test.done();
    },
    'should have "wrapper.plug-in" filetype for bundle product': function (test) {
        var target = proj.addTarget(TARGET_NAME, 'bundle');
        test.ok(target);
        test.ok(target.pbxNativeTarget);
        test.ok(target.pbxNativeTarget.productReference);

        var productFile = proj.pbxFileReferenceSection()[target.pbxNativeTarget.productReference];
        test.ok(productFile);
        test.ok(productFile.explicitFileType);
        test.equal(productFile.explicitFileType, '"wrapper.plug-in"');

        test.done();
    },
    'should have "compiled.mach-o.dylib" filetype for command_line_tool product': function (test) {
        var target = proj.addTarget(TARGET_NAME, 'command_line_tool');
        test.ok(target);
        test.ok(target.pbxNativeTarget);
        test.ok(target.pbxNativeTarget.productReference);

        var productFile = proj.pbxFileReferenceSection()[target.pbxNativeTarget.productReference];
        test.ok(productFile);
        test.ok(productFile.explicitFileType);
        test.equal(productFile.explicitFileType, '"compiled.mach-o.dylib"');

        test.done();
    },
    'should have "compiled.mach-o.dylib" filetype for dynamic_library product': function (test) {
        var target = proj.addTarget(TARGET_NAME, 'dynamic_library');
        test.ok(target);
        test.ok(target.pbxNativeTarget);
        test.ok(target.pbxNativeTarget.productReference);

        var productFile = proj.pbxFileReferenceSection()[target.pbxNativeTarget.productReference];
        test.ok(productFile);
        test.ok(productFile.explicitFileType);
        test.equal(productFile.explicitFileType, '"compiled.mach-o.dylib"');

        test.done();
    },
    'should have "wrapper.framework" filetype for framework product': function (test) {
        var target = proj.addTarget(TARGET_NAME, 'framework');
        test.ok(target);
        test.ok(target.pbxNativeTarget);
        test.ok(target.pbxNativeTarget.productReference);

        var productFile = proj.pbxFileReferenceSection()[target.pbxNativeTarget.productReference];
        test.ok(productFile);
        test.ok(productFile.explicitFileType);
        test.equal(productFile.explicitFileType, '"wrapper.framework"');

        test.done();
    },
    'should have "archive.ar" filetype for static_library product': function (test) {
        var target = proj.addTarget(TARGET_NAME, 'static_library');
        test.ok(target);
        test.ok(target.pbxNativeTarget);
        test.ok(target.pbxNativeTarget.productReference);

        var productFile = proj.pbxFileReferenceSection()[target.pbxNativeTarget.productReference];
        test.ok(productFile);
        test.ok(productFile.explicitFileType);
        test.equal(productFile.explicitFileType, '"archive.ar"');

        test.done();
    },
    'should have "wrapper.cfbundle" filetype for unit_test_bundle product': function (test) {
        var target = proj.addTarget(TARGET_NAME, 'unit_test_bundle');
        test.ok(target);
        test.ok(target.pbxNativeTarget);
        test.ok(target.pbxNativeTarget.productReference);

        var productFile = proj.pbxFileReferenceSection()[target.pbxNativeTarget.productReference];
        test.ok(productFile);
        test.ok(productFile.explicitFileType);
        test.equal(productFile.explicitFileType, '"wrapper.cfbundle"');

        test.done();
    },
    'should have "wrapper.application" filetype for watch_app product': function (test) {
        var target = proj.addTarget(TARGET_NAME, 'watch_app');
        test.ok(target);
        test.ok(target.pbxNativeTarget);
        test.ok(target.pbxNativeTarget.productReference);

        var productFile = proj.pbxFileReferenceSection()[target.pbxNativeTarget.productReference];
        test.ok(productFile);
        test.ok(productFile.explicitFileType);
        test.equal(productFile.explicitFileType, '"wrapper.application"');

        test.done();
    },
    'should have "wrapper.app-extension" filetype for watch_extension product': function (test) {
        var target = proj.addTarget(TARGET_NAME, 'watch_extension');
        test.ok(target);
        test.ok(target.pbxNativeTarget);
        test.ok(target.pbxNativeTarget.productReference);

        var productFile = proj.pbxFileReferenceSection()[target.pbxNativeTarget.productReference];
        test.ok(productFile);
        test.ok(productFile.explicitFileType);
        test.equal(productFile.explicitFileType, '"wrapper.app-extension"');

        test.done();
    }
}
