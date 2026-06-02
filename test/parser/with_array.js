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
const assert = require('assert');

const PEG = require('pegjs');
const fs = require('fs');
const pbx = fs.readFileSync('test/parser/projects/with_array.pbxproj', 'utf-8');
const grammar = fs.readFileSync('lib/parser/pbxproj.pegjs', 'utf-8');
const parser = PEG.generate(grammar);
const rawProj = parser.parse(pbx);
const project = rawProj.project;

describe('parser/with_array', () => {
    it('should parse arrays with commented entries', () => {
        assert.ok(project.files instanceof Array);
        assert.strictEqual(project.files.length, 2);
    });

    it('should parse arrays with uncommented entries', () => {
        assert.ok(project.ARCHS instanceof Array);
        assert.strictEqual(project.ARCHS.length, 2);
    });

    it('should parse empty arrays', () => {
        assert.ok(project.empties instanceof Array);
        assert.strictEqual(project.empties.length, 0);
    });

    it('should be correct ordered', () => {
        const archs = project.ARCHS;
        assert.strictEqual(archs[0], 'armv6');
        assert.strictEqual(archs[1], 'armv7');
    });

    it('should parse values and comments correctly', () => {
        const appDelegate = project.files[1];
        assert.strictEqual(appDelegate.value, '1D3623260D0F684500981E51');
        assert.strictEqual(appDelegate.comment, 'AppDelegate.m in Sources');
    });
});
