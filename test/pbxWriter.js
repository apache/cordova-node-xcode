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

const { describe, it } = require('node:test');
const assert = require('node:assert');

const PBXProject = require('../lib/pbxProject');
const fs = require('fs');

function testProjectContents (filename, expectedFilename) {
    const myProj = new PBXProject(filename);

    let content;
    if (expectedFilename) {
        content = fs.readFileSync(expectedFilename, 'utf-8');
    } else {
        content = fs.readFileSync(filename, 'utf-8');
    }
    // normalize tabs vs strings
    content = content.replace(/ {4}/g, '\t');

    return new Promise(function (resolve) {
        myProj.parse(function () {
            const written = myProj.writeSync();
            assert.equal(content, written);
            resolve();
        });
    });
}

// // for debugging failing tests
// function testContentsInDepth(filename) {
//     var myProj = new PBXProject(filename),
//         content = fs.readFileSync(filename, 'utf-8');

//     // normalize tabs vs strings
//     content = content.replace(/    /g, '\t');

//     myProj.parse(function (err, projHash) {
//         var written = myProj.writeSync(),
//             writtenLines = written.split('\n')
//             contentLines = content.split('\n')

//         assert.equal(writtenLines.length, contentLines.length);

//         for (var i=0; i<writtenLines.length; i++) {
//             assert.equal(writtenLines[i], contentLines[i],
//                 'match failed on line ' + (i+1))
//         }
//     });
// }

describe('writeSync', () => {
    it('should write out the "hash" test', () => {
        testProjectContents('test/parser/projects/hash.pbxproj');
    });

    it('should write out the "with_array" test', () => {
        // Special case in that the originating project does not have a trailing comma for all of its array entries.
        // This is definitely possibly.
        // But when we write/read it out again during testing, the trailing commas are introduced by our library.
        testProjectContents('test/parser/projects/with_array.pbxproj', 'test/parser/projects/expected/with_array_expected.pbxproj');
    });

    it('should write out the "section" test', () => {
        testProjectContents('test/parser/projects/section.pbxproj');
    });

    it('should write out the "two-sections" test', () => {
        testProjectContents('test/parser/projects/two-sections.pbxproj');
    });

    it('should write out the "section-entries" test', () => {
        testProjectContents('test/parser/projects/section-entries.pbxproj');
    });

    it('should write out the "build-config" test', () => {
        testProjectContents('test/parser/projects/build-config.pbxproj');
    });

    it('should write out the "header-search" test', () => {
        testProjectContents('test/parser/projects/header-search.pbxproj');
    });

    it('should write out the "nested-object" test', () => {
        testProjectContents('test/parser/projects/nested-object.pbxproj');
    });

    it('should write out the "build-files" test', () => {
        testProjectContents('test/parser/projects/build-files.pbxproj');
    });

    it('should write out the "file-references" test', () => {
        testProjectContents('test/parser/projects/file-references.pbxproj');
    });

    it('should not null and undefined with the "omitEmptyValues" option set to false test', (t, done) => {
        const filename = 'test/parser/projects/with_omit_empty_values_disabled.pbxproj';
        const expectedFilename = 'test/parser/projects/expected/with_omit_empty_values_disabled_expected.pbxproj';
        let content = fs.readFileSync(expectedFilename, 'utf-8').replace(/ {4}/g, '\t');
        const project = new PBXProject(filename);
        project.parse(function (err) {
            if (err) {
                done(err);
                return assert.fail(err);
            }
            const group = project.addPbxGroup([], 'CustomGroup', undefined);
            const written = project.writeSync();
            content = content.replace('CUSTOM_GROUP_UUID_REPLACED_BY_TEST', group.uuid);
            assert.equal(content, written);
            done();
        });
    });

    it('should drop null and undefined with the "omitEmptyValues" option set to true test', (t, done) => {
        const filename = 'test/parser/projects/with_omit_empty_values_enabled.pbxproj';
        const expectedFilename = 'test/parser/projects/expected/with_omit_empty_values_enabled_expected.pbxproj';
        let content = fs.readFileSync(expectedFilename, 'utf-8').replace(/ {4}/g, '\t');
        const project = new PBXProject(filename);
        project.parse(function (err) {
            if (err) {
                done(err);
                return assert.fail(err);
            }
            const group = project.addPbxGroup([], 'CustomGroup', undefined);
            const written = project.writeSync({ omitEmptyValues: true });
            content = content.replace('CUSTOM_GROUP_UUID_REPLACED_BY_TEST', group.uuid);
            assert.equal(content, written);
            done();
        });
    });
});
