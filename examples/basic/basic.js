'use strict';

(function() {
	window.addEventListener('load', function() {
		var movable = document.getElementById('box');
		new Knob(function(value) {
			movable.style.left = value + 'px';
		});
	});
})();
