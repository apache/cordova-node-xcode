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
const assert = require('assert');

const PEG = require('pegjs');
const fs = require('fs');
const pbx = fs.readFileSync('test/parser/projects/section-split.pbxproj', 'utf-8');
const grammar = fs.readFileSync('lib/parser/pbxproj.pegjs', 'utf-8');
const parser = PEG.generate(grammar);
const rawProj = parser.parse(pbx);
const project = rawProj.project;

describe('parser/section-split', () => {
    it('should have a PBXTargetDependency section', () => {
        assert.ok(project.objects.PBXTargetDependency);
    });

    it('should have the right child of PBXTargetDependency section', () => {
        assert.ok(project.objects.PBXTargetDependency['301BF551109A68C00062928A']);
    });

    it('should have the right properties on the dependency', () => {
        const dependency = project.objects.PBXTargetDependency['301BF551109A68C00062928A'];

        assert.strictEqual(dependency.isa, 'PBXTargetDependency');
        assert.strictEqual(dependency.name, 'PhoneGapLib');
        assert.strictEqual(dependency.targetProxy, '301BF550109A68C00062928A');
        assert.strictEqual(dependency.targetProxy_comment, 'PBXContainerItemProxy');
    });

    it('should merge two PBXTargetDependency sections', () => {
        assert.ok(project.objects.PBXTargetDependency['301BF551109A68C00062928A']);
        assert.ok(project.objects.PBXTargetDependency['45FDD1944D304A9F96DF3AC6']);
    });
});
