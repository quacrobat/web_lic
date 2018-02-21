/* global module: false */

// eslint-disable-next-line no-implicit-globals, no-undef
util = (function() {
'use strict';

const util = {
	isEmpty(p) {
		if (typeof p === 'number') {
			return false;
		} else if (typeof p === 'boolean') {
			return !p;
		} else if (Array.isArray(p) || typeof p === 'string') {
			return p.length <= 0;
		}
		for (const x in p) {
			if (p.hasOwnProperty(x)) {
				return false;
			}
		}
		return true;
	},
	toArray(fakeArray) {
		return [].slice.apply(fakeArray);
	},
	array: {
		insert(array, item, idx) {
			array.splice(idx, 0, item);
		},
		remove(array, item) {
			const idx = array.indexOf(item);
			if (idx >= 0) {
				array.splice(idx, 1);
			}
		},
		eq(a, b) {
			if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
				return false;
			}
			for (var i = 0; i < a.length; i++) {
				if (a[i] !== b[i]) {
					return false;
				}
			}
			return true;
		}
	},
	itemEq(a, b) {
		return a && b && a.id === b.id && a.type === b.type;
	},
	measureLabel: (() => {
		const labelSizeCache = {};  // {font: {text: {width: 10, height: 20}}}
		return function(font, text) {
			if (labelSizeCache[font] && labelSizeCache[font][text]) {
				return labelSizeCache[font][text];
			}
			const container = document.getElementById('fontMeasureContainer');
			container.style.font = font;
			container.firstChild.textContent = text;
			const res = container.getBBox();
			res.width = Math.ceil(res.width);
			res.height = Math.ceil(res.height);
			labelSizeCache[font] = labelSizeCache[font] || {};
			labelSizeCache[font][text] = res;
			return res;
		};
	})(),
	fontToFontParts: (() => {

		const boldList = ['bold', 'bolder', 'lighter', '100', '200', '300', '400', '500', '600', '700', '800', '900'];
		const sizeList = ['medium', 'xx-small', 'x-small', 'small', 'large', 'x-large', 'xx-large', 'smaller', 'larger'];
		const stretchList = ['ultra-condensed', 'extra-condensed', 'condensed', 'semi-condensed', 'semi-expanded', 'expanded', 'extra-expanded', 'ultra-expanded'];

		return function(font = '') {
			const fullFontParts = {fontStyle: '', fontVariant: '', fontWeight: '', fontStretch: '', fontSize: '', fontFamily: ''};
			var haveFontSize = false;
			font = (font || '') + '';

			var fontParts = font.split(/ (?=(?:[^'"]|'[^']*'|"[^"]*")*$)/);
			fontParts.map(el => {
				if (!el || typeof el !== 'string') {
					return;
				}
				const elLower = el.toLowerCase();
				if (elLower === 'italic' || elLower === 'oblique') {
					fullFontParts.fontStyle = el;
				} else if (elLower === 'small-caps') {
					fullFontParts.fontVariant = el;
				} else if (boldList.includes(elLower)) {
					fullFontParts.fontWeight = el;
				} else if (stretchList.includes(elLower)) {
					fullFontParts.fontStretch = elLower;
				} else if (sizeList.includes(elLower)) {
					fullFontParts.fontSize = elLower;
					haveFontSize = true;
				} else if (el) {
					if (!haveFontSize) {
						fullFontParts.fontSize = el;
						haveFontSize = true;
					} else {
						fullFontParts.fontFamily = el;
					}
				}
			});

			fullFontParts.toString = function() {
				let family = this.fontFamily.trim();
				if (family.includes(' ') && family[0] !== '"' && family[0] !== "'") {
					family = `"${family}"`;  // Font families that contain spaces must be quoted
				}
				return [this.fontStyle, this.fontVariant, this.fontWeight, this.fontStretch, this.fontSize, family].join(' ').trim();
			};
			return fullFontParts;
		};
	})(),
	emptyNode(node) {
		if (node) {
			while (node.firstChild) {
				node.removeChild(node.firstChild);
			}
		}
	},
	roundedRect(ctx, x, y, w, h, r) {
		ctx.beginPath();
		ctx.arc(x + r, y + r, r, Math.PI, 3 * Math.PI / 2);
		ctx.arc(x + w - r, y + r, r, 3 * Math.PI / 2, 0);
		ctx.arc(x + w - r, y + h - r, r, 0, Math.PI / 2);
		ctx.arc(x + r, y + h - r, r, Math.PI / 2, Math.PI);
		ctx.closePath();
	},
	clone(obj) {
		return JSON.parse(JSON.stringify(obj));
	},
	sort: {
		numeric: {
			ascending(a, b) {
				return a - b;
			},
			descending(a, b) {
				return b - a;
			}
		}
	},
	formatTime(start, end) {
		const t = end - start;
		if (t >= 1000) {
			return (t / 1000).toFixed(2) + 's';
		}
		return t + 'ms';
	},
	prettyPrint(s) {  // Human readable versions of common internal strings
		s = s + '';
		switch (s.toLowerCase()) {
			case 'csi':
				return 'CSI';
			case 'pli':
				return 'PLI';
			case 'pliitem':
				return 'PLI Item';
			case 'pliqty':
				return 'PLI Quantity Label';
			case 'stepnumber':
				return 'Step Number';
			case 'pagenumber':
				return 'Page Number';
		}
		if (s.startsWith('ctrl+')) {
			return 'Ctrl + ' + s.charAt(s.length - 1).toUpperCase();
		}
		return s.replace(/([^\W_]+[^\s-]*) */g, function(el) {
			// Use Title Case for generic strings
			return el.charAt(0).toUpperCase() + el.substr(1).toLowerCase();
		});
	}
};

if (typeof module !== 'undefined' && module.exports != null) {
	module.exports = util;
}

return util;

})();
