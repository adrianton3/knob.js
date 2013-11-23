// Knob.js Copyright (c) 2013, Adrian Toncean
// Available under the MIT license

(function () {
	'use strict';

	function Key(time, value) {
    this.time = time;
    this.value = value;
	}

	function Knob() {
		var args = arguments;

		this.callback = null;

		var obj, propertyName, callback;

		if (args.length === 1) {
			if (typeof args[0] === 'object') {
				if (typeof args[0].object !== 'undefined') {
					obj = args[0].object;
					propertyName = args[0].propertyName;
					this.name = propertyName;
					if (typeof args[0].callback !== 'undefined') {
						callback = args[0].callback;
						this.callback = function(value) { obj[propertyName] = callback(value); };
					} else {
						this.callback = function(value) { obj[propertyName] = value; };
					}
				} else {
					this.callback = args[0].callback;
				}

				this.name = args[0].name || this.name;
				this.recording = args[0].recording;
				this.position = args[0].position;
				this.radius = args[0].radius;
			} else if (typeof args[0] === 'function') {
				this.callback = args[0];
			}
		} else if (typeof args[0] === 'object' && typeof args[1] === 'string') {
			obj = args[0];
			propertyName = args[1];
			if (typeof args[0] === 'function') {
				callback = args[2];
				this.callback = function(value) { obj[propertyName] = callback(value); };
			} else {
				this.callback = function(value) { obj[propertyName] = value; };
			}
		}

		this.mouseState = {
			ix: undefined,
	    iy: undefined,
			ox: undefined,
	    oy: undefined,
	    x: undefined,
	    y: undefined,
	    down: false
		};

 		this.position = this.position || getPosition();
		this.recording = this.recording || [];
		this.radius = this.radius || 23;

		this.recordingOn = false;
		this.currentIndex = 0;

		this.knobElements = createHTML({
			width: this.radius * 2,
			height: this.radius * 2,
			name: this.name || '---',
			position: this.position
		});

		if (this.recording.length === 0) {
			this.knobElements.replayElement.classList.add('knobreplayingna');
		}

		this.con2d = this.knobElements.knobElement.getContext('2d');
		this.con2d.lineCap = 'round';

		this.knobValue = 0;

		this.draw(this.knobValue);

		this.knobElements.knobElement.addEventListener('mousedown', onDown.bind(this));
		document.addEventListener('mousemove', onMove.bind(this));
		document.addEventListener('mouseup', onUp.bind(this));
		this.knobElements.recordElement.addEventListener('mousedown', onRecord.bind(this));
		this.knobElements.replayElement.addEventListener('mousedown', onReplay.bind(this));
	}

	Knob.prototype.addSample = function(time, value) {
		this.recording.push(new Key(time, value));
	};

	Knob.prototype.setAt = function(value) {
		this.knobValue = value;
		this.draw(this.knobValue);
		this.knobElements.valueElement.innerHTML = this.knobValue;
		this.callback(this.knobValue);
	};

	Knob.prototype.replay = function() {
		var i = 0;
		var loop = function() {
			this.setAt(this.recording[i].value);
			i++;
			if (i < this.recording.length) {
				setTimeout(loop, this.recording[i].time - this.recording[i - 1].time);
			} else {
				this.knobElements.replayElement.classList.remove('knobreplayingon');
				this.knobElements.recordElement.classList.remove('knobrecordingna');
				this.replaying = false;
			}
		}.bind(this);

		loop();
	};

	Knob.prototype.draw = function() {
		this.con2d.clearRect(0, 0, this.radius * 2, this.radius * 2);

		this.con2d.save();
		this.con2d.translate(this.radius, this.radius);
		this.con2d.rotate(Math.PI + this.knobValue / 100);

		this.con2d.strokeStyle = 'hsl(200, 100%, 2%)';
		this.con2d.lineWidth = 2;
		this.con2d.beginPath();
		this.con2d.arc(0, 0, this.radius - 2, 0, 2 * Math.PI, false);
		this.con2d.fill();
		this.con2d.stroke();

		this.con2d.lineWidth = 1;
		this.con2d.strokeStyle = 'hsl(200, 100%, 100%)';
		this.con2d.fillStyle = 'hsl(200, 100%, 10%)';
		this.con2d.beginPath();
		this.con2d.arc(0, 0, this.radius - 4, 0, 2 * Math.PI, false);
		this.con2d.fill();
		this.con2d.stroke();

		this.con2d.lineWidth = 4;
		this.con2d.beginPath();
		this.con2d.moveTo(0, 8);
		this.con2d.lineTo(0, this.radius - 8);
		this.con2d.stroke();

		this.con2d.restore();
	};

	var positionCounter = 0;
	function getPosition() {
		return { top: positionCounter++ * 52 + 8 };
	}

	function onDown(e) {
		e.preventDefault();
		e.stopPropagation();

		if (!this.replaying) {
			this.mouseState.down = true;
			if (this.recordingButtonOn) {
				this.recordingOn = true;
			}

			this.mouseState.x = e.clientX;
			this.mouseState.y = e.clientY;
			this.mouseState.ox = this.mouseState.x;
			this.mouseState.oy = this.mouseState.y;
			this.mouseState.ix = this.mouseState.x;
			this.mouseState.iy = this.mouseState.y;
		}

		return false;
	}

	function onMove(e) {
		this.mouseState.ox = this.mouseState.x;
		this.mouseState.oy = this.mouseState.y;
		this.mouseState.x = e.clientX;
		this.mouseState.y = e.clientY;

		if (this.mouseState.down) {
			this.setAt(this.knobValue + this.mouseState.ox - this.mouseState.x);
		}

		if (this.recordingOn) {
			this.addSample(window.performance.now(), this.knobValue);
		}
	}

	function onUp(e) {
		this.mouseState.down = false;

		if (this.recording.length) {
			this.knobElements.recordElement.classList.remove('knobrecordingon');
			this.knobElements.replayElement.classList.remove('knobreplayingna');
			this.recordingButtonOn = false;
			this.recordingOn = false;
		}
	}

	function onRecord(e) {
		e.preventDefault();
		e.stopPropagation();

		if (!this.replaying) {
			if (this.recordingButtonOn) {
				this.knobElements.recordElement.classList.remove('knobrecordingon');
				this.knobElements.replayElement.classList.add('knobreplayingna');
				this.recordingButtonOn = false;
			} else {
				this.knobElements.recordElement.classList.add('knobrecordingon');
				this.knobElements.replayElement.classList.add('knobreplayingna');
				this.recordingButtonOn = true;
				this.recording = [];
			}
		}

		return false;
	}

	function onReplay(e) {
		e.preventDefault();
		e.stopPropagation();

		if (!this.replaying && this.recording.length) {
			this.knobElements.replayElement.classList.add('knobreplayingon');
			this.knobElements.recordElement.classList.add('knobrecordingna');
			this.replaying = true;
			this.replay();
		}

		return false;
	}

	function createHTML(options) {
		var bundleElement = document.createElement('div');
		bundleElement.style.position = 'fixed';

		if (options.position && options.position.top) {
			bundleElement.style.top = options.position.top + 'px';
		} else {
			bundleElement.style.top = '10px';
		}

		if (options.position && options.position.left) {
			bundleElement.style.left = options.left + 'px';
		} else if (options.position.right) {
			bundleElement.style.right = options.right + 'px';
		} else {
			bundleElement.style.right = '28px';
		}

		bundleElement.style.width = '100px';

		document.body.appendChild(bundleElement);

		// name
		var nameElement = document.createElement('span');
		nameElement.classList.add('knoblabel');
		nameElement.classList.add('knobname');
		nameElement.innerHTML = options.name;

		bundleElement.appendChild(nameElement);

		// value
		var valueElement = document.createElement('span');
		valueElement.classList.add('knoblabel');
		valueElement.classList.add('knobvalue');
		valueElement.innerHTML = '---';

		bundleElement.appendChild(valueElement);

		// knob
		var knobElement = document.createElement('canvas');
		knobElement.classList.add('knobcanvas');
		knobElement.width = options.width;
		knobElement.height = options.height;

		bundleElement.appendChild(knobElement);

		// record
		var recordElement = document.createElement('span');
		recordElement.classList.add('knobbutton');
		recordElement.classList.add('knobrecordbutton');

		var recordSymbolElement = document.createElement('span');
		recordSymbolElement.classList.add('knobrecordsymbol');

		recordElement.appendChild(recordSymbolElement);

		bundleElement.appendChild(recordElement);

		// replay
		var replayElement = document.createElement('span');
		replayElement.classList.add('knobbutton');
		replayElement.classList.add('knobreplaybutton');

		var replaySymbolElement = document.createElement('span');
		replaySymbolElement.classList.add('knobreplaysymbol');

		replayElement.appendChild(replaySymbolElement);

		bundleElement.appendChild(replayElement);

		return {
			knobElement: knobElement,
			nameElement: nameElement,
			valueElement: valueElement,
			recordElement: recordElement,
			replayElement: replayElement
		};
	}

	window.Knob = Knob;
})();
