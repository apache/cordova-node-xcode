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

exports.setUp = function (callback) {
    proj.hash = cleanHash();
    callback();
}

exports.addHeaderFile = {
    'should return a pbxFile': function (test) {
        var newFile = proj.addHeaderFile('file.h');

        test.equal(newFile.constructor, pbxFile);
        test.done()
    },
    'should set a fileRef on the pbxFile': function (test) {
        var newFile = proj.addHeaderFile('file.h');

        test.ok(newFile.fileRef);
        test.done()
    },
    'should populate the PBXFileReference section with 2 fields': function (test) {
        var newFile = proj.addHeaderFile('file.h'),
            fileRefSection = proj.pbxFileReferenceSection(),
            frsLength = Object.keys(fileRefSection).length;

        test.equal(68, frsLength);
        test.ok(fileRefSection[newFile.fileRef]);
        test.ok(fileRefSection[newFile.fileRef + '_comment']);

        test.done();
    },
    'should populate the PBXFileReference comment correctly': function (test) {
        var newFile = proj.addHeaderFile('file.h'),
            fileRefSection = proj.pbxFileReferenceSection(),
            commentKey = newFile.fileRef + '_comment';

        test.equal(fileRefSection[commentKey], 'file.h');
        test.done();
    },
    'should add the PBXFileReference object correctly': function (test) {
        var newFile = proj.addHeaderFile('Plugins/file.h'),
            fileRefSection = proj.pbxFileReferenceSection(),
            fileRefEntry = fileRefSection[newFile.fileRef];

        test.equal(fileRefEntry.isa, 'PBXFileReference');
        test.equal(fileRefEntry.fileEncoding, 4);
        test.equal(fileRefEntry.lastKnownFileType, 'sourcecode.c.h');
        test.equal(fileRefEntry.name, '"file.h"');
        test.equal(fileRefEntry.path, '"file.h"');
        test.equal(fileRefEntry.sourceTree, '"<group>"');

        test.done();
    },
    'should add to the Plugins PBXGroup group': function (test) {
        var newFile = proj.addHeaderFile('Plugins/file.h'),
            plugins = proj.pbxGroupByName('Plugins');

        test.equal(plugins.children.length, 1);
        test.done();
    },
    'should have the right values for the PBXGroup entry': function (test) {
        var newFile = proj.addHeaderFile('Plugins/file.h'),
            plugins = proj.pbxGroupByName('Plugins'),
            pluginObj = plugins.children[0];

        test.equal(pluginObj.comment, 'file.h');
        test.equal(pluginObj.value, newFile.fileRef);
        test.done();
    },
    'duplicate entries': {
        'should return false': function (test) {
            var newFile = proj.addHeaderFile('Plugins/file.h');

            test.ok(!proj.addHeaderFile('Plugins/file.h'));
            test.done();
        },
        'should not add another entry anywhere': function (test) {
            var newFile = proj.addHeaderFile('Plugins/file.h'),
                fileRefSection = proj.pbxFileReferenceSection(),
                frsLength = Object.keys(fileRefSection).length,
                plugins = proj.pbxGroupByName('Plugins');

            proj.addHeaderFile('Plugins/file.h');

            test.equal(68, frsLength);
            test.equal(plugins.children.length, 1);
            test.done();
        }
    }
}
