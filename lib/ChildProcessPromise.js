'use strict';

var Promise;

function isBluebird(promiseClass) {
    return promiseClass.version != undefined;
}

if (require('node-version').major >= 4 && !isBluebird(global.Promise)) {
    Promise = global.Promise;
} else {
    // Don't use the native Promise in Node.js <4 or bluebird
    // since they don't support subclassing
    Promise = require('promise-polyfill');
}

class ChildProcessPromise extends Promise {
    constructor(executor) {
        var resolve;
        var reject;

        super((_resolve, _reject) => {
            resolve = _resolve;
            reject = _reject;

            if (executor) {
                executor(resolve, reject);
            }
        });

        this._cpResolve = resolve;
        this._cpReject = reject;
        this.childProcess = undefined;
    }

    progress(callback) {
        process.nextTick(() => {
            callback(this.childProcess);
        });

        return this;
    }

    then(onFulfilled, onRejected) {
        var newPromise = super.then(onFulfilled, onRejected);
        newPromise.childProcess = this.childProcess;
        return newPromise;
    }

    catch(onRejected) {
        var newPromise = super.catch(onRejected);
        newPromise.childProcess = this.childProcess;
        return newPromise;
    }

    done() {
        this.catch((e) => {
            process.nextTick(() => {
                throw e;
            });
        });
    }
}

ChildProcessPromise.prototype.fail = ChildProcessPromise.prototype.catch;

module.exports = ChildProcessPromise;
