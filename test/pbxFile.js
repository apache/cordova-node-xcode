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

var pbxFile = require('../lib/pbxFile');

exports['lastKnownFileType'] = {
    'should detect that a .m path means sourcecode.c.objc': function (test) {
        var sourceFile = new pbxFile('Plugins/ChildBrowser.m');

        test.equal('sourcecode.c.objc', sourceFile.lastKnownFileType);
        test.done();
    },

    'should detect that a .h path means sourceFile.c.h': function (test) {
        var sourceFile = new pbxFile('Plugins/ChildBrowser.h');

        test.equal('sourcecode.c.h', sourceFile.lastKnownFileType);
        test.done();
    },

    'should detect that a .bundle path means "wrapper.plug-in"': function (test) {
        var sourceFile = new pbxFile('Plugins/ChildBrowser.bundle');

        test.equal('wrapper.plug-in', sourceFile.lastKnownFileType);
        test.done();
    },

    'should detect that a .xib path means file.xib': function (test) {
        var sourceFile = new pbxFile('Plugins/ChildBrowser.xib');

        test.equal('file.xib', sourceFile.lastKnownFileType);
        test.done();
    },

    'should detect that a .dylib path means "compiled.mach-o.dylib"': function (test) {
        var sourceFile = new pbxFile('libsqlite3.dylib');

        test.equal('compiled.mach-o.dylib', sourceFile.lastKnownFileType);
        test.done();
    },

    'should detect that a .tbd path means sourcecode.text-based-dylib-definition': function (test) {
        var sourceFile = new pbxFile('libsqlite3.tbd');

        test.equal('sourcecode.text-based-dylib-definition', sourceFile.lastKnownFileType);
        test.done();
    },

    'should detect that a .framework path means wrapper.framework': function (test) {
        var sourceFile = new pbxFile('MessageUI.framework');

        test.equal('wrapper.framework', sourceFile.lastKnownFileType);
        test.done();
    },

    'should detect that a .a path means archive.ar': function (test) {
        var sourceFile = new pbxFile('libGoogleAnalytics.a');

        test.equal('archive.ar', sourceFile.lastKnownFileType);
        test.done();
    },

    'should detect that a .xcdatamodel path means wrapper.xcdatamodel': function (test) {
        var sourceFile = new pbxFile('dataModel.xcdatamodel');

        test.equal('wrapper.xcdatamodel', sourceFile.lastKnownFileType);
        test.done();
    },

    'should allow lastKnownFileType to be overridden': function (test) {
        var sourceFile = new pbxFile('Plugins/ChildBrowser.m',
                { lastKnownFileType: 'somestupidtype' });

        test.equal('somestupidtype', sourceFile.lastKnownFileType);
        test.done();
    },

    'should set lastKnownFileType to unknown if undetectable': function (test) {
        var sourceFile = new pbxFile('Plugins/ChildBrowser.guh');

        test.equal('unknown', sourceFile.lastKnownFileType);
        test.done();
    }
}

exports['group'] = {
    'should be Sources for source files': function (test) {
        var sourceFile = new pbxFile('Plugins/ChildBrowser.m');

        test.equal('Sources', sourceFile.group);
        test.done();
    },
    'should be Sources for data model document files': function (test) {
        var dataModelFile = new pbxFile('dataModel.xcdatamodeld');

        test.equal('Sources', dataModelFile.group);
        test.done();
    },
    'should be Frameworks for dylibs': function (test) {
        var framework = new pbxFile('libsqlite3.dylib');

        test.equal('Frameworks', framework.group);
        test.done();
    },
    'should be Frameworks for tbds': function (test) {
        var framework = new pbxFile('libsqlite3.tbd');

        test.equal('Frameworks', framework.group);
        test.done();
    },
    'should be Frameworks for frameworks': function (test) {
        var framework = new pbxFile('MessageUI.framework');

        test.equal('Frameworks', framework.group);
        test.done();
    },
    'should be Resources for all other files': function (test) {
        var headerFile = new pbxFile('Plugins/ChildBrowser.h'),
            xibFile = new pbxFile('Plugins/ChildBrowser.xib');

        test.equal('Resources', headerFile.group);
        test.equal('Resources', xibFile.group);
        test.done();
    },
    'should be Frameworks for archives': function (test) {
        var archive = new pbxFile('libGoogleAnalytics.a');

        test.equal('Frameworks', archive.group);
        test.done();
    }
}

exports['basename'] = {
    'should be as expected': function (test) {
        var sourceFile = new pbxFile('Plugins/ChildBrowser.m');

        test.equal('ChildBrowser.m', sourceFile.basename);
        test.done();
    }
}

