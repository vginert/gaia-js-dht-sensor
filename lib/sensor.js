/**
 * The MIT License
 *
 * Copyright (c) 2017 Vicente Giner Tendero
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var TAG = "DHT_sensor";

var Gaia = require('gaia-js'),
    Logger = Gaia.Logger,
    Utils = Gaia.Utils,
    sensor = require('node-dht-sensor');

var INTERVAL = 2000;

var DHTsensor = module.exports = function DHTsensor(opts) {
	DHTsensor.__super__.constructor.apply(this, arguments);
	this.initSensor(opts)
	this.initAttributesAndCommands();
}

Utils.inherit(DHTsensor, Gaia.Device);

DHTsensor.prototype.start = function() {
	this.controlInterval = setInterval((function(self) {
	   return function() {
	       self.updateValues();
	   }
	})(this), this.updateTimeInterval);
	Logger.log(TAG, this.name + ' sensor started.');
}

DHTsensor.prototype.halt = function() {
	clearInterval(this.controlInterval);
}

DHTsensor.prototype.updateValues = function() {
	var self = this;
	sensor.read(this.model, this.pin, function(err, temperature, humidity) {
		if (!err) {
			self.temperature = temperature;
			self.humidity = humidity;
			self.runCallbacks();
		    Logger.debug(TAG, self.name + " temperature: " + temperature);
		    Logger.debug(TAG, self.name + " humidity: " + humidity);
		} else {
			Logger.error(TAG, self.name + " read error: " + err);
		}
	});
}

DHTsensor.prototype.runCallbacks = function() {
	var self = this;
	this.onUpdateValuesCallbacks.forEach(function(callback) {
		callback(self.temperature, self.humidity);
	});
}

DHTsensor.prototype.addOnUpdateValuesCallback = function(callback) {
    this.onUpdateValuesCallbacks.push(callback);
}

DHTsensor.prototype.removeOnUpdateValuesCallback = function(callback) {
    this.onUpdateValuesCallbacks.splice(this.onUpdateValuesCallbacks.indexOf(callback), 1);
}

DHTsensor.prototype.initSensor = function(opts) {
	this.updateTimeInterval = opts.interval || INTERVAL;
	if(!opts.model) {
		throw new Error("DHT sensor model is required");
	}
	this.model = opts.model;
	if(!opts.pin) {
		throw new Error("DHT sensor pin is required");
	}
	this.pin = opts.pin;
	this.temperature = NaN;
	this.humidity = NaN;
	this.onUpdateValuesCallbacks = [];
	Logger.debug(TAG, "Sensor interval time: " + this.updateTimeInterval);
}

DHTsensor.prototype.initAttributesAndCommands = function() {
	DHTsensor.__super__.initAttributesAndCommands.apply(this, arguments);
	this.attributes = {
		humidity: this.humidity,
		temperature: this.temperature
	};
	this.commands = {};
}
