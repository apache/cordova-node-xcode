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

var PEG = require('pegjs');

var fs = require('fs');
var pbx = fs.readFileSync('test/parser/projects/with_array.pbxproj', 'utf-8');
var grammar = fs.readFileSync('lib/parser/pbxproj.pegjs', 'utf-8');
var parser = PEG.generate(grammar);
var rawProj = parser.parse(pbx);
var project = rawProj.project;

exports['should parse arrays with commented entries'] = function (test) {
    test.ok(project.files instanceof Array);
    test.equal(project.files.length, 2);
    test.done()
}

exports['should parse arrays with uncommented entries'] = function (test) {
    test.ok(project.ARCHS instanceof Array);
    test.equal(project.ARCHS.length, 2);
    test.done()
}

exports['should parse empty arrays'] = function (test) {
    test.ok(project.empties instanceof Array);
    test.equal(project.empties.length, 0);
    test.done();
}

exports['should be correct ordered'] = function (test) {
    var archs = project.ARCHS;
    test.equal(archs[0], 'armv6');
    test.equal(archs[1], 'armv7');
    test.done();
}

exports['should parse values and comments correctly'] = function (test) {
    var appDelegate = project.files[1]
    test.equal(appDelegate.value, '1D3623260D0F684500981E51')
    test.equal(appDelegate.comment, 'AppDelegate.m in Sources')
    test.done()
}
