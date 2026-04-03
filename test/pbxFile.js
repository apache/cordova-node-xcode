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

const { describe, it } = require('node:test');
const assert = require('node:assert');

const pbxFile = require('../lib/pbxFile');

describe('pbxFile', () => {
    describe('lastKnownFileType', () => {
        it('should detect that a .m path means sourcecode.c.objc', () => {
            const sourceFile = new pbxFile('Plugins/ChildBrowser.m');

            assert.equal('sourcecode.c.objc', sourceFile.lastKnownFileType);
        });

        it('should detect that a .h path means sourceFile.c.h', () => {
            const sourceFile = new pbxFile('Plugins/ChildBrowser.h');

            assert.equal('sourcecode.c.h', sourceFile.lastKnownFileType);
        });

        it('should detect that a .bundle path means "wrapper.plug-in"', () => {
            const sourceFile = new pbxFile('Plugins/ChildBrowser.bundle');

            assert.equal('wrapper.plug-in', sourceFile.lastKnownFileType);
        });

        it('should detect that a .xib path means file.xib', () => {
            const sourceFile = new pbxFile('Plugins/ChildBrowser.xib');

            assert.equal('file.xib', sourceFile.lastKnownFileType);
        });

        it('should detect that a .dylib path means "compiled.mach-o.dylib"', () => {
            const sourceFile = new pbxFile('libsqlite3.dylib');

            assert.equal('compiled.mach-o.dylib', sourceFile.lastKnownFileType);
        });

        it('should detect that a .tbd path means sourcecode.text-based-dylib-definition', () => {
            const sourceFile = new pbxFile('libsqlite3.tbd');

            assert.equal('sourcecode.text-based-dylib-definition', sourceFile.lastKnownFileType);
        });

        it('should detect that a .framework path means wrapper.framework', () => {
            const sourceFile = new pbxFile('MessageUI.framework');

            assert.equal('wrapper.framework', sourceFile.lastKnownFileType);
        });

        it('should detect that a .a path means archive.ar', () => {
            const sourceFile = new pbxFile('libGoogleAnalytics.a');

            assert.equal('archive.ar', sourceFile.lastKnownFileType);
        });

        it('should detect that a .xcdatamodel path means wrapper.xcdatamodel', () => {
            const sourceFile = new pbxFile('dataModel.xcdatamodel');

            assert.equal('wrapper.xcdatamodel', sourceFile.lastKnownFileType);
        });

        it('should allow lastKnownFileType to be overridden', () => {
            const sourceFile = new pbxFile('Plugins/ChildBrowser.m',
                { lastKnownFileType: 'somestupidtype' });

            assert.equal('somestupidtype', sourceFile.lastKnownFileType);
        });

        it('should set lastKnownFileType to unknown if undetectable', () => {
            const sourceFile = new pbxFile('Plugins/ChildBrowser.guh');

            assert.equal('unknown', sourceFile.lastKnownFileType);
        });
    });

    describe('group', () => {
        it('should be Sources for source files', () => {
            const sourceFile = new pbxFile('Plugins/ChildBrowser.m');

            assert.equal('Sources', sourceFile.group);
        });

        it('should be Sources for data model document files', () => {
            const dataModelFile = new pbxFile('dataModel.xcdatamodeld');

            assert.equal('Sources', dataModelFile.group);
        });

        it('should be Frameworks for dylibs', () => {
            const framework = new pbxFile('libsqlite3.dylib');

            assert.equal('Frameworks', framework.group);
        });

        it('should be Frameworks for tbds', () => {
            const framework = new pbxFile('libsqlite3.tbd');

            assert.equal('Frameworks', framework.group);
        });

        it('should be Frameworks for frameworks', () => {
            const framework = new pbxFile('MessageUI.framework');

            assert.equal('Frameworks', framework.group);
        });

        it('should be Resources for all other files', () => {
            const headerFile = new pbxFile('Plugins/ChildBrowser.h');
            const xibFile = new pbxFile('Plugins/ChildBrowser.xib');

            assert.equal('Resources', headerFile.group);
            assert.equal('Resources', xibFile.group);
        });

        it('should be Frameworks for archives', () => {
            const archive = new pbxFile('libGoogleAnalytics.a');

            assert.equal('Frameworks', archive.group);
        });
    });

    describe('basename', () => {
        it('should be as expected', () => {
            const sourceFile = new pbxFile('Plugins/ChildBrowser.m');

            assert.equal('ChildBrowser.m', sourceFile.basename);
        });
    });

    describe('sourceTree', () => {
        it('should be SDKROOT for dylibs', () => {
            const sourceFile = new pbxFile('libsqlite3.dylib');

            assert.equal('SDKROOT', sourceFile.sourceTree);
        });

        it('should be SDKROOT for tbds', () => {
            const sourceFile = new pbxFile('libsqlite3.tbd');

            assert.equal('SDKROOT', sourceFile.sourceTree);
        });

        it('should be SDKROOT for frameworks', () => {
            const sourceFile = new pbxFile('MessageUI.framework');

            assert.equal('SDKROOT', sourceFile.sourceTree);
        });

        it('should default to "<group>" otherwise', () => {
            const sourceFile = new pbxFile('Plugins/ChildBrowser.m');

            assert.equal('"<group>"', sourceFile.sourceTree);
        });

        it('should be overridable either way', () => {
            const sourceFile = new pbxFile('Plugins/ChildBrowser.m',
                { sourceTree: 'SOMETHING' });

            assert.equal('SOMETHING', sourceFile.sourceTree);
        });

        it('should be  "<group>" for archives', () => {
            const archive = new pbxFile('libGoogleAnalytics.a');

            assert.equal('"<group>"', archive.sourceTree);
        });
    });

    describe('path', () => {
        it('should be "usr/lib" for dylibs (relative to SDKROOT)', () => {
            const sourceFile = new pbxFile('libsqlite3.dylib');

            assert.equal('usr/lib/libsqlite3.dylib', sourceFile.path);
        });

        it('should be "usr/lib" for tbds (relative to SDKROOT)', () => {
            const sourceFile = new pbxFile('libsqlite3.tbd');

            assert.equal('usr/lib/libsqlite3.tbd', sourceFile.path);
        });

        it('should be "System/Library/Frameworks" for frameworks', () => {
            const sourceFile = new pbxFile('MessageUI.framework');

            assert.equal('System/Library/Frameworks/MessageUI.framework', sourceFile.path);
        });

        it('should default to the first argument otherwise', () => {
            const sourceFile = new pbxFile('Plugins/ChildBrowser.m');

            assert.equal('Plugins/ChildBrowser.m', sourceFile.path);
        });
    });

    describe('settings', () => {
        it('should not be defined by default', () => {
            const sourceFile = new pbxFile('social.framework');

            assert.equal(undefined, sourceFile.settings);
        });

        it('should be undefined if weak is false or non-boolean', () => {
            const sourceFile1 = new pbxFile('social.framework',
                { weak: false });
            const sourceFile2 = new pbxFile('social.framework',
                { weak: 'bad_value' });

            assert.equal(undefined, sourceFile1.settings);
            assert.equal(undefined, sourceFile2.settings);
        });

        it('should be {ATTRIBUTES:["Weak"]} if weak linking specified', () => {
            const sourceFile = new pbxFile('social.framework',
                { weak: true });

            assert.deepEqual({ ATTRIBUTES: ['Weak'] }, sourceFile.settings);
        });

        it('should be {ATTRIBUTES:["CodeSignOnCopy"]} if sign specified', () => {
            const sourceFile = new pbxFile('signable.framework',
                { embed: true, sign: true });

            assert.deepEqual({ ATTRIBUTES: ['CodeSignOnCopy'] }, sourceFile.settings);
        });

        it('should be {ATTRIBUTES:["Weak","CodeSignOnCopy"]} if both weak linking and sign specified', () => {
            const sourceFile = new pbxFile('signableWeak.framework',
                { embed: true, weak: true, sign: true });

            assert.deepEqual({ ATTRIBUTES: ['Weak', 'CodeSignOnCopy'] }, sourceFile.settings);
        });

        it('should be {COMPILER_FLAGS:"blah"} if compiler flags specified', () => {
            const sourceFile = new pbxFile('Plugins/BarcodeScanner.m',
                { compilerFlags: '-std=c++11 -fno-objc-arc' });

            assert.deepEqual({ COMPILER_FLAGS: '"-std=c++11 -fno-objc-arc"' }, sourceFile.settings);
        });

        it('should be .appex if {explicitFileType:\'"wrapper.app-extension"\'} specified', () => {
            const sourceFile = new pbxFile('AppExtension',
                { explicitFileType: '"wrapper.app-extension"' });

            assert.equal('AppExtension.appex', sourceFile.basename);
        });
    });
});
