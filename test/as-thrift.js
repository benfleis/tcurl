// Copyright (c) 2015 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

'use strict';

/* jshint maxparams:5 */

var test = require('tape');
var fs = require('fs');
var path = require('path');
var tcurl = require('../index.js');
var TChannel = require('tchannel');
var TChannelAsThrift = require('tchannel/as/thrift.js');

var meta = fs.readFileSync(path.join(__dirname, '..', 'meta.thrift'), 'utf-8');

test('getting an ok response', function t(assert) {

    var serviceName = 'meta';
    var server = new TChannel({
        serviceName: serviceName
    });

    var opts = {isOptions: true};
    var hostname = '127.0.0.1';
    var port = 4040;
    var endpoint = 'Meta::health';

    var tchannelAsThrift = TChannelAsThrift({source: meta});
    tchannelAsThrift.register(server, endpoint, opts, health);

    server.listen(port, hostname, onListening);
    function onListening() {
        var cmd = [
            '-p', hostname + ':' + port,
            serviceName,
            endpoint,
            '-t', path.join(__dirname, '..'),
            '-2', JSON.stringify({
                headerName: 'requestHeader'
            }),
            '-3', JSON.stringify({})
        ];

        tcurl.exec(cmd, onResponse);

        function onResponse(err, resp) {
            if (err) {
                return assert.end(err);
            }
            assert.deepEqual(resp.head, {
                headerName: 'responseHeader'
            }, 'caller receives headers from handler');
            assert.deepEqual(resp.body, {
                ok: true,
                message: null
            }, 'caller receives thrift body from handler');

            server.close();
            assert.end();
        }
    }

    function health(options, req, head, body, cb) {
        assert.deepEqual(options, {
            isOptions: true
        }, 'handler receives options through registration');
        assert.deepEqual(head, {
            headerName: 'requestHeader'
        }, 'handler receives request header from CLI');
        assert.deepEqual(body, {}, 'handler receives body from CLI');
        cb(null, {
            ok: true,
            head: {
                headerName: 'responseHeader'
            },
            body: {
                ok: true
            }
        });
    }

});
