"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.machineId = exports.machineIdSync = void 0;
var child_process_1 = require("child_process");
var crypto_1 = require("crypto");
var reg = require("native-reg");
var platform = process.platform;
var guid = {
    darwin: 'ioreg -rd1 -c IOPlatformExpertDevice',
    linux: '( cat /var/lib/dbus/machine-id /etc/machine-id 2> /dev/null || hostname ) | head -n 1 || :',
    freebsd: 'kenv -q smbios.system.uuid || sysctl -n kern.hostuuid'
};
function hash(guid) {
    return crypto_1.createHash('sha256').update(guid).digest('hex');
}
function expose(result) {
    switch (platform) {
        case 'darwin':
            return result
                .split('IOPlatformUUID')[1]
                .split('\n')[0].replace(/\=|\s+|\"/ig, '')
                .toLowerCase();
        case 'win32':
            return result
                .toString()
                .split('REG_SZ')[1]
                .replace(/\r+|\n+|\s+/ig, '')
                .toLowerCase();
        case 'linux':
            return result
                .toString()
                .replace(/\r+|\n+|\s+/ig, '')
                .toLowerCase();
        case 'freebsd':
            return result
                .toString()
                .replace(/\r+|\n+|\s+/ig, '')
                .toLowerCase();
        default:
            throw new Error("Unsupported platform: " + process.platform);
    }
}
function windowsMachineId() {
    return reg.getValue(reg.HKEY.LOCAL_MACHINE, "SOFTWARE\\Microsoft\\Cryptography", "MachineGuid").toString();
}
/**
 * This function gets the OS native UUID/GUID synchronously, hashed by default.
 * @param {boolean} [original=false] If true return original value of machine id, otherwise return hashed value (sha - 256)
 */
function machineIdSync(original) {
    if (original === void 0) { original = false; }
    var id = platform === "win32"
        ? windowsMachineId()
        : expose(child_process_1.execSync(guid[platform]).toString());
    return original ? id : hash(id);
}
exports.machineIdSync = machineIdSync;
/**
 * This function gets the OS native UUID/GUID asynchronously (recommended), hashed by default.
 *
 * Note: on windows this is still synchronous
 * @param {boolean} [original=false] If true return original value of machine id, otherwise return hashed value (sha - 256)
 *
 */
function machineId(original) {
    if (original === void 0) { original = false; }
    return new Promise(function (resolve, reject) {
        if (platform === "win32") {
            try {
                return resolve(windowsMachineId());
            }
            catch (error) {
                return reject(error);
            }
        }
        return child_process_1.exec(guid[platform], {}, function (err, stdout, stderr) {
            if (err) {
                return reject(new Error("Error while obtaining machine id: " + err.stack));
            }
            var id = expose(stdout.toString());
            return resolve(original ? id : hash(id));
        });
    });
}
exports.machineId = machineId;
