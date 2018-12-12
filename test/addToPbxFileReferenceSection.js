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

var jsonProject = require('./fixtures/full-project')
    fullProjectStr = JSON.stringify(jsonProject),
    pbx = require('../lib/pbxProject'),
    pbxFile = require('../lib/pbxFile'),
    myProj = new pbx('.');

function cleanHash() {
    return JSON.parse(fullProjectStr);
}

exports.setUp = function (callback) {
    myProj.hash = cleanHash();
    callback();
}

exports['addToPbxFileReferenceSection function'] = {
    'should add file and comment to fileReferenceSection': function (test) {
        var file = new pbxFile('file.m');
        file.fileRef = myProj.generateUuid();

        myProj.addToPbxFileReferenceSection(file)

        test.equal(myProj.pbxFileReferenceSection()[file.fileRef].isa, 'PBXFileReference');
        test.equal(myProj.pbxFileReferenceSection()[file.fileRef].lastKnownFileType, 'sourcecode.c.objc');
        test.equal(myProj.pbxFileReferenceSection()[file.fileRef].name, '"file.m"');
        test.equal(myProj.pbxFileReferenceSection()[file.fileRef].path, '"file.m"');
        test.equal(myProj.pbxFileReferenceSection()[file.fileRef].sourceTree, '"<group>"');
        test.equal(myProj.pbxFileReferenceSection()[file.fileRef].fileEncoding, 4);
        test.equal(myProj.pbxFileReferenceSection()[file.fileRef + "_comment"], 'file.m');
        test.done();
    },
    'should add file with preset explicitFileType to fileReferenceSection correctly': function (test) {
        var appexFile = { fileRef: myProj.generateUuid(), isa: 'PBXFileReference', explicitFileType: '"wrapper.app-extension"', path: "WatchKit Extension.appex"};

        myProj.addToPbxFileReferenceSection(appexFile)

        test.equal(myProj.pbxFileReferenceSection()[appexFile.fileRef].isa, 'PBXFileReference');
        test.equal(myProj.pbxFileReferenceSection()[appexFile.fileRef].explicitFileType, '"wrapper.app-extension"');
        test.equal(myProj.pbxFileReferenceSection()[appexFile.fileRef].path, '"WatchKit Extension.appex"');
        test.done();
    },
    'should add file with preset includeInIndex to fileReferenceSection correctly': function (test) {
        var appexFile = { fileRef: myProj.generateUuid(), isa: 'PBXFileReference', includeInIndex: 0, path: "WatchKit Extension.appex"};

        myProj.addToPbxFileReferenceSection(appexFile)

        test.equal(myProj.pbxFileReferenceSection()[appexFile.fileRef].isa, 'PBXFileReference');
        test.equal(myProj.pbxFileReferenceSection()[appexFile.fileRef].includeInIndex, 0);
        test.equal(myProj.pbxFileReferenceSection()[appexFile.fileRef].path, '"WatchKit Extension.appex"');
        test.done();
    },
    'should add file with preset sourceTree to fileReferenceSection correctly': function (test) {
        var appexFile = { fileRef: myProj.generateUuid(), isa: 'PBXFileReference', sourceTree: 'BUILT_PRODUCTS_DIR', path: "WatchKit Extension.appex"};

        myProj.addToPbxFileReferenceSection(appexFile)

        test.equal(myProj.pbxFileReferenceSection()[appexFile.fileRef].isa, 'PBXFileReference');
        test.equal(myProj.pbxFileReferenceSection()[appexFile.fileRef].sourceTree, 'BUILT_PRODUCTS_DIR');
        test.equal(myProj.pbxFileReferenceSection()[appexFile.fileRef].path, '"WatchKit Extension.appex"');
        test.done();
    }
}
