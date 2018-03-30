import Animator from "./Animator";
import Frame from "./Frame";
import {
	isUndefined,
	isObject,
	isString,
	isArray,
	isPercent,
	fill,
} from "./utils";
import PropertyObject from "./PropertyObject";
import FrameTimeline from "./FrameTimeline";
import {dotValue} from "./utils/dot";
import {TYPE_PROPERTY_OBJECT, TYPE_ARRAY} from "./consts";


export function getDefaultData(infos, fillText = 0) {
	const {type, size, separator} = infos;

	if (type === TYPE_PROPERTY_OBJECT) {
		return new PropertyObject(fill(new Array(size), fillText), separator);
	} else if (type === TYPE_ARRAY) {
		return fill(new Array(size), fillText);
	} else {
		return fillText;
	}
}
/**
* manage Frame Timeline and play Timeline.
* @extends Animator
*/
class SceneItem extends Animator {
	/**
	* Create a scene's item.
	* @param {Object} properties - properties
	* @example
let item = new Scene.SceneItem({
	0: {
		display: "none",
	},
	1: {
		display: "block",
		opacity: 0,
	},
	2: {
		opacity: 1,
	}
});
	*/
	constructor(properties, options) {
		super();
		this.timeline = new FrameTimeline();
		this.load(properties, options);
	}
	/**
	* Specifies how many seconds an animation takes to complete one cycle
	* Specifies timeline's lastTime
	*/
	getDuration() {
		return Math.max(this.state.duration, this.timeline.getLastTime());
	}
	setDuration(duration) {
		const originalDuration = this.getDuration();
		const ratio = duration / originalDuration;
		const timeline = this.timeline;
		const {times, items} = timeline;
		const obj = {};

		timeline.times = times.map(time => {
			const time2 = time * ratio;

			obj[time2] = items[time];

			return time2;
		});
		timeline.items = obj;
		super.setDuration(duration);
	}
	setId(id) {
		this.options.id = id;
	}
	/**
	* set properties to the sceneItem at that time
	* @param {Number} time - time
	* @param {String|Object} role - property role or properties
	* @param {String|Object} [properties] - property's name or properties
	* @param {Object} [value] - property's value
	* @return {SceneItem} An instance itself
	* @example
item.duration; // = item.timeline.size()
	*/
	set(time, role, properties, value) {
		if (isArray(time)) {
			time.forEach(t => {
				this.set(t, role, properties, value);
			});
			return this;
		} else if (isObject(time)) {
			this.load(time);
			return this;
		}
		const frame = this.getFrame(time) || this.newFrame(time);

		frame.set(role, properties, value);
		this.updateFrame(frame);
		return this;
	}
	get(time, role, properties) {
		const frame = this.getFrame(time);

		return frame && frame.get(role, properties);
	}
	remove(time, role, properties) {
		const frame = this.getFrame(time);

		frame && frame.remove(role, properties);
		return this;
	}
	animate(time, parentEasing) {
		const iterationTime = this.getIterationTime();
		const easing = this.getEasing() || parentEasing;
		const frame = this.getNowFrame(iterationTime, easing);

		if (!frame) {
			return frame;
		}
		this.trigger("animate", {
			frame,
			time: iterationTime,
			currentTime: this.getTime(),
		});
		return frame;
	}
	setTime(time, parentEasing) {
		super.setTime(time);

		this.animate(time, parentEasing);
		return this;
	}
	/**
	* update property names used in frames.
	* @return {SceneItem} An instance itself
	* @example
item.update();
	*/
	update() {
		this.timeline.update();
		return this;
	}
	/**
	* update property names used in frame.
	* @param {Number} time - frame's time
	* @param {Frame} [frame] - frame of that time.
	* @return {SceneItem} An instance itself
	* @example
item.updateFrame(time, this.get(time));
	*/
	updateFrame(frame) {
		this.timeline.updateFrame(frame);
		return this;
	}
	/**
	* create and add a frame to the sceneItem at that time
	* @param {Number} time - frame's time
	* @return {Frame} Created frame.
	* @example
item.newFrame(time);
	*/
	newFrame(time) {
		let frame = this.getFrame(time);

		if (frame) {
			return frame;
		}
		frame = new Frame();
		if (!isUndefined(time)) {
			this.setFrame(time, frame);
		}
		return frame;
	}
	/**
	* add a frame to the sceneItem at that time
	* @param {Number} time - frame's time
	* @return {SceneItem} An instance itself
	* @example
item.setFrame(time, frame);
	*/
	setFrame(time, frame) {
		this.timeline.add(time, frame);
		return this;
	}
	_getTime(time, options = {}) {
		const duration = options.duration || this.getDuration() || 100;

		if (isString(time)) {
			if (isPercent(time)) {
				!this.state.duration && (this.state.duration = duration);
				return parseFloat(time) / 100 * duration;
			} else if (time === "from") {
				return 0;
			} else if (time === "to") {
				return duration;
			}
		}
		return parseFloat(time);
	}
	/**
	* get sceneItem's frame at that time
	* @param {Number} time - frame's time
	* @return {Frame} sceneItem's frame at that time
	* @example
const frame = item.getFrame(time);
	*/
	getFrame(time) {
		return this.timeline.get(this._getTime(time));
	}
	/**
	* check if the item has a frame at that time
	* @param {Number} time - frame's time
	* @return {Boolean} true: the item has a frame // false: not
	* @example
if (item.hasFrame(10)) {
	// has
} else {
	// not
}
	*/
	hasFrame(time) {
		return this.timeline.has(time);
	}
	/**
	* remove sceneItem's frame at that time
	* @param {Number} time - frame's time
	* @return {SceneItem} An instance itself
	* @example
item.removeFrame(time);
	*/
	removeFrame(time) {
		const timeline = this.timeline;

		timeline.remove(time);
		timeline.update();
		delete this.frames[time];

		return this;
	}
	/**
	* Copy frame of the previous time at the next time.
	* @param {Number} fromTime - the previous time
	* @param {Number} toTime - the next time
	* @return {SceneItem} An instance itself
	* @example
// getFrame(0) equal getFrame(1)
item.copyFrame(0, 1);
	*/
	copyFrame(fromTime, toTime) {
		let time;

		if (isObject(fromTime)) {
			for (time in fromTime) {
				this.copyFrame(time, fromTime[time]);
			}
			return this;
		}
		const frame = this.getFrame(fromTime);

		if (!frame) {
			return this;
		}
		const copyFrame = frame.clone();

		this.setFrame(toTime, copyFrame);
		return this;
	}
	/**
	* merge frame of the previous time at the next time.
	* @param {Number} fromTime - the previous time
	* @param {Number} toTime - the next time
	* @return {SceneItem} An instance itself
	* @example
// getFrame(1) contains getFrame(0)
item.merge(0, 1);
	*/
	mergeFrame(fromTime, toTime) {
		let time;

		if (isObject(fromTime)) {
			for (time in fromTime) {
				this.mergeFrame(time, fromTime[time]);
			}
			return this;
		}
		const frame = this.getFrame(fromTime);

		if (!frame) {
			return this;
		}
		const toFrame = this.newFrame(toTime);

		toFrame.merge(frame);
		return this;
	}
	getNowValue(role, property, time, left = 0,
		right = this.timeline.size(), easing = this.state.easing) {
		const timeline = this.timeline;
		const times = timeline.times;
		const length = times.length;

		let prevFrame;
		let nextFrame;

		let prevTime = times[left];
		let nextTime = times[right];

		if (time < prevTime) {
			return undefined;
		}
		for (let i = left; i >= 0; --i) {
			prevTime = times[i];
			prevFrame = timeline.get(prevTime);
			if (prevFrame.has(role, property)) {
				break;
			}
		}
		for (let i = right; i < length; ++i) {
			nextTime = times[i];
			nextFrame = timeline.get(nextTime);
			if (nextFrame.has(role, property)) {
				break;
			}
		}
		const prevValue = prevFrame.get(role, property);

		if (isUndefined(prevValue)) {
			return undefined;
		}
		if (!nextFrame) {
			return prevValue;
		}
		const nextValue = nextFrame.get(role, property);

		if (isUndefined(nextValue) || prevValue === nextValue) {
			return prevValue;
		}
		if (prevTime < 0) {
			prevTime = 0;
		}
		const startTime = times[left];
		const endTime = times[right];
		const easingFunction = this.state.easing || easing;

		return dotValue({
			time,
			prevTime,
			nextTime,
			startTime,
			endTime,
			prevValue,
			nextValue,
			easing: easingFunction,
		});
	}
	getNearIndex(time) {
		const timeline = this.timeline;
		const {times} = timeline;
		const last = timeline.getLastTime();
		const length = timeline.size();

		if (length === 0) {
			return undefined;
		}
		// index : length = time : last
		let index = parseInt(last > 0 ? time * length / last : 0, 10);
		let right = length - 1;
		let left = 0;

		if (index < 0) {
			index = 0;
		} else if (index > right) {
			index = right;
		}
		if (time < times[right]) {
			// Binary Search
			while (left < right) {
				if ((left === index || right === index) && (left + 1 === right)) {
					if (time < times[left]) {
						right = left;
					}
					break;
				} else if (times[index] > time) {
					right = index;
				} else if (times[index] < time) {
					left = index;
				} else {
					right = index;
					left = right;
					break;
				}
				index = parseInt((left + right) / 2, 10);
			}
		} else {
			index = right;
			left = index;
		}

		return {left, right};
	}
	getFillFrame(fillText = 0) {
		const frame = this.newFrame();
		const names = this.timeline.names;
		const roles = frame.properties;

		for (const role in roles) {
			const properties = names[role];

			if (!properties) {
				continue;
			}
			for (const name in properties) {
				frame.set(role, name, getDefaultData(properties[name], fillText));
			}
		}
		return frame;
	}
	_getNowFrame(time, easing) {
		const prevTime = this.timeline.getLastTime();
		const nextTime = this.state.duration;
		const prevFrame = this.getNowFrame(prevTime);
		const nextFrame = this.getFrame(0) || this.getFillFrame(0);
		const frame = this.newFrame();
		const names = this.timeline.names;

		for (const role in names) {
			const properties = names[role];

			for (const name in properties) {
				let nextValue = nextFrame.get(role, name);

				if (typeof nextValue === "undefined") {
					nextValue = getDefaultData(properties[name], 0);
				}
				frame.set(role, name, dotValue({
					time,
					prevTime,
					nextTime,
					easing,
					prevValue: prevFrame.get(role, name),
					nextValue,
				}));
			}
		}
		return frame;
	}
	/**
	* Get frame of the current time
	* @param {Number} time - the current time
	* @return {Frame} frame of the current time
	* @example
let item = new Scene.SceneItem({
	0: {
		display: "none",
	},
	1: {
		display: "block",
		opacity: 0,
	},
	2: {
		opacity: 1,
	}
});
// opacity: 0.7; display:"block";
const frame = item.getNowFrame(1.7);
	*/
	getNowFrame(time, easing) {
		if (this.timeline.getLastTime() < time && time <= this.state.duration) {
			return this._getNowFrame(time, easing);
		}
		const indices = this.getNearIndex(time);

		if (!indices) {
			return indices;
		}
		const {left, right} = indices;
		const frame = this.newFrame();
		const names = this.timeline.names;

		for (const role in names) {
			const propertyNames = names[role];

			for (const property in propertyNames) {
				const value = this.getNowValue(role, property, time, left, right, easing);

				if (isUndefined(value)) {
					continue;
				}
				frame.set(role, property, value);
			}
		}
		return frame;
	}
	/**
	* load properties
	* @param {Object} properties - properties
	* @example
item.load({
	0: {
		display: "none",
	},
	1: {
		display: "block",
		opacity: 0,
	},
	2: {
		opacity: 1,
	}
});
	*/
	load(properties = {}, options = properties.options) {
		this.setOptions(options);
		if (Array.isArray(properties)) {
			const length = properties.length;

			for (let i = 0; i < length; ++i) {
				const time = length === 1 ? 0 : this._getTime(`${i / (length - 1) * 100}%`, options);

				this.set(time, properties[i]);
			}
			return this;
		}
		for (const time in properties) {
			if (time === "options") {
				continue;
			}
			const _properties = properties[time];
			const realTime = this._getTime(time);

			if (typeof _properties === "number") {
				this.mergeFrame(_properties, realTime);
				continue;
			}
			this.set(realTime, properties[time]);
		}
		return this;
	}
}

export default SceneItem;
