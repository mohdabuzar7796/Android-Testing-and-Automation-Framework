/** var Promise = require('bluebird')
var adb = require('adbkit')
var client = adb.createClient()
var apk = 'vendor/app.apk'
var fs = require('fs')

/// Checking for NFC support
client.listDevices().then(function(devices) {
    return Promise.filter(devices, function(device) {
        return client.getFeatures(device.id).then(function(features) {
            return features['android.hardware.nfc']
        })
    })
})
.then(function(supportedDevices) {
    console.log('The devices support NFC:', supportedDevices)
})
.catch(function(err) {
    console.error('Something went wrong', err.stack)
})


// Connecting to the given device

client.connect(host[5555][])


/// Installing an APK

client.listDevices().then(function(devices) {
    return Promise.map(devices, function(device) {
        return client.install(device.id, apk)
    })
})
.then(function() {
    console.log('Installed %s on al devices', apk)
})
.catch(function(err) {
    console.error('Something went wrong:', err.stack)
})


/// Tracking devices

client.trackDevices().then(function(tracker) {
    tracker.on('add', function(device) {
        console.log('Device %s was plugged in', device.id)
    })
    tracker.on('end', function() {
        console.log('Tracking stopped')
    })
})
.catch(function(err) {
    console.error('Something went wrong:', err.stack)
})


/// Pulling a file from all connected devices

client.listDevices().then(function(devices) {
    return Promise.map(devices, function(device) {
        return client.pull(device.id, '/system/build.prop').then(function(transfer) {
            return new Promise(function(resolve, reject) {
                var fn = '/tmp/' + device.id + '.build.prop'
                transfer.on('progress', function(stats) {
                    console.log('[%s] Pulled %d bytes so far', device.id, stats.bytesTransferred)
                })
                transfer.on('end', function() {
                    console.log('[%s] Pull complete', device.id)
                    resolve(devices.id)
                })
                transfer.on('error', reject)
                transfer.pipe(fs.createWriteStream(fn))
            })
        })
    })
})
.then(function() {
    console.log('Done pulling /system/build.prop from all connected devices')
})
.catch(function(err) {
    console.error('Something went wrong:', err.stack)
})


/// Pushing a file to all connected devices

client.listDevices().then(function(devices) {
    return Promise.map(devices, function(device) {
        return client.push(device.id, 'temp/foo.txt', '/data/local/tmp/foo.txt')
        .then(function(transfer) {
            return new Promise(function(resolve, reject) {
                transfer.on('progress', function(stats) {
                    console.log('[%s] Pushed %d bytes so far', devices.id, stats.bytesTransferred)
                })
                transfer.on('end', function() {
                    console.log('[%s] Push completed', device.id)
                    resolve()
                })
                transfer.on('error', reject)
            })
        })
    })
})
.then(function() {
    console.log('Done pushing foo.txt to all connected devices')
})
.catch(function(err) {
    console.error('Something went wrong:', err.stack)
})


/// List files in a folder

client.listDevices().then(function(devices) {
    return Promise.map(device.id, function(device) {
        return client.readdir(device.id, '/sdcard').then(function(files) {
            // Synchronous, so we don't have to care about returning at the right time
            files.forEach(function(file) {
                if (file.isFile()) {
                    console.log('[%s] Found file "%s"', device.id, file.name)
                }
            })
        })
    })
})
.then(function() {
    console.log('Done checking /sdcard files on connected devices')
})
.catch(function(err) {
    console.error('Something went wrong:', err.stack)
}) **/


const adb = require('adbkit');
const client = adb.createClient();

async function clickOnDevice(deviceId, x, y) {
  try {
    // Execute the tap command with given coordinates
    await client.shell(deviceId, `input tap ${x} ${y}`);
    console.log(`Tapped on (${x}, ${y}) on device ${deviceId}`);
  } catch (err) {
    console.error(`Failed to tap on (${x}, ${y}) on device ${deviceId}:`, err);
  }
}

// Example usage
const deviceId = 'your-device-id-here';  // Replace with your actual device ID
const x = 100; // Replace with your desired x coordinate
const y = 200; // Replace with your desired y coordinate

clickOnDevice(deviceId, x, y);
