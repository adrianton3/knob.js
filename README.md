knob.js
-------

Compact controller with recording and playback capabilities.

See [the Knob](http://madflame991.github.io/knob.js/examples/basic/basic.html) in action!

###Usage:

Include *knob.js* in your html:

```html
 <script src="knob.js"></script>
```

And create a knob to control your favourite variable:

```js
 var favouriteVar;
 new Knob(function(v) { favouriteVar = v; });
```