exports['sourceTree'] = {
    'should be SDKROOT for dylibs': function (test) {
        var sourceFile = new pbxFile('libsqlite3.dylib');

        test.equal('SDKROOT', sourceFile.sourceTree);
        test.done();
    },

    'should be SDKROOT for tbds': function (test) {
        var sourceFile = new pbxFile('libsqlite3.tbd');

        test.equal('SDKROOT', sourceFile.sourceTree);
        test.done();
    },

    'should be SDKROOT for frameworks': function (test) {
        var sourceFile = new pbxFile('MessageUI.framework');

        test.equal('SDKROOT', sourceFile.sourceTree);
        test.done();
    },

    'should default to "<group>" otherwise': function (test) {
        var sourceFile = new pbxFile('Plugins/ChildBrowser.m');

        test.equal('"<group>"', sourceFile.sourceTree);
        test.done();
    },

    'should be overridable either way': function (test) {
        var sourceFile = new pbxFile('Plugins/ChildBrowser.m',
            { sourceTree: 'SOMETHING'});

        test.equal('SOMETHING', sourceFile.sourceTree);
        test.done();
    },

    'should be  "<group>" for archives': function (test) {
        var archive = new pbxFile('libGoogleAnalytics.a');

        test.equal('"<group>"', archive.sourceTree);
        test.done();
    }
}

exports['path'] = {
    'should be "usr/lib" for dylibs (relative to SDKROOT)': function (test) {
        var sourceFile = new pbxFile('libsqlite3.dylib');

        test.equal('usr/lib/libsqlite3.dylib', sourceFile.path);
        test.done();
    },

    'should be "usr/lib" for tbds (relative to SDKROOT)': function (test) {
        var sourceFile = new pbxFile('libsqlite3.tbd');

        test.equal('usr/lib/libsqlite3.tbd', sourceFile.path);
        test.done();
    },

    'should be "System/Library/Frameworks" for frameworks': function (test) {
        var sourceFile = new pbxFile('MessageUI.framework');

        test.equal('System/Library/Frameworks/MessageUI.framework', sourceFile.path);
        test.done();
    },


    'should default to the first argument otherwise': function (test) {
        var sourceFile = new pbxFile('Plugins/ChildBrowser.m');

        test.equal('Plugins/ChildBrowser.m', sourceFile.path);
        test.done();
    }
}

exports['settings'] = {
   'should not be defined by default': function (test) {
      var sourceFile = new pbxFile('social.framework');

      test.equal(undefined, sourceFile.settings);
      test.done();
    },

    'should be undefined if weak is false or non-boolean': function (test) {
        var sourceFile1 = new pbxFile('social.framework',
            { weak: false });
        var sourceFile2 = new pbxFile('social.framework',
            { weak: 'bad_value' });

        test.equal(undefined, sourceFile1.settings);
        test.equal(undefined, sourceFile2.settings);
        test.done();
    },

    'should be {ATTRIBUTES:["Weak"]} if weak linking specified': function (test) {
        var sourceFile = new pbxFile('social.framework',
            { weak: true });

        test.deepEqual({ATTRIBUTES:["Weak"]}, sourceFile.settings);
        test.done();
    },

    'should be {ATTRIBUTES:["CodeSignOnCopy"]} if sign specified': function (test) {
        var sourceFile = new pbxFile('signable.framework',
            { embed: true, sign: true });

        test.deepEqual({ATTRIBUTES:["CodeSignOnCopy"]}, sourceFile.settings);
        test.done();
    },

    'should be {ATTRIBUTES:["Weak","CodeSignOnCopy"]} if both weak linking and sign specified': function (test) {
        var sourceFile = new pbxFile('signableWeak.framework',
            { embed: true, weak: true, sign: true });

        test.deepEqual({ATTRIBUTES:["Weak", "CodeSignOnCopy"]}, sourceFile.settings);
        test.done();
    },

    'should be {COMPILER_FLAGS:"blah"} if compiler flags specified': function (test) {
        var sourceFile = new pbxFile('Plugins/BarcodeScanner.m',
            { compilerFlags: "-std=c++11 -fno-objc-arc" });

        test.deepEqual({COMPILER_FLAGS:'"-std=c++11 -fno-objc-arc"'}, sourceFile.settings);
        test.done();
    },

    'should be .appex if {explicitFileType:\'"wrapper.app-extension"\'} specified': function (test) {
        var sourceFile = new pbxFile('AppExtension',
            { explicitFileType: '"wrapper.app-extension"'});

        test.equal('AppExtension.appex', sourceFile.basename);
        test.done();
    }
}
