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

const { describe, it, afterEach } = require('node:test');
const assert = require('node:assert');

const PBXProject = require('../lib/pbxProject');
const buildConfig = require('./fixtures/buildFiles');
const jsonProject = require('./fixtures/full-project');
const fs = require('fs');

describe('PBXProject', () => {
    describe('creation', () => {
        it('should create a pbxProject with the new operator', () => {
            const myProj = new PBXProject('test/parser/projects/hash.pbxproj');

            assert.ok(myProj instanceof PBXProject);
        });

        it('should create a pbxProject without the new operator', () => {
            const myProj = PBXProject('test/parser/projects/hash.pbxproj');

            assert.ok(myProj instanceof PBXProject);
        });
    });

    describe('parseSync function', () => {
        it('should return the hash object', () => {
            const myProj = new PBXProject('test/parser/projects/hash.pbxproj');
            const projHash = myProj.parseSync();
            assert.ok(projHash);
        });
        it('should contain valid data in the returned objects hash', () => {
            const myProj = new PBXProject('test/parser/projects/hash.pbxproj');
            const projHash = myProj.parseSync();
            assert.ok(projHash);

            assert.equal(projHash.hash.project.archiveVersion, 1);
            assert.equal(projHash.hash.project.objectVersion, 45);
            assert.equal(projHash.hash.project.nonObject, '29B97313FDCFA39411CA2CEF');
        });
    });

    describe('parse function', () => {
        it('should emit an "end" event', (t, done) => {
            const myProj = new PBXProject('test/parser/projects/hash.pbxproj');

            myProj.parse().on('end', function () {
                done();
            });
        });
        it('should take the end callback as a parameter', (t, done) => {
            const myProj = new PBXProject('test/parser/projects/hash.pbxproj');

            myProj.parse(function () {
                done();
            });
        });
        it('should allow evented error handling', (t, done) => {
            const myProj = new PBXProject('NotARealPath.pbxproj');

            myProj.parse().on('error', function (err) {
                assert.equal(typeof err, 'object');
                done();
            });
        });
        it('should pass the hash object to the callback function', (t, done) => {
            const myProj = new PBXProject('test/parser/projects/hash.pbxproj');

            myProj.parse(function (_, projHash) {
                assert.ok(projHash);
                done();
            });
        });
        it('should handle projects with comments in the header', (t, done) => {
            const myProj = new PBXProject('test/parser/projects/comments.pbxproj');

            myProj.parse(function (_, projHash) {
                assert.ok(projHash);
                done();
            });
        });
        it('should attach the hash object to the pbx object', (t, done) => {
            const myProj = new PBXProject('test/parser/projects/hash.pbxproj');

            myProj.parse(function () {
                assert.ok(myProj.hash);
                done();
            });
        });
        it('it should pass an error object back when the parsing fails', (t, done) => {
            const myProj = new PBXProject('test/parser/projects/fail.pbxproj');

            myProj.parse(function (err, _) {
                assert.ok(err);
                done();
            });
        });
    });

    describe('allUuids function', () => {
        it('should return the right amount of uuids', () => {
            const project = new PBXProject('.');

            project.hash = buildConfig;
            const uuids = project.allUuids();

            assert.equal(uuids.length, 4);
        });
    });

    describe('generateUuid function', () => {
        it('should return a 24 character string', () => {
            const project = new PBXProject('.');

            project.hash = buildConfig;
            const newUUID = project.generateUuid();

            assert.equal(newUUID.length, 24);
        });
        it('should be an uppercase hex string', () => {
            const project = new PBXProject('.');
            const uHex = /^[A-F0-9]{24}$/;

            project.hash = buildConfig;
            const newUUID = project.generateUuid();

            assert.ok(uHex.test(newUUID));
        });
    });

    const bcpbx = 'test/parser/projects/build-config.pbxproj';
    const original_pbx = fs.readFileSync(bcpbx, 'utf-8');

    describe('updateProductName function', () => {
        afterEach(() => {
            fs.writeFileSync(bcpbx, original_pbx, 'utf-8');
        });
        it('should change the PRODUCT_NAME field in the .pbxproj file', (t, done) => {
            const myProj = new PBXProject('test/parser/projects/build-config.pbxproj');
            myProj.parse(function () {
                myProj.updateProductName('furious anger');
                const newContents = myProj.writeSync();
                assert.ok(newContents.match(/PRODUCT_NAME\s*=\s*"furious anger"/));
                done();
            });
        });
    });

    describe('updateBuildProperty function', () => {
        afterEach(() => {
            fs.writeFileSync(bcpbx, original_pbx, 'utf-8');
        });
        it('should change build properties in the .pbxproj file', (t, done) => {
            const myProj = new PBXProject('test/parser/projects/build-config.pbxproj');
            myProj.parse(function () {
                myProj.updateBuildProperty('TARGETED_DEVICE_FAMILY', '"arm"');
                let newContents = myProj.writeSync();
                assert.ok(newContents.match(/TARGETED_DEVICE_FAMILY\s*=\s*"arm"/));
                myProj.updateBuildProperty('OTHER_LDFLAGS', ['T', 'E', 'S', 'T']);
                newContents = myProj.writeSync();
                assert.ok(newContents.match(/OTHER_LDFLAGS\s*=\s*\(\s*T,\s*E,\s*S,\s*T,\s*\)/));
                done();
            });
        });
        it('should change all targets in .pbxproj with multiple targets', (t, done) => {
            const myProj = new PBXProject('test/parser/projects/multitarget.pbxproj');
            myProj.parse(function () {
                myProj.updateBuildProperty('PRODUCT_BUNDLE_IDENTIFIER', 'comcompanytest');
                const newContents = myProj.writeSync();
                // Should be 10 times = 5 targets, debug and release each
                assert.ok(newContents.match(/PRODUCT_BUNDLE_IDENTIFIER\s*=\s*comcompanytest/g).length === 10);
                done();
            });
        });
        it('should change only one target in .pbxproj with multiple targets', (t, done) => {
            const myProj = new PBXProject('test/parser/projects/multitarget.pbxproj');
            myProj.parse(function () {
                myProj.updateBuildProperty('PRODUCT_BUNDLE_IDENTIFIER', 'comcompanytest', null, 'MultiTargetTest');
                const newContents = myProj.writeSync();
                // should be 2 times = one target debug and release
                assert.ok(newContents.match(/PRODUCT_BUNDLE_IDENTIFIER\s*=\s*comcompanytest/g).length === 2);
                done();
            });
        });
    });

    describe('getBuildProperty function', () => {
        afterEach(() => {
            fs.writeFileSync(bcpbx, original_pbx, 'utf-8');
        });
        it('should change all targets in .pbxproj with multiple targets', (t, done) => {
            const myProj = new PBXProject('test/parser/projects/multitarget.pbxproj');
            myProj.parse(function () {
                myProj.updateBuildProperty('PRODUCT_BUNDLE_IDENTIFIER', 'comcompanytest');
                myProj.writeSync();
                assert.ok(myProj.getBuildProperty('PRODUCT_BUNDLE_IDENTIFIER') === 'comcompanytest');
                done();
            });
        });
        it('should change only one target in .pbxproj with multiple targets', (t, done) => {
            const myProj = new PBXProject('test/parser/projects/multitarget.pbxproj');
            myProj.parse(function () {
                myProj.updateBuildProperty('PRODUCT_BUNDLE_IDENTIFIER', 'comcompanytest', null, 'MultiTargetTest');
                myProj.writeSync();
                assert.ok(myProj.getBuildProperty('PRODUCT_BUNDLE_IDENTIFIER', undefined, 'MultiTargetTest') === 'comcompanytest');
                done();
            });
        });
    });

    describe('addBuildProperty function', () => {
        afterEach(() => {
            fs.writeFileSync(bcpbx, original_pbx, 'utf-8');
        });
        it('should add 4 build properties in the .pbxproj file', (t, done) => {
            const myProj = new PBXProject('test/parser/projects/build-config.pbxproj');
            myProj.parse(function () {
                myProj.addBuildProperty('ENABLE_BITCODE', 'NO');
                const newContents = myProj.writeSync();
                assert.equal(newContents.match(/ENABLE_BITCODE\s*=\s*NO/g).length, 4);
                done();
            });
        });
        it('should add 2 build properties in the .pbxproj file for specific build', (t, done) => {
            const myProj = new PBXProject('test/parser/projects/build-config.pbxproj');
            myProj.parse(function () {
                myProj.addBuildProperty('ENABLE_BITCODE', 'NO', 'Release');
                const newContents = myProj.writeSync();
                assert.equal(newContents.match(/ENABLE_BITCODE\s*=\s*NO/g).length, 2);
                done();
            });
        });
        it('should not add build properties in the .pbxproj file for nonexist build', (t, done) => {
            const myProj = new PBXProject('test/parser/projects/build-config.pbxproj');
            myProj.parse(function () {
                myProj.addBuildProperty('ENABLE_BITCODE', 'NO', 'nonexist');
                const newContents = myProj.writeSync();
                assert.ok(!newContents.match(/ENABLE_BITCODE\s*=\s*NO/g));
                done();
            });
        });
    });

    describe('removeBuildProperty function', () => {
        afterEach(() => {
            fs.writeFileSync(bcpbx, original_pbx, 'utf-8');
        });
        it('should remove all build properties in the .pbxproj file', (t, done) => {
            const myProj = new PBXProject('test/parser/projects/build-config.pbxproj');
            myProj.parse(function () {
                myProj.removeBuildProperty('IPHONEOS_DEPLOYMENT_TARGET');
                const newContents = myProj.writeSync();
                assert.ok(!newContents.match(/IPHONEOS_DEPLOYMENT_TARGET/));
                done();
            });
        });
        it('should remove specific build properties in the .pbxproj file', (t, done) => {
            const myProj = new PBXProject('test/parser/projects/build-config.pbxproj');
            myProj.parse(function () {
                myProj.removeBuildProperty('IPHONEOS_DEPLOYMENT_TARGET', 'Debug');
                const newContents = myProj.writeSync();
                assert.equal(newContents.match(/IPHONEOS_DEPLOYMENT_TARGET/g).length, 2);
                done();
            });
        });
        it('should not remove any build properties in the .pbxproj file', (t, done) => {
            const myProj = new PBXProject('test/parser/projects/build-config.pbxproj');
            myProj.parse(function () {
                myProj.removeBuildProperty('IPHONEOS_DEPLOYMENT_TARGET', 'notexist');
                const newContents = myProj.writeSync();
                assert.equal(newContents.match(/IPHONEOS_DEPLOYMENT_TARGET/g).length, 4);
                done();
            });
        });
        it('should fine with remove inexist build properties in the .pbxproj file', (t, done) => {
            const myProj = new PBXProject('test/parser/projects/build-config.pbxproj');
            myProj.parse(function () {
                myProj.removeBuildProperty('ENABLE_BITCODE');
                const newContents = myProj.writeSync();
                assert.ok(!newContents.match(/ENABLE_BITCODE/));
                done();
            });
        });
    });

    describe('productName field', () => {
        it('should return the product name', () => {
            const newProj = new PBXProject('.');
            newProj.hash = jsonProject;

            assert.equal(newProj.productName, 'KitchenSinktablet');
        });
    });

    describe('addPluginFile function', () => {
        it('should strip the Plugin path prefix', (t, done) => {
            const myProj = new PBXProject('test/parser/projects/full.pbxproj');

            myProj.parse(function () {
                assert.equal(myProj.addPluginFile('Plugins/testMac.m').path, 'testMac.m');
                assert.equal(myProj.addPluginFile('Plugins\\testWin.m').path, 'testWin.m');
                done();
            });
        });
        it('should add files to the .pbxproj file using the / path seperator', (t, done) => {
            const myProj = new PBXProject('test/parser/projects/full.pbxproj');

            myProj.parse(function () {
                const file = myProj.addPluginFile('myPlugin\\newFile.m');

                assert.equal(myProj.pbxFileReferenceSection()[file.fileRef].path, '"myPlugin/newFile.m"');
                done();
            });
        });
    });

    describe('hasFile', () => {
        it('should return true if the file is in the project', () => {
            const newProj = new PBXProject('.');
            newProj.hash = jsonProject;

            //  sourceTree: '"<group>"'
            assert.ok(newProj.hasFile('AppDelegate.m'));
        });

        it('should return false if the file is not in the project', () => {
            const newProj = new PBXProject('.');
            newProj.hash = jsonProject;

            //  sourceTree: '"<group>"'
            assert.ok(!newProj.hasFile('NotTheAppDelegate.m'));
        });
    });
});